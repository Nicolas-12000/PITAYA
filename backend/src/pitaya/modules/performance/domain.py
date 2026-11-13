from typing import Any

import pandas as pd


def compute_global_kpis(
    df: pd.DataFrame,
    value_per_approved_conversion: float,
) -> dict[str, Any]:
    spent = float(df["Spent"].sum())
    clicks = float(df["Clicks"].sum())
    impressions = float(df["Impressions"].sum())
    approved = float(df["Approved_Conversion"].sum())
    revenue = approved * value_per_approved_conversion
    return {
        "impressions": impressions,
        "clicks": clicks,
        "spent": spent,
        "approved_conversions": approved,
        "estimated_revenue": revenue,
        "ctr": _safe_rate(clicks, impressions),
        "cvr": _safe_rate(approved, clicks),
        "cpc": _safe_rate(spent, clicks),
        "roas": _safe_rate(revenue, spent),
        "value_per_approved_conversion": value_per_approved_conversion,
    }


def _safe_rate(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def compute_group_kpis(
    group: pd.DataFrame,
    value_per_approved_conversion: float,
) -> dict[str, Any]:
    spent = float(group["Spent"].sum())
    clicks = float(group["Clicks"].sum())
    impressions = float(group["Impressions"].sum())
    approved = float(group["Approved_Conversion"].sum())
    revenue = approved * value_per_approved_conversion
    return {
        "impressions": impressions,
        "clicks": clicks,
        "spent": spent,
        "approved_conversions": approved,
        "estimated_revenue": revenue,
        "ctr": _safe_rate(clicks, impressions),
        "cvr": _safe_rate(approved, clicks),
        "cpc": _safe_rate(spent, clicks),
        "cpa": _safe_rate(spent, approved),
        "roas": _safe_rate(revenue, spent),
    }


def aggregate_by_dimensions(
    df: pd.DataFrame,
    dimensions: list[str],
    value_per_approved_conversion: float,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for keys, group in df.groupby(dimensions, dropna=False):
        if not isinstance(keys, tuple):
            keys = (keys,)
        entry: dict[str, Any] = {dim: keys[i] for i, dim in enumerate(dimensions)}
        entry["kpis"] = compute_group_kpis(group, value_per_approved_conversion)
        entry["row_count"] = len(group)
        rows.append(entry)
    rows.sort(key=lambda r: r["kpis"]["spent"], reverse=True)
    return rows


def compare_by_campaign(
    df: pd.DataFrame,
    value_per_approved_conversion: float,
    campaign_column: str = "xyz_campaign_id",
) -> list[dict[str, Any]]:
    return aggregate_by_dimensions(
        df,
        dimensions=[campaign_column],
        value_per_approved_conversion=value_per_approved_conversion,
    )
