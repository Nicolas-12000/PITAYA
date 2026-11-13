from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy import stats

from pitaya.kernel.stats import bootstrap_mean, holm_bonferroni


@dataclass(frozen=True)
class ProportionComparison:
    campaign_a: int
    campaign_b: int
    metric: str
    rate_a: float
    rate_b: float
    z_statistic: float
    p_value: float
    significant_at_005: bool
    holm_significant: bool = False


def _campaign_subset(df: pd.DataFrame, campaign_id: int) -> pd.DataFrame:
    col = df["xyz_campaign_id"].astype(str) == str(campaign_id)
    return df.loc[col]


def _two_proportion_z_test(
    successes_a: float,
    trials_a: float,
    successes_b: float,
    trials_b: float,
) -> tuple[float, float]:
    if trials_a <= 0 or trials_b <= 0:
        return 0.0, 1.0
    p_a = successes_a / trials_a
    p_b = successes_b / trials_b
    p_pool = (successes_a + successes_b) / (trials_a + trials_b)
    variance = p_pool * (1 - p_pool) * (1 / trials_a + 1 / trials_b)
    if variance <= 0:
        return 0.0, 1.0
    z_stat = (p_a - p_b) / (variance**0.5)
    p_value = float(2 * (1 - stats.norm.cdf(abs(z_stat))))
    return float(z_stat), p_value


def _compare_metric(
    df: pd.DataFrame,
    campaign_a: int,
    campaign_b: int,
    metric: str,
) -> ProportionComparison:
    a = _campaign_subset(df, campaign_a)
    b = _campaign_subset(df, campaign_b)
    if metric == "ctr":
        successes_a = float(a["Clicks"].sum())
        trials_a = float(a["Impressions"].sum())
        successes_b = float(b["Clicks"].sum())
        trials_b = float(b["Impressions"].sum())
    elif metric == "cvr":
        successes_a = float(a["Approved_Conversion"].sum())
        trials_a = float(a["Clicks"].sum())
        successes_b = float(b["Approved_Conversion"].sum())
        trials_b = float(b["Clicks"].sum())
    else:
        raise ValueError(f"Unsupported metric: {metric}")

    rate_a = successes_a / trials_a if trials_a else 0.0
    rate_b = successes_b / trials_b if trials_b else 0.0
    z_stat, p_value = _two_proportion_z_test(successes_a, trials_a, successes_b, trials_b)
    return ProportionComparison(
        campaign_a=campaign_a,
        campaign_b=campaign_b,
        metric=metric,
        rate_a=rate_a,
        rate_b=rate_b,
        z_statistic=z_stat,
        p_value=p_value,
        significant_at_005=p_value < 0.05,
    )


def compare_conversion_rates(
    df: pd.DataFrame, campaign_a: int, campaign_b: int
) -> ProportionComparison:
    return _compare_metric(df, campaign_a, campaign_b, "cvr")


def bootstrap_cpa_by_campaign(
    df: pd.DataFrame,
    campaign_id: int,
    n_resamples: int,
    seed: int,
) -> dict[str, float]:
    subset = _campaign_subset(df, campaign_id)
    spent = subset["Spent"].to_numpy()
    approved = subset["Approved_Conversion"].to_numpy()
    cpa_rows = np.where(approved > 0, spent / np.maximum(approved, 1e-9), np.nan)
    cpa_rows = cpa_rows[~np.isnan(cpa_rows)]
    if len(cpa_rows) == 0:
        return {"cpa_mean": 0.0, "cpa_ci_low": 0.0, "cpa_ci_high": 0.0}
    rng = np.random.default_rng(seed)
    mean, lo, hi = bootstrap_mean(cpa_rows, n_resamples, rng)
    return {"cpa_mean": mean, "cpa_ci_low": lo, "cpa_ci_high": hi}


def sample_size_duration_simulator(
    baseline_rate: float,
    target_lift: float,
    daily_traffic: int,
    alpha: float = 0.05,
    power: float = 0.8,
) -> dict[str, float]:
    """Approximate two-proportion sample size per group (normal approximation)."""
    p1 = baseline_rate
    p2 = baseline_rate * (1 + target_lift)
    p_bar = (p1 + p2) / 2
    z_alpha = float(stats.norm.ppf(1 - alpha / 2))
    z_beta = float(stats.norm.ppf(power))
    num = (
        z_alpha * np.sqrt(2 * p_bar * (1 - p_bar)) + z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))
    ) ** 2
    denom = (p2 - p1) ** 2 if abs(p2 - p1) > 1e-12 else 1e-12
    n_per_group = float(num / denom)
    days = n_per_group / max(daily_traffic, 1)
    return {
        "n_per_group": n_per_group,
        "estimated_days": days,
        "baseline_rate": p1,
        "target_rate": p2,
        "assumption_alpha": alpha,
        "assumption_power": power,
    }


def apply_holm_correction(comparisons: list[ProportionComparison]) -> list[ProportionComparison]:
    p_values = [c.p_value for c in comparisons]
    holm = holm_bonferroni(p_values)
    updated: list[ProportionComparison] = []
    for comp, sig in zip(comparisons, holm, strict=True):
        updated.append(
            ProportionComparison(
                campaign_a=comp.campaign_a,
                campaign_b=comp.campaign_b,
                metric=comp.metric,
                rate_a=comp.rate_a,
                rate_b=comp.rate_b,
                z_statistic=comp.z_statistic,
                p_value=comp.p_value,
                significant_at_005=comp.significant_at_005,
                holm_significant=sig,
            )
        )
    return updated


def campaign_summary_table(df: pd.DataFrame, campaign_id: int) -> dict[str, float]:
    sub = _campaign_subset(df, campaign_id)
    impressions = float(sub["Impressions"].sum())
    clicks = float(sub["Clicks"].sum())
    spent = float(sub["Spent"].sum())
    approved = float(sub["Approved_Conversion"].sum())
    return {
        "campaign_id": campaign_id,
        "ctr": clicks / impressions if impressions else 0.0,
        "cvr": approved / clicks if clicks else 0.0,
        "cpa": spent / approved if approved else 0.0,
        "spent": spent,
        "approved_conversions": approved,
    }
