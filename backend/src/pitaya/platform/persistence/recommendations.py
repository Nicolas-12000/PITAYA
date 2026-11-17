"""Recommendation records with idempotency in memory (+ optional SQLite / PostgreSQL)."""

import json
import sqlite3
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any

from pitaya.kernel.config import get_settings
from pitaya.platform.persistence._sqlite_path import resolve_sqlite_path
from pitaya.platform.storage.factory import ActiveStorageMode, resolve_storage_mode

_SQLITE_CREATE = """
CREATE TABLE IF NOT EXISTS recommendations (
  idempotency_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL
)
"""
_POSTGRES_CREATE = """
CREATE TABLE IF NOT EXISTS recommendations (
  idempotency_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL
)
"""


@dataclass
class RecommendationRecord:
    idempotency_key: str
    payload: dict[str, Any]
    persisted: bool
    updated_at: str = ""


class RecommendationRepository:
    def __init__(self) -> None:
        self._memory: dict[str, RecommendationRecord] = {}
        self._mode = resolve_storage_mode()

    def get(self, key: str) -> RecommendationRecord | None:
        in_mem = self._memory.get(key)
        if in_mem:
            return in_mem

        settings = get_settings()
        loaded = self._load_from_sqlite(key, settings) or self._load_from_postgres(key, settings)
        if loaded:
            self._memory[key] = loaded
            return loaded
        return None

    def save(self, key: str, payload: dict[str, Any]) -> RecommendationRecord:
        existing = self.get(key)
        if existing and existing.payload != payload:
            raise ValueError("idempotency_key_conflict")

        record = RecommendationRecord(
            idempotency_key=key,
            payload=payload,
            persisted=False,
            updated_at=datetime.now(UTC).isoformat(),
        )
        settings = get_settings()

        if self._mode == ActiveStorageMode.SQLITE:
            record.persisted = self._save_sqlite(record, settings)
        elif self._mode == ActiveStorageMode.POSTGRES:
            record.persisted = self._save_postgres(record, settings)

        self._memory[key] = record
        return record

    def list_all(self) -> list[dict[str, Any]]:
        self._hydrate_sqlite()
        items = [asdict(v) for v in self._memory.values()]
        items.sort(key=lambda item: item.get("updated_at") or "", reverse=True)
        return items

    def _hydrate_sqlite(self) -> None:
        if self._mode != ActiveStorageMode.SQLITE:
            return
        settings = get_settings()
        path = resolve_sqlite_path(settings.database_url)
        if not path or not path.exists():
            return
        conn = sqlite3.connect(path)
        try:
            self._ensure_sqlite(conn)
            rows = conn.execute(
                "SELECT idempotency_key, payload, updated_at FROM recommendations"
            ).fetchall()
        except sqlite3.OperationalError:
            return
        finally:
            conn.close()
        for key, raw, updated_at in rows:
            if key not in self._memory:
                self._memory[key] = RecommendationRecord(
                    idempotency_key=key,
                    payload=json.loads(raw),
                    persisted=True,
                    updated_at=updated_at or "",
                )

    def _ensure_sqlite(self, conn: sqlite3.Connection) -> None:
        conn.execute(_SQLITE_CREATE)
        columns = {row[1] for row in conn.execute("PRAGMA table_info(recommendations)")}
        if "updated_at" not in columns:
            conn.execute(
                "ALTER TABLE recommendations ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''"
            )

    def _save_sqlite(self, record: RecommendationRecord, settings: Any) -> bool:
        path = resolve_sqlite_path(settings.database_url)
        if not path:
            return False
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
        try:
            self._ensure_sqlite(conn)
            conn.execute(
                """
                INSERT INTO recommendations (idempotency_key, payload, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(idempotency_key) DO UPDATE SET
                  payload = excluded.payload,
                  updated_at = excluded.updated_at
                """,
                (record.idempotency_key, json.dumps(record.payload), record.updated_at),
            )
            conn.commit()
            return True
        finally:
            conn.close()

    def _load_from_sqlite(self, key: str, settings: Any) -> RecommendationRecord | None:
        path = resolve_sqlite_path(settings.database_url)
        if not path or not path.exists():
            return None
        conn = sqlite3.connect(path)
        try:
            self._ensure_sqlite(conn)
            row = conn.execute(
                "SELECT payload, updated_at FROM recommendations WHERE idempotency_key = ?",
                (key,),
            ).fetchone()
            if not row:
                return None
            return RecommendationRecord(
                idempotency_key=key,
                payload=json.loads(row[0]),
                persisted=True,
                updated_at=row[1] or "",
            )
        finally:
            conn.close()

    def _save_postgres(self, record: RecommendationRecord, settings: Any) -> bool:
        conn = self._postgres_connect(settings)
        if conn is None:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(_POSTGRES_CREATE)
                cur.execute(
                    "ALTER TABLE recommendations "
                    "ADD COLUMN IF NOT EXISTS updated_at TEXT NOT NULL DEFAULT ''"
                )
                cur.execute(
                    """
                    INSERT INTO recommendations (idempotency_key, payload, updated_at)
                    VALUES (%s, %s::jsonb, %s)
                    ON CONFLICT (idempotency_key) DO UPDATE SET
                      payload = EXCLUDED.payload,
                      updated_at = EXCLUDED.updated_at
                    """,
                    (record.idempotency_key, json.dumps(record.payload), record.updated_at),
                )
            conn.commit()
            return True
        finally:
            conn.close()

    def _load_from_postgres(self, key: str, settings: Any) -> RecommendationRecord | None:
        conn = self._postgres_connect(settings)
        if conn is None:
            return None
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT payload::text FROM recommendations WHERE idempotency_key = %s",
                    (key,),
                )
                row = cur.fetchone()
            if not row:
                return None
            return RecommendationRecord(
                idempotency_key=key,
                payload=json.loads(row[0]),
                persisted=True,
            )
        finally:
            conn.close()

    def _postgres_connect(self, settings: Any) -> Any:
        if self._mode != ActiveStorageMode.POSTGRES:
            return None
        url = settings.database_url.strip()
        if not url.startswith("postgresql"):
            return None
        try:
            import psycopg
        except ImportError:
            return None
        return psycopg.connect(url)
