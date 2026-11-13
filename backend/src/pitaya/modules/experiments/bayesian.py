"""Beta-Binomial observational comparison."""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class BetaBinomialPosterior:
    campaign_id: int
    successes: float
    trials: float
    posterior_mean: float
    posterior_std: float
    credible_interval_95: tuple[float, float]


def beta_binomial_posterior(
    campaign_id: int,
    successes: float,
    trials: float,
    alpha0: float = 1.0,
    beta0: float = 1.0,
    samples: int = 5000,
    seed: int = 42,
) -> BetaBinomialPosterior:
    post_a = alpha0 + successes
    post_b = beta0 + max(0.0, trials - successes)
    mean = post_a / (post_a + post_b)
    var = (post_a * post_b) / ((post_a + post_b) ** 2 * (post_a + post_b + 1))
    rng = np.random.default_rng(seed)
    draws = rng.beta(post_a, post_b, size=samples)
    lo, hi = float(np.percentile(draws, 2.5)), float(np.percentile(draws, 97.5))
    return BetaBinomialPosterior(
        campaign_id=campaign_id,
        successes=successes,
        trials=trials,
        posterior_mean=float(mean),
        posterior_std=float(var**0.5),
        credible_interval_95=(lo, hi),
    )


def probability_b_greater_than_a(
    rate_a: float, rate_b: float, n_a: float, n_b: float, seed: int = 42
) -> float:
    rng = np.random.default_rng(seed)
    draws_a = rng.beta(1 + rate_a * n_a, 1 + n_a - rate_a * n_a, size=8000)
    draws_b = rng.beta(1 + rate_b * n_b, 1 + n_b - rate_b * n_b, size=8000)
    return float(np.mean(draws_b > draws_a))
