"""Offline model comparison statistics."""

import numpy as np
from scipy.stats import wilcoxon


def compare_models_wilcoxon(
    scores_a: np.ndarray,
    scores_b: np.ndarray,
) -> dict[str, float | None]:
    if len(scores_a) != len(scores_b) or len(scores_a) < 5:
        return {"statistic": None, "p_value": None}
    try:
        stat, p_value = wilcoxon(scores_a, scores_b, zero_method="wilcox", alternative="two-sided")
        return {"statistic": float(stat), "p_value": float(p_value)}
    except ValueError:
        return {"statistic": None, "p_value": None}
