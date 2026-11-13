from pathlib import Path

import pytest

from pitaya.cli.__main__ import main
from pitaya.kernel.config import get_settings


def test_cli_verify_idempotent_ok() -> None:
    assert main(["verify_idempotent"]) == 0


def test_cli_train_ok() -> None:
    assert main(["train"]) == 0


def test_cli_ingest_from_fixture(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    snap = tmp_path / "snap"
    monkeypatch.setenv("SNAPSHOT_DIR", str(snap))
    get_settings.cache_clear()
    source = Path("tests/fixtures/sample_ads.csv")
    assert main(["ingest", "--source", str(source)]) == 0
    assert (snap / "ads.csv.gz").exists()
    assert (snap / "quality_report.json").exists()
    get_settings.cache_clear()
