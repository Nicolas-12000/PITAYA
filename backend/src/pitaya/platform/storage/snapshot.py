import gzip
import shutil
from pathlib import Path

import pandas as pd

from pitaya.kernel.config import get_settings
from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.kernel.hashing import sha256_file
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
    with csv_path.open("rb") as src, gzip.open(dest, "wb") as out:
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
    gz = ads_gz_path()
    if gz.exists():
        return sha256_file(gz)
    csv = ads_csv_path()
    if csv.exists():
        return sha256_file(csv)
    return None
