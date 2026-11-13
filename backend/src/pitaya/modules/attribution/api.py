from typing import Any

import pandas as pd

from pitaya.kernel.config import get_settings
from pitaya.modules.attribution.domain import exact_shapley_attribution
from pitaya.modules.attribution.synthetic import synthetic_journey_attribution

SYNTHETIC_MODELS = frozenset(
    {"first_touch", "last_touch", "linear", "time_decay", "position_based", "markov"}
)


def compute_attribution(df: pd.DataFrame, model: str) -> dict[str, Any]:
    settings = get_settings()
    if model == "shapley":
        return exact_shapley_attribution(df)
    if model in SYNTHETIC_MODELS:
        if model == "markov":
            # Markov credit approximated via linear synthetic for small demo
            payload = synthetic_journey_attribution(
                seed=settings.pitaya_random_seed, model="linear"
            )
            payload["model"] = "markov"
            payload["note"] = "markov_approximated_with_synthetic_linear_demo"
            return payload
        return synthetic_journey_attribution(seed=settings.pitaya_random_seed, model=model)
    raise ValueError(f"Unknown attribution model: {model}")
