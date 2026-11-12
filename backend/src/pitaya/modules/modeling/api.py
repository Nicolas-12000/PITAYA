from pathlib import Path

import pandas as pd

from pitaya.modules.modeling._internal.train import train_all_models
from pitaya.modules.modeling.domain import FeatureScenario


def run_offline_training(
    df: pd.DataFrame,
    snapshot_dir: Path,
    dataset_hash: str,
    scenario: FeatureScenario = FeatureScenario.INFLIGHT,
) -> dict[str, object]:
    return train_all_models(df, snapshot_dir, dataset_hash, scenario)
