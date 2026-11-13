"""CRISP-DM data preparation: validation rules and cleaning report."""

import re
from dataclasses import dataclass, field

import pandas as pd

VALID_CAMPAIGN_IDS = frozenset({916, 936, 1178})
VALID_GENDERS = frozenset({"male", "female"})
AGE_PATTERN = re.compile(r"^\d+-\d+$")


@dataclass
class DataQualityReport:
    rows_in: int
    rows_out: int
    rows_dropped: int
    drop_reasons: dict[str, int] = field(default_factory=dict)
    duplicate_ad_ids: int = 0
    missing_approved: int = 0
    logical_violations_flagged: dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> dict[str, object]:
        return {
            "rows_in": self.rows_in,
            "rows_out": self.rows_out,
            "rows_dropped": self.rows_dropped,
            "drop_reasons": self.drop_reasons,
            "duplicate_ad_ids": self.duplicate_ad_ids,
            "missing_approved_before_clean": self.missing_approved,
            "logical_violations_flagged": self.logical_violations_flagged,
        }


def _parse_campaign_id(value: object) -> int | None:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def clean_facebook_ads_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, DataQualityReport]:
    """Apply domain rules; drop misaligned Kaggle rows (common when conversions are null)."""
    report = DataQualityReport(rows_in=len(df), rows_out=0, rows_dropped=0)
    out = df.copy()

    report.duplicate_ad_ids = int(out["ad_id"].duplicated().sum()) if "ad_id" in out.columns else 0
    if report.duplicate_ad_ids:
        out = out.drop_duplicates(subset=["ad_id"], keep="first")

    report.missing_approved = (
        int(out["Approved_Conversion"].isna().sum()) if "Approved_Conversion" in out.columns else 0
    )

    reasons: dict[str, int] = {}

    def drop_mask(name: str, mask: pd.Series) -> pd.DataFrame:
        nonlocal out
        count = int(mask.sum())
        if count:
            reasons[name] = count
            out = out.loc[~mask]
        return out

    if "xyz_campaign_id" in out.columns:
        campaign_ids = out["xyz_campaign_id"].map(_parse_campaign_id)
        invalid_campaign = ~campaign_ids.isin(VALID_CAMPAIGN_IDS)
        out = drop_mask("invalid_campaign_id", invalid_campaign)

    if "gender" in out.columns:
        invalid_gender = ~out["gender"].astype(str).str.lower().isin(VALID_GENDERS)
        out = drop_mask("invalid_gender", invalid_gender)

    if "age" in out.columns:
        invalid_age = ~out["age"].astype(str).str.match(AGE_PATTERN)
        out = drop_mask("invalid_age_band", invalid_age)

    if "Approved_Conversion" in out.columns:
        missing_target = out["Approved_Conversion"].isna()
        out = drop_mask("missing_approved_conversion", missing_target)

    if {"Clicks", "Impressions"}.issubset(out.columns):
        bad_ctr = out["Clicks"] > out["Impressions"]
        report.logical_violations_flagged["clicks_gt_impressions"] = int(bad_ctr.sum())
        out = drop_mask("clicks_gt_impressions", bad_ctr)

    if {"Approved_Conversion", "Total_Conversion"}.issubset(out.columns):
        both = out["Total_Conversion"].notna()
        bad_conv = both & (out["Approved_Conversion"] > out["Total_Conversion"])
        report.logical_violations_flagged["approved_gt_total"] = int(bad_conv.sum())
        out = drop_mask("approved_gt_total", bad_conv)

    negative_spend = out["Spent"] < 0 if "Spent" in out.columns else pd.Series(dtype=bool)
    if len(negative_spend):
        out = drop_mask("negative_spent", negative_spend)

    report.drop_reasons = reasons
    report.rows_out = len(out)
    report.rows_dropped = report.rows_in - report.rows_out

    return out, report
