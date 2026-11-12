from pathlib import Path

import pandas as pd

from pitaya.kernel.hashing import sha256_file
from pitaya.modules.catalog.domain import DatasetSummary, load_csv, summarize_dataset


def load_dataset_from_path(path: Path) -> pd.DataFrame:
    return load_csv(path)


def dataset_summary(df: pd.DataFrame) -> DatasetSummary:
    return summarize_dataset(df)


def dataset_content_hash(path: Path) -> str:
    return sha256_file(path)
