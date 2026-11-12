from dataclasses import dataclass

import pandas as pd
from scipy import stats


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


def _campaign_subset(df: pd.DataFrame, campaign_id: int) -> pd.DataFrame:
    return df.loc[df["xyz_campaign_id"] == campaign_id]


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


def compare_conversion_rates(
    df: pd.DataFrame,
    campaign_a: int,
    campaign_b: int,
) -> ProportionComparison:
    """Two-proportion z-test on CVR (approved / clicks) per campaign."""
    a = _campaign_subset(df, campaign_a)
    b = _campaign_subset(df, campaign_b)
    successes_a = float(a["Approved_Conversion"].sum())
    trials_a = float(a["Clicks"].sum())
    successes_b = float(b["Approved_Conversion"].sum())
    trials_b = float(b["Clicks"].sum())
    rate_a = successes_a / trials_a if trials_a else 0.0
    rate_b = successes_b / trials_b if trials_b else 0.0
    z_stat, p_value = _two_proportion_z_test(successes_a, trials_a, successes_b, trials_b)
    return ProportionComparison(
        campaign_a=campaign_a,
        campaign_b=campaign_b,
        metric="cvr",
        rate_a=rate_a,
        rate_b=rate_b,
        z_statistic=z_stat,
        p_value=p_value,
        significant_at_005=p_value < 0.05,
    )
