from typing import Any

import pandas as pd

from pitaya.kernel.config import get_settings
from pitaya.modules.experiments.bayesian import (
    beta_binomial_posterior,
    probability_b_greater_than_a,
)
from pitaya.modules.experiments.domain import (
    ProportionComparison,
    _compare_metric,
    apply_holm_correction,
    bootstrap_cpa_by_campaign,
    campaign_summary_table,
    sample_size_duration_simulator,
)

DEFAULT_CAMPAIGNS = (916, 936, 1178)
METRICS = ("ctr", "cvr")


def run_full_ab_analysis(
    df: pd.DataFrame,
    campaign_ids: tuple[int, ...] = DEFAULT_CAMPAIGNS,
) -> dict[str, Any]:
    settings = get_settings()
    seed = settings.pitaya_random_seed

    comparisons: list[ProportionComparison] = []
    ids = list(campaign_ids)
    for metric in METRICS:
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                comparisons.append(_compare_metric(df, ids[i], ids[j], metric))

    comparisons = apply_holm_correction(comparisons)

    bayesian: list[dict[str, Any]] = []
    for cid in ids:
        sub = df.loc[df["xyz_campaign_id"].astype(str) == str(cid)]
        successes = float(sub["Approved_Conversion"].sum())
        trials = float(sub["Clicks"].sum())
        post = beta_binomial_posterior(cid, successes, trials, seed=seed)
        bayesian.append(
            {
                "campaign_id": cid,
                "successes": successes,
                "trials": trials,
                "posterior_mean": post.posterior_mean,
                "credible_interval_95": post.credible_interval_95,
            }
        )

    pairwise_prob: list[dict[str, Any]] = []
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            sa = bayesian[i]
            sb = bayesian[j]
            prob = probability_b_greater_than_a(
                sa["posterior_mean"],
                sb["posterior_mean"],
                sa["trials"],
                sb["trials"],
                seed=seed,
            )
            pairwise_prob.append(
                {
                    "campaign_a": ids[i],
                    "campaign_b": ids[j],
                    "probability_b_beats_a": prob,
                }
            )

    cpa_bootstrap = {
        str(cid): bootstrap_cpa_by_campaign(df, cid, n_resamples=1000, seed=seed) for cid in ids
    }

    summaries = [campaign_summary_table(df, cid) for cid in ids]
    baseline_ctr = summaries[0]["ctr"] if summaries else 0.01
    simulator = sample_size_duration_simulator(
        baseline_rate=max(baseline_ctr, 1e-6),
        target_lift=0.1,
        daily_traffic=500,
    )

    return {
        "analysis_type": "observational",
        "disclaimer": "not_a_randomized_experiment",
        "campaign_summaries": summaries,
        "frequentist_comparisons": [
            {
                "campaign_a": c.campaign_a,
                "campaign_b": c.campaign_b,
                "metric": c.metric,
                "rate_a": c.rate_a,
                "rate_b": c.rate_b,
                "z_statistic": c.z_statistic,
                "p_value": c.p_value,
                "significant_at_005": c.significant_at_005,
                "holm_significant": c.holm_significant,
            }
            for c in comparisons
        ],
        "bayesian_posteriors": bayesian,
        "bayesian_pairwise": pairwise_prob,
        "bootstrap_cpa": cpa_bootstrap,
        "sample_size_simulator": simulator,
    }


# Backward-compatible alias
def run_pairwise_ab_analysis(
    df: pd.DataFrame,
    campaign_ids: tuple[int, ...] = DEFAULT_CAMPAIGNS,
) -> dict[str, Any]:
    return run_full_ab_analysis(df, campaign_ids)
