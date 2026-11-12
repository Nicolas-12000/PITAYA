"""ROI and segment KPIs."""

from typing import Any

import pandas as pd

from pitaya.modules.performance.domain import (
    aggregate_by_dimensions,
    compare_by_campaign,
    compute_global_kpis,
)

DEFAULT_SEGMENT_DIMENSIONS = ("xyz_campaign_id", "age", "gender", "interest")


def compute_global_kpis_api(
    df: pd.DataFrame,
    value_per_approved_conversion: float,
) -> dict[str, Any]:
    return compute_global_kpis(df, value_per_approved_conversion)


def segment_stats(
    df: pd.DataFrame,
    value_per_approved_conversion: float,
    dimensions: tuple[str, ...] = DEFAULT_SEGMENT_DIMENSIONS,
) -> list[dict[str, Any]]:
    return aggregate_by_dimensions(
        df,
        list(dimensions),
        value_per_approved_conversion=value_per_approved_conversion,
    )


def channel_compare(
    df: pd.DataFrame,
    value_per_approved_conversion: float,
) -> dict[str, Any]:
    campaigns = compare_by_campaign(df, value_per_approved_conversion)
    return {
        "channel": "facebook",
        "disclaimer": "dataset_contains_facebook_only",
        "campaigns": campaigns,
    }
