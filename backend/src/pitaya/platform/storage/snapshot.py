import gzip
import shutil
from pathlib import Path

import pandas as pd

from pitaya.kernel.config import get_settings
from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.kernel.hashing import csv_content_hash
from pitaya.modules.catalog.api import load_dataset_from_path


def snapshot_root() -> Path:
    return get_settings().resolved_snapshot_dir()


def ads_gz_path() -> Path:
    return snapshot_root() / "ads.csv.gz"


def ads_csv_path() -> Path:
    return snapshot_root() / "ads.csv"


def manifest_path() -> Path:
    return snapshot_root() / "manifest.json"


def write_compressed_snapshot(csv_path: Path) -> Path:
    root = snapshot_root()
    root.mkdir(parents=True, exist_ok=True)
    dest = ads_gz_path()
    # mtime=0 keeps the .gz byte-identical across runs (idempotent ingest).
    with csv_path.open("rb") as src, gzip.GzipFile(dest, "wb", mtime=0) as out:
        shutil.copyfileobj(src, out)
    return dest


def load_snapshot_dataframe() -> pd.DataFrame:
    gz = ads_gz_path()
    csv = ads_csv_path()
    if gz.exists():
        with gzip.open(gz, "rt", encoding="utf-8") as handle:
            return pd.read_csv(handle)
    if csv.exists():
        return load_dataset_from_path(csv)
    raise SnapshotNotFoundError(
        f"No snapshot found at {gz} or {csv}. Run `make ingest` after placing the Kaggle CSV."
    )


def snapshot_dataset_hash() -> str | None:
    """Content hash of the snapshot rows (same for ads.csv and ads.csv.gz)."""
    gz = ads_gz_path()
    if gz.exists():
        return csv_content_hash(gz)
    csv = ads_csv_path()
    if csv.exists():
        return csv_content_hash(csv)
    return None
