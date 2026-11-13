"""Offline training — not invoked from HTTP handlers."""

import json
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold

from pitaya.kernel.config import get_settings
from pitaya.kernel.hashing import stable_test_mask
from pitaya.kernel.metrics import compute_binary_metrics
from pitaya.modules.catalog.domain import TARGET_COLUMN
from pitaya.modules.modeling._internal.evaluation import compare_models_wilcoxon
from pitaya.modules.modeling._internal.pipelines import (
    build_training_pipeline,
    feature_columns_for_scenario,
)
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
    fold_scores: dict[str, list[float]] = {}
    sklearn_version = None

    try:
        import sklearn

        sklearn_version = sklearn.__version__
    except ImportError:
        pass

    for kind in DEFAULT_MODELS:
        build_training_pipeline(kind, scenario, seed)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        fold_auc: list[float] = []
        oof_prob = np.zeros(len(y_train))
        for train_idx, val_idx in cv.split(x_train, y_train):
            x_tr = x_train.iloc[train_idx]
            y_tr = y_train[train_idx]
            x_val = x_train.iloc[val_idx]
            y_val = y_train[val_idx]
            fold_pipe = build_training_pipeline(kind, scenario, seed)
            fold_pipe.fit(x_tr, y_tr)
            prob = fold_pipe.predict_proba(x_val)[:, 1]
            oof_prob[val_idx] = prob
            if len(np.unique(y_val)) > 1:
                fold_auc.append(float(roc_auc_score(y_val, prob)))
        fold_scores[kind.value] = fold_auc
        cv_metrics = compute_binary_metrics(y_train, oof_prob)

        final_pipeline = build_training_pipeline(kind, scenario, seed)
        if kind in (ModelKind.RANDOM_FOREST, ModelKind.ADABOOST):
            final_pipeline = CalibratedClassifierCV(final_pipeline, cv=3, method="isotonic")
        final_pipeline.fit(x_train, y_train)

        test_prob = final_pipeline.predict_proba(x_test)[:, 1]
        test_metrics = compute_binary_metrics(y_test, test_prob)

        artifact_name = f"{kind.value}_{scenario.value}.joblib"
        joblib.dump(final_pipeline, models_dir / artifact_name, compress=3)

        records.append(
            TrainedModelRecord(
                kind=kind,
                scenario=scenario,
                artifact_name=artifact_name,
                metrics={
                    "cv_roc_auc": cv_metrics.roc_auc,
                    "cv_pr_auc": cv_metrics.pr_auc,
                    "cv_f1": cv_metrics.f1,
                    "cv_precision": cv_metrics.precision,
                    "cv_recall": cv_metrics.recall,
                    "cv_brier": cv_metrics.brier,
                    "test_roc_auc": test_metrics.roc_auc,
                    "test_pr_auc": test_metrics.pr_auc,
                    "test_f1": test_metrics.f1,
                    "test_precision": test_metrics.precision,
                    "test_recall": test_metrics.recall,
                    "test_brier": test_metrics.brier,
                },
            )
        )

    rf_scores = np.array(fold_scores.get(ModelKind.RANDOM_FOREST.value, []))
    ada_scores = np.array(fold_scores.get(ModelKind.ADABOOST.value, []))
    wilcoxon_rf_vs_ada = compare_models_wilcoxon(rf_scores, ada_scores)

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
        "cv_fold_roc_auc": fold_scores,
        "model_comparison": {
            "random_forest_vs_adaboost_wilcoxon": wilcoxon_rf_vs_ada,
        },
        "notes": {
            "linear_model": "LogisticRegression (multivariate linear decision boundary)",
            "knn": "KNeighborsClassifier k=15",
            "leakage": "Total_Conversion excluded from features",
            "calibration": "isotonic for random_forest and adaboost",
        },
    }

    manifest_path = snapshot_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest
