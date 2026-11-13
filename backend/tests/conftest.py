"""Session snapshot for CI and clean checkouts: ingest + train on real Kaggle excerpt."""

from __future__ import annotations

import os
from pathlib import Path

import pytest

from pitaya.cli.__main__ import main
from pitaya.kernel.config import get_settings

_FIXTURE_CSV = Path(__file__).resolve().parent / "fixtures" / "sample_ads.csv"


@pytest.fixture(scope="session", autouse=True)
def _session_snapshot(tmp_path_factory: pytest.TempPathFactory) -> Path:
    snap = tmp_path_factory.mktemp("pitaya_snapshot")
    os.environ["SNAPSHOT_DIR"] = str(snap)
    get_settings.cache_clear()

    gz = snap / "ads.csv.gz"
    manifest = snap / "manifest.json"
    if not gz.exists():
        assert main(["ingest", "--source", str(_FIXTURE_CSV)]) == 0
    if not manifest.exists():
        assert main(["train"]) == 0

    get_settings.cache_clear()
    yield snap
    get_settings.cache_clear()
