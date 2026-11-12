from pathlib import Path

import pandas as pd

from pitaya.modules.modeling._internal.serving import load_pipeline, predict_proba
from pitaya.modules.modeling._internal.train import train_all_models
from pitaya.modules.modeling.domain import FeatureScenario, ModelKind


def run_offline_training(
    df: pd.DataFrame,
    snapshot_dir: Path,
    dataset_hash: str,
    scenario: FeatureScenario = FeatureScenario.INFLIGHT,
) -> dict[str, object]:
    return train_all_models(df, snapshot_dir, dataset_hash, scenario)


def predict_conversion(
    models_dir: Path,
    records: list[dict[str, object]],
    model_kind: ModelKind,
    scenario: FeatureScenario,
) -> list[float]:
    pipeline = load_pipeline(models_dir, model_kind, scenario)
    return predict_proba(pipeline, records, scenario)
