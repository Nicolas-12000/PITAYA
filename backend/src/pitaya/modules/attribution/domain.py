"""Level A: exact Shapley over four macro-factors."""

import math
from itertools import combinations
from typing import Any

import pandas as pd

ATTRIBUTION_FACTORS = ("xyz_campaign_id", "age", "gender", "interest")


def _explained_ss(df: pd.DataFrame, coalition: frozenset[str]) -> float:
    """Between-group sum of squares of approved conversions.

    Summing the cell means always recovers the same total, for every coalition,
    so that value cannot tell the factors apart.
    """
    y = df["Approved_Conversion"].astype(float)
    if not coalition or y.empty:
        return 0.0
    grouped = y.groupby([df[col] for col in coalition], dropna=False).transform("mean")
    return float(((grouped - float(y.mean())) ** 2).sum())


def exact_shapley_attribution(df: pd.DataFrame) -> dict[str, Any]:
    factors = list(ATTRIBUTION_FACTORS)
    n = len(factors)
    shapley = {f: 0.0 for f in factors}
    y = df["Approved_Conversion"].astype(float)
    grand_value = _explained_ss(df, frozenset(factors))
    total_ss = float(((y - float(y.mean())) ** 2).sum())
    for factor in factors:
        others = [f for f in factors if f != factor]
        for r in range(len(others) + 1):
            for coalition in combinations(others, r):
                coalition_set = frozenset(coalition)
                with_factor = _explained_ss(df, coalition_set | {factor})
                without_factor = _explained_ss(df, coalition_set)
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
        "grand_total_approved": float(y.sum()),
        "coalition_check_grand_value": grand_value,
        "variance_explained": (grand_value / total_ss) if total_ss else 0.0,
    }
