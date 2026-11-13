"""Shared statistical helpers (frequentist + Holm)."""

import numpy as np


def holm_bonferroni(p_values: list[float], alpha: float = 0.05) -> list[bool]:
    """Return rejected hypotheses in input order."""
    m = len(p_values)
    if m == 0:
        return []
    indexed = sorted(enumerate(p_values), key=lambda x: x[1])
    rejected = [False] * m
    for rank, (idx, p_val) in enumerate(indexed, start=1):
        threshold = alpha / (m - rank + 1)
        if p_val <= threshold:
            rejected[idx] = True
        else:
            break
    return rejected


def bootstrap_mean(
    values: np.ndarray,
    n_resamples: int,
    rng: np.random.Generator,
) -> tuple[float, float, float]:
    """Mean and percentile CI."""
    if len(values) == 0:
        return 0.0, 0.0, 0.0
    boots = np.array(
        [rng.choice(values, size=len(values), replace=True).mean() for _ in range(n_resamples)]
    )
    return (
        float(np.mean(values)),
        float(np.percentile(boots, 2.5)),
        float(np.percentile(boots, 97.5)),
    )


def beta_binomial_mean(
    successes: float, trials: float, alpha0: float = 1.0, beta0: float = 1.0
) -> float:
    if trials <= 0:
        return alpha0 / (alpha0 + beta0)
    post_a = alpha0 + successes
    post_b = beta0 + (trials - successes)
    return post_a / (post_a + post_b)
