import pandas as pd

from pitaya.kernel.stats import holm_bonferroni
from pitaya.modules.attribution.api import compute_attribution
from pitaya.modules.budget.api import recommend_budget
from pitaya.modules.catalog.domain import add_conversion_target


def test_shapley_level_a() -> None:
    df = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    result = compute_attribution(df, model="shapley")
    assert result["level"] == "A"
    assert len(result["shapley_shares"]) == 4


def test_synthetic_level_b_labeled() -> None:
    df = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    result = compute_attribution(df, model="linear")
    assert result["data_source"] == "simulated"
    assert "Datos simulados" in result["disclaimer"]


def test_budget_recommendation() -> None:
    base = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    df = pd.concat([base] * 6, ignore_index=True)
    plan = recommend_budget(
        df, total_budget=1000.0, value_per_approved_conversion=50.0, max_share=0.6
    )
    assert plan["total_budget"] == 1000.0
    assert len(plan["allocations"]) >= 1


def test_holm_correction() -> None:
    assert holm_bonferroni([0.01, 0.04, 0.03]) == [True, False, False]
