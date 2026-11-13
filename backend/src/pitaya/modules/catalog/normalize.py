"""Map Kaggle CSV schema to canonical PITAYA column names."""

import pandas as pd

# Kaggle file inside madislemsalu/facebook-ad-campaign
KAGGLE_HUB_FILE_PATH = "data.csv"

_COLUMN_ALIASES: dict[str, str] = {
    "campaign_id": "xyz_campaign_id",
    "xyz_campaign_id": "xyz_campaign_id",
    "impressions": "Impressions",
    "Impressions": "Impressions",
    "clicks": "Clicks",
    "Clicks": "Clicks",
    "spent": "Spent",
    "Spent": "Spent",
    "approved_conversion": "Approved_Conversion",
    "Approved_Conversion": "Approved_Conversion",
    "total_conversion": "Total_Conversion",
    "Total_Conversion": "Total_Conversion",
    "ad_id": "ad_id",
    "fb_campaign_id": "fb_campaign_id",
    "age": "age",
    "gender": "gender",
}


def normalize_facebook_ads_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out.columns = [str(c).strip() for c in out.columns]

    rename_map = {}
    for col in out.columns:
        key = col.strip()
        if key in _COLUMN_ALIASES:
            canonical = _COLUMN_ALIASES[key]
            if canonical != key:
                rename_map[key] = canonical
        elif key.lower() in _COLUMN_ALIASES:
            rename_map[key] = _COLUMN_ALIASES[key.lower()]

    if rename_map:
        out = out.rename(columns=rename_map)

    if "interest" not in out.columns and "interest1" in out.columns:
        out["interest"] = out["interest1"]

    if "gender" in out.columns:
        out["gender"] = (
            out["gender"]
            .astype(str)
            .str.strip()
            .replace({"M": "male", "F": "female", "m": "male", "f": "female"})
        )

    numeric_cols = ("Impressions", "Clicks", "Spent", "Approved_Conversion", "Total_Conversion")
    for col in numeric_cols:
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce")

    return out
