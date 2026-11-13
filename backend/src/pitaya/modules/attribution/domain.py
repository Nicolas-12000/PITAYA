"""Level A: exact Shapley over four macro-factors."""

import math
from itertools import combinations
from typing import Any

import pandas as pd

ATTRIBUTION_FACTORS = ("xyz_campaign_id", "age", "gender", "interest")


def _coalition_value(df: pd.DataFrame, coalition: frozenset[str]) -> float:
    """Sum of cell-mean predictions using only coalition columns."""
    if not coalition:
        return float(df["Approved_Conversion"].mean() * len(df))
    group_means = df.groupby(list(coalition), dropna=False)["Approved_Conversion"].transform("mean")
    return float(group_means.sum())


def exact_shapley_attribution(df: pd.DataFrame) -> dict[str, Any]:
    factors = list(ATTRIBUTION_FACTORS)
    n = len(factors)
    shapley = {f: 0.0 for f in factors}
    grand_value = _coalition_value(df, frozenset(factors))
    for factor in factors:
        others = [f for f in factors if f != factor]
        for r in range(len(others) + 1):
            for coalition in combinations(others, r):
                coalition_set = frozenset(coalition)
                with_factor = _coalition_value(df, coalition_set | {factor})
                without_factor = _coalition_value(df, coalition_set)
                weight = math.factorial(r) * math.factorial(n - r - 1) / math.factorial(n)
                shapley[factor] += weight * (with_factor - without_factor)
    total = sum(shapley.values()) or 1.0
    shares = {k: v / total for k, v in shapley.items()}
    return {
        "level": "A",
        "data_source": "real",
        "factors": factors,
        "shapley_values": shapley,
        "shapley_shares": shares,
        "grand_total_approved": float(df["Approved_Conversion"].sum()),
        "coalition_check_grand_value": grand_value,
    }
