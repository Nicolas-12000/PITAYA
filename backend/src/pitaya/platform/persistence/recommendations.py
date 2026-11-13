"""Recommendation records with idempotency in memory (+ optional SQLite)."""

import json
import sqlite3
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from pitaya.kernel.config import get_settings
from pitaya.platform.storage.factory import ActiveStorageMode, resolve_storage_mode


@dataclass
class RecommendationRecord:
    idempotency_key: str
    payload: dict[str, Any]
    persisted: bool


class RecommendationRepository:
    def __init__(self) -> None:
        self._memory: dict[str, RecommendationRecord] = {}
        self._mode = resolve_storage_mode()

    def _sqlite_path(self) -> Path | None:
        settings = get_settings()
        url = settings.database_url.strip()
        if not url.startswith("sqlite:///"):
            return None
        rel = url.removeprefix("sqlite:///")
        return Path(rel).resolve()

    def get(self, key: str) -> RecommendationRecord | None:
        in_mem = self._memory.get(key)
        if in_mem:
            return in_mem
        path = self._sqlite_path()
        if path and path.exists():
            conn = sqlite3.connect(path)
            try:
                row = conn.execute(
                    "SELECT payload FROM recommendations WHERE idempotency_key = ?",
                    (key,),
                ).fetchone()
                if row:
                    payload = json.loads(row[0])
                    rec = RecommendationRecord(idempotency_key=key, payload=payload, persisted=True)
                    self._memory[key] = rec
                    return rec
            finally:
                conn.close()
        return None

    def save(self, key: str, payload: dict[str, Any]) -> RecommendationRecord:
        existing = self.get(key)
        if existing and existing.payload != payload:
            raise ValueError("idempotency_key_conflict")

        record = RecommendationRecord(idempotency_key=key, payload=payload, persisted=False)
        path = self._sqlite_path()
        if path and self._mode == ActiveStorageMode.SQLITE:
            path.parent.mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(path)
            try:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS recommendations (
                      idempotency_key TEXT PRIMARY KEY,
                      payload JSON NOT NULL
                    )
                    """
                )
                conn.execute(
                    "INSERT OR REPLACE INTO recommendations VALUES (?, ?)",
                    (key, json.dumps(payload)),
                )
                conn.commit()
                record.persisted = True
            finally:
                conn.close()
        self._memory[key] = record
        return record

    def list_all(self) -> list[dict[str, Any]]:
        return [asdict(v) for v in self._memory.values()]
