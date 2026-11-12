"""Offline training — not invoked from HTTP handlers."""

import json
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_predict

from pitaya.kernel.config import get_settings
from pitaya.kernel.hashing import stable_test_mask
from pitaya.kernel.metrics import compute_binary_metrics
from pitaya.modules.catalog.domain import TARGET_COLUMN
from pitaya.modules.modeling._internal.pipelines import build_training_pipeline, feature_columns_for_scenario
from pitaya.modules.modeling.domain import FeatureScenario, ModelKind, TrainedModelRecord

DEFAULT_MODELS = (
    ModelKind.DUMMY,
    ModelKind.LOGISTIC_REGRESSION,
    ModelKind.KNN,
    ModelKind.RANDOM_FOREST,
    ModelKind.ADABOOST,
)


def train_all_models(
    df: pd.DataFrame,
    snapshot_dir: Path,
    dataset_hash: str,
    scenario: FeatureScenario = FeatureScenario.INFLIGHT,
) -> dict[str, object]:
    settings = get_settings()
    seed = settings.pitaya_random_seed

    if "ad_id" not in df.columns:
        raise ValueError("ad_id required for stable train/test split")

    test_mask = stable_test_mask(df["ad_id"])
    train_df = df.loc[~test_mask]
    test_df = df.loc[test_mask]

    feature_cols = list(feature_columns_for_scenario(scenario))
    x_train = train_df[feature_cols]
    y_train = train_df[TARGET_COLUMN].to_numpy()
    x_test = test_df[feature_cols]
    y_test = test_df[TARGET_COLUMN].to_numpy()

    models_dir = snapshot_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    records: list[TrainedModelRecord] = []
    sklearn_version = None

    try:
        import sklearn

        sklearn_version = sklearn.__version__
    except ImportError:
        pass

    for kind in DEFAULT_MODELS:
        pipeline = build_training_pipeline(kind, scenario, seed)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        oof_prob = cross_val_predict(
            pipeline,
            x_train,
            y_train,
            cv=cv,
            method="predict_proba",
            n_jobs=-1,
        )[:, 1]
        cv_metrics = compute_binary_metrics(y_train, oof_prob)

        pipeline.fit(x_train, y_train)
        test_prob = pipeline.predict_proba(x_test)[:, 1]
        test_metrics = compute_binary_metrics(y_test, test_prob)

        artifact_name = f"{kind.value}_{scenario.value}.joblib"
        joblib.dump(pipeline, models_dir / artifact_name, compress=3)

        records.append(
            TrainedModelRecord(
                kind=kind,
                scenario=scenario,
                artifact_name=artifact_name,
                metrics={
                    "cv_roc_auc": cv_metrics.roc_auc,
                    "test_roc_auc": test_metrics.roc_auc,
                    "test_f1": test_metrics.f1,
                },
            )
        )

    manifest = {
        "stage": "train",
        "created_at": datetime.now(UTC).isoformat(),
        "dataset_hash": dataset_hash,
        "random_seed": seed,
        "feature_scenario": scenario.value,
        "sklearn_version": sklearn_version,
        "models": [
            {
                "kind": r.kind.value,
                "artifact": r.artifact_name,
                "metrics": r.metrics,
            }
            for r in records
        ],
        "notes": {
            "linear_model": "LogisticRegression (multivariate linear decision boundary)",
            "knn": "KNeighborsClassifier k=15",
            "leakage": "Total_Conversion excluded from features",
        },
    }

    manifest_path = snapshot_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest
