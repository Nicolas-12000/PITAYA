import numpy as np

from pitaya.kernel.stats import beta_binomial_mean, bootstrap_mean
from pitaya.modules.experiments.domain import sample_size_duration_simulator


def test_bootstrap_mean_interval() -> None:
    values = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    rng = np.random.default_rng(42)
    mean, lo, hi = bootstrap_mean(values, 500, rng)
    assert lo <= mean <= hi


def test_beta_binomial_shrinkage() -> None:
    rate = beta_binomial_mean(successes=2, trials=100)
    assert 0 < rate < 0.1


def test_sample_size_simulator_positive() -> None:
    result = sample_size_duration_simulator(0.05, 0.1, daily_traffic=200)
    assert result["n_per_group"] > 0
