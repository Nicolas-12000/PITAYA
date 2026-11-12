"""ROI and segment KPIs — implementation in phase 3."""

from typing import Any

import pandas as pd


def compute_global_kpis(
    df: pd.DataFrame,
    value_per_approved_conversion: float,
) -> dict[str, Any]:
    """Placeholder: CTR, CVR, CPC, ROAS, estimated revenue."""
    spent = float(df["Spent"].sum()) if "Spent" in df.columns else 0.0
    clicks = float(df["Clicks"].sum()) if "Clicks" in df.columns else 0.0
    impressions = float(df["Impressions"].sum()) if "Impressions" in df.columns else 0.0
    approved = float(df["Approved_Conversion"].sum()) if "Approved_Conversion" in df.columns else 0.0
    revenue = approved * value_per_approved_conversion
    ctr = clicks / impressions if impressions else 0.0
    cvr = approved / clicks if clicks else 0.0
    cpc = spent / clicks if clicks else 0.0
    roas = revenue / spent if spent else 0.0
    return {
        "impressions": impressions,
        "clicks": clicks,
        "spent": spent,
        "approved_conversions": approved,
        "estimated_revenue": revenue,
        "ctr": ctr,
        "cvr": cvr,
        "cpc": cpc,
        "roas": roas,
        "value_per_approved_conversion": value_per_approved_conversion,
    }
