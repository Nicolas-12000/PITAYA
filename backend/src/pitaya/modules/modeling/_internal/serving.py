from pathlib import Path

import joblib
import pandas as pd
from sklearn.pipeline import Pipeline

from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.modules.modeling._internal.pipelines import feature_columns_for_scenario
from pitaya.modules.modeling.domain import FeatureScenario, ModelKind


def artifact_path(models_dir: Path, kind: ModelKind, scenario: FeatureScenario) -> Path:
    return models_dir / f"{kind.value}_{scenario.value}.joblib"


def load_pipeline(
    models_dir: Path,
    kind: ModelKind,
    scenario: FeatureScenario,
) -> Pipeline:
    path = artifact_path(models_dir, kind, scenario)
    if not path.exists():
        raise SnapshotNotFoundError(f"Model artifact not found: {path}. Run `make train`.")
    pipeline: Pipeline = joblib.load(path)
    return pipeline


def predict_proba(
    pipeline: Pipeline,
    records: list[dict[str, object]],
    scenario: FeatureScenario,
) -> list[float]:
    if not records:
        return []
    feature_cols = list(feature_columns_for_scenario(scenario))
    frame = pd.DataFrame.from_records(records)
    missing = [c for c in feature_cols if c not in frame.columns]
    if missing:
        raise ValueError(f"Missing feature columns: {missing}")
    probabilities = pipeline.predict_proba(frame[feature_cols])[:, 1]
    return [float(p) for p in probabilities]
