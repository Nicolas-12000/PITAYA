import pandas as pd

from pitaya.modules.catalog.domain import add_conversion_target
from pitaya.modules.experiments.api import run_pairwise_ab_analysis
from pitaya.modules.performance.api import segment_stats


def test_segment_stats_groups() -> None:
    path = "tests/fixtures/sample_ads.csv"
    df = add_conversion_target(pd.read_csv(path))
    segments = segment_stats(df, value_per_approved_conversion=50.0)
    assert len(segments) >= 1
    assert "kpis" in segments[0]
    assert "xyz_campaign_id" in segments[0]


def test_ab_pairwise_observational() -> None:
    df = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    result = run_pairwise_ab_analysis(df, campaign_ids=(916, 936, 1178))
    assert result["analysis_type"] == "observational"
    assert len(result["frequentist_comparisons"]) >= 3
