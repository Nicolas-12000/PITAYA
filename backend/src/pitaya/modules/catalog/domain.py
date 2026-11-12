from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from pitaya.kernel.config import LEAKAGE_COLUMNS
from pitaya.kernel.errors import DataValidationError

TARGET_COLUMN = "converted"
APPROVED_COLUMN = "Approved_Conversion"

EXPECTED_COLUMNS = {
    "ad_id",
    "xyz_campaign_id",
    "fb_campaign_id",
    "age",
    "gender",
    "interest",
    "Impressions",
    "Clicks",
    "Spent",
    "Approved_Conversion",
    "Total_Conversion",
}


@dataclass(frozen=True)
class DatasetSummary:
    row_count: int
    column_count: int
    converted_rate: float
    missing_by_column: dict[str, int]


def add_conversion_target(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    if APPROVED_COLUMN not in out.columns:
        raise DataValidationError(f"Missing column: {APPROVED_COLUMN}")
    out[TARGET_COLUMN] = (out[APPROVED_COLUMN] > 0).astype(int)
    return out


def validate_schema(df: pd.DataFrame) -> None:
    missing = EXPECTED_COLUMNS - set(df.columns)
    if missing:
        raise DataValidationError(f"Missing expected columns: {sorted(missing)}")


def drop_leakage_features(feature_names: list[str]) -> list[str]:
    return [c for c in feature_names if c not in LEAKAGE_COLUMNS and c != TARGET_COLUMN]


def summarize_dataset(df: pd.DataFrame) -> DatasetSummary:
    converted_rate = float(df[TARGET_COLUMN].mean()) if TARGET_COLUMN in df.columns else 0.0
    missing = {col: int(df[col].isna().sum()) for col in df.columns}
    return DatasetSummary(
        row_count=len(df),
        column_count=len(df.columns),
        converted_rate=converted_rate,
        missing_by_column=missing,
    )


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise DataValidationError(f"Dataset file not found: {path}")
    df = pd.read_csv(path)
    validate_schema(df)
    return add_conversion_target(df)
