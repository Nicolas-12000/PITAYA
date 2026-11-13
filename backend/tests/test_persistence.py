from pathlib import Path

import pytest

from pitaya.kernel.config import get_settings
from pitaya.platform.persistence.recommendations import RecommendationRepository
from pitaya.platform.sync.outbox import Outbox


def test_idempotency_conflict_raises() -> None:
    repo = RecommendationRepository()
    repo.save("k1", {"a": 1})
    with pytest.raises(ValueError, match="idempotency_key_conflict"):
        repo.save("k1", {"a": 2})


def test_sqlite_persistence_when_configured(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db = tmp_path / "pitaya.db"
    monkeypatch.setenv("STORAGE_MODE", "sqlite")
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db}")
    get_settings.cache_clear()

    repo = RecommendationRepository()
    record = repo.save("key-sqlite", {"budget": 100})
    assert record.persisted is True
    assert db.exists()

    repo2 = RecommendationRepository()
    loaded = repo2.get("key-sqlite")
    assert loaded is not None
    assert loaded.payload["budget"] == 100
    get_settings.cache_clear()


def test_outbox_flush() -> None:
    box = Outbox()
    box.add({"x": 1})
    flushed = box.flush()
    assert len(flushed) == 1
    assert box.pending == []
