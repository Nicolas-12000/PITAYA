from typing import Any

import pandas as pd

from pitaya.kernel.config import get_settings
from pitaya.modules.attribution.domain import exact_shapley_attribution
from pitaya.modules.attribution.synthetic import (
    markov_journey_attribution,
    synthetic_journey_attribution,
)

SYNTHETIC_MODELS = frozenset(
    {"first_touch", "last_touch", "linear", "time_decay", "position_based", "markov"}
)


def compute_attribution(df: pd.DataFrame, model: str) -> dict[str, Any]:
    settings = get_settings()
    if model == "shapley":
        return exact_shapley_attribution(df)
    if model in SYNTHETIC_MODELS:
        if model == "markov":
            return markov_journey_attribution(seed=settings.pitaya_random_seed)
        return synthetic_journey_attribution(seed=settings.pitaya_random_seed, model=model)
    raise ValueError(f"Unknown attribution model: {model}")
