"""Level B: synthetic multi-touch journeys (labeled simulated)."""

from typing import Any

import numpy as np
import pandas as pd


def _touch_weights(model: str, n_touches: int) -> np.ndarray:
    if n_touches <= 0:
        return np.array([1.0])
    idx = np.arange(n_touches, dtype=float)
    if model == "first_touch":
        w = np.zeros(n_touches)
        w[0] = 1.0
        return w
    if model == "last_touch":
        w = np.zeros(n_touches)
        w[-1] = 1.0
        return w
    if model == "linear":
        return np.ones(n_touches) / n_touches
    if model == "time_decay":
        weights = 0.5 ** idx[::-1]
        return weights / weights.sum()
    if model == "position_based":
        if n_touches == 1:
            return np.array([1.0])
        w = np.full(n_touches, (1 - 0.4) / max(n_touches - 2, 1))
        w[0] = 0.2
        w[-1] = 0.2
        return w / w.sum()
    return np.ones(n_touches) / n_touches


def synthetic_journey_attribution(
    seed: int, journeys: int = 300, model: str = "linear"
) -> dict[str, Any]:
    rng = np.random.default_rng(seed)
    channels = np.array(
        ["facebook_campaign_916", "facebook_campaign_936", "facebook_campaign_1178"]
    )
    rows: list[dict[str, Any]] = []
    for _ in range(journeys):
        n_touches = int(rng.integers(1, 5))
        touches = rng.choice(channels, size=n_touches, replace=True)
        converted = bool(rng.random() < 0.25)
        weights = _touch_weights(model, n_touches)
        for touch, weight in zip(touches, weights, strict=True):
            rows.append({"touch": touch, "credit": float(weight), "converted": converted})
    frame = pd.DataFrame(rows)
    credits = frame.groupby("touch")["credit"].sum()
    total = float(credits.sum()) or 1.0
    return {
        "level": "B",
        "data_source": "simulated",
        "disclaimer": "Datos simulados",
        "model": model,
        "attribution_credits": {k: float(v / total) for k, v in credits.items()},
        "journeys": journeys,
        "random_seed": seed,
    }


def markov_journey_attribution(seed: int, journeys: int = 300) -> dict[str, Any]:
    """Markov-style credit from simulated transition counts between channel states."""
    rng = np.random.default_rng(seed)
    channels = [
        "facebook_campaign_916",
        "facebook_campaign_936",
        "facebook_campaign_1178",
    ]
    transition = np.array(
        [
            [0.45, 0.30, 0.25],
            [0.25, 0.45, 0.30],
            [0.30, 0.25, 0.45],
        ]
    )
    credit = {name: 0.0 for name in channels}
    for _ in range(journeys):
        state = int(rng.integers(0, 3))
        steps = int(rng.integers(2, 6))
        for _ in range(steps):
            nxt = int(rng.choice(3, p=transition[state]))
            credit[channels[nxt]] += 1.0
            state = nxt
    total = sum(credit.values()) or 1.0
    return {
        "level": "B",
        "data_source": "simulated",
        "disclaimer": "Datos simulados",
        "model": "markov",
        "markov_transition_matrix": transition.tolist(),
        "attribution_credits": {k: v / total for k, v in credit.items()},
        "journeys": journeys,
        "random_seed": seed,
    }
