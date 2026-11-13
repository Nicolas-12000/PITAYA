import pandas as pd

from pitaya.modules.attribution.api import compute_attribution
from pitaya.modules.attribution.synthetic import markov_journey_attribution
from pitaya.modules.catalog.domain import add_conversion_target


def test_markov_synthetic_attribution() -> None:
    result = markov_journey_attribution(seed=42, journeys=50)
    assert result["model"] == "markov"
    assert result["data_source"] == "simulated"
    assert abs(sum(result["attribution_credits"].values()) - 1.0) < 1e-6
    assert "markov_transition_matrix" in result


def test_markov_api_entrypoint() -> None:
    df = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    result = compute_attribution(df, model="markov")
    assert result["model"] == "markov"
    assert "markov_transition_matrix" in result
