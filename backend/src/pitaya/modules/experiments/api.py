from typing import Any

import pandas as pd

from pitaya.modules.experiments.domain import ProportionComparison, compare_conversion_rates

DEFAULT_CAMPAIGNS = (916, 936, 1178)


def run_pairwise_ab_analysis(
    df: pd.DataFrame,
    campaign_ids: tuple[int, ...] = DEFAULT_CAMPAIGNS,
) -> dict[str, Any]:
    comparisons: list[dict[str, Any]] = []
    ids = list(campaign_ids)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            result: ProportionComparison = compare_conversion_rates(df, ids[i], ids[j])
            comparisons.append(
                {
                    "campaign_a": result.campaign_a,
                    "campaign_b": result.campaign_b,
                    "metric": result.metric,
                    "rate_a": result.rate_a,
                    "rate_b": result.rate_b,
                    "z_statistic": result.z_statistic,
                    "p_value": result.p_value,
                    "significant_at_005": result.significant_at_005,
                }
            )
    return {
        "analysis_type": "observational",
        "disclaimer": "not_a_randomized_experiment",
        "comparisons": comparisons,
    }
