"""Recommendation records with idempotency in memory (+ optional SQLite / PostgreSQL)."""

import json
import sqlite3
from dataclasses import asdict, dataclass
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

        record = RecommendationRecord(idempotency_key=key, payload=payload, persisted=False)
        settings = get_settings()

        if self._mode == ActiveStorageMode.SQLITE:
            record.persisted = self._save_sqlite(key, payload, settings)
        elif self._mode == ActiveStorageMode.POSTGRES:
            record.persisted = self._save_postgres(key, payload, settings)

        self._memory[key] = record
        return record

    def list_all(self) -> list[dict[str, Any]]:
        return [asdict(v) for v in self._memory.values()]

    def _save_sqlite(self, key: str, payload: dict[str, Any], settings: Any) -> bool:
        path = resolve_sqlite_path(settings.database_url)
        if not path:
            return False
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
        try:
            conn.execute(_SQLITE_CREATE)
            conn.execute(
                "INSERT OR REPLACE INTO recommendations VALUES (?, ?)",
                (key, json.dumps(payload)),
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
            row = conn.execute(
                "SELECT payload FROM recommendations WHERE idempotency_key = ?",
                (key,),
            ).fetchone()
            if not row:
                return None
            return RecommendationRecord(
                idempotency_key=key,
                payload=json.loads(row[0]),
                persisted=True,
            )
        finally:
            conn.close()

    def _save_postgres(self, key: str, payload: dict[str, Any], settings: Any) -> bool:
        conn = self._postgres_connect(settings)
        if conn is None:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(_POSTGRES_CREATE)
                cur.execute(
                    """
                    INSERT INTO recommendations (idempotency_key, payload)
                    VALUES (%s, %s::jsonb)
                    ON CONFLICT (idempotency_key) DO UPDATE SET payload = EXCLUDED.payload
                    """,
                    (key, json.dumps(payload)),
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
