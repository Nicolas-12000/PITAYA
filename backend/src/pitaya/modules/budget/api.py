from typing import Any

import pandas as pd

from pitaya.modules.budget.domain import allocate_budget, build_segment_priors


def recommend_budget(
    df: pd.DataFrame,
    total_budget: float,
    value_per_approved_conversion: float,
    min_share: float = 0.0,
    max_share: float = 1.0,
) -> dict[str, Any]:
    segments = build_segment_priors(df)
    return allocate_budget(
        segments,
        total_budget=total_budget,
        value_per_conversion=value_per_approved_conversion,
        min_share=min_share,
        max_share=max_share,
    )
