"""ROI sensitivity and break-even."""

from typing import Any

import pandas as pd


def roi_sensitivity(
    df: pd.DataFrame,
    value_per_conversion: float,
    multipliers: tuple[float, ...] = (0.5, 0.75, 1.0, 1.25, 1.5, 2.0),
) -> dict[str, Any]:
    spent = float(df["Spent"].sum())
    approved = float(df["Approved_Conversion"].sum())
    scenarios: list[dict[str, float]] = []
    break_even: float | None = None
    for mult in multipliers:
        value = value_per_conversion * mult
        revenue = approved * value
        roi = (revenue - spent) / spent if spent else 0.0
        roas = revenue / spent if spent else 0.0
        scenarios.append(
            {
                "multiplier": mult,
                "value_per_approved_conversion": value,
                "estimated_revenue": revenue,
                "roi": roi,
                "roas": roas,
            }
        )
    if approved > 0:
        break_even = spent / approved
    return {
        "disclaimer": "revenue_is_estimated_not_observed",
        "spent": spent,
        "approved_conversions": approved,
        "base_value_per_conversion": value_per_conversion,
        "break_even_value_per_conversion": break_even,
        "scenarios": scenarios,
    }
