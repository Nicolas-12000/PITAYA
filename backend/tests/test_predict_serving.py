import pandas as pd

from pitaya.modules.catalog.domain import add_conversion_target
from pitaya.modules.modeling.api import predict_conversion
from pitaya.modules.modeling.domain import FeatureScenario, ModelKind
from pitaya.orchestration.workflows.predict import predict_workflow
from pitaya.platform.storage.snapshot import snapshot_root


def test_predict_with_trained_artifact() -> None:
    models_dir = snapshot_root() / "models"
    artifact = models_dir / "logistic_regression_inflight.joblib"
    if not artifact.exists():
        return
    df = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    row = df.iloc[0]
    feature_cols = [
        "xyz_campaign_id",
        "age",
        "gender",
        "interest",
        "Impressions",
        "Clicks",
        "Spent",
    ]
    record = {col: row[col] for col in feature_cols}
    probs = predict_conversion(
        models_dir,
        [record],
        ModelKind.LOGISTIC_REGRESSION,
        FeatureScenario.INFLIGHT,
    )
    assert len(probs) == 1
    assert 0.0 <= probs[0] <= 1.0


def test_predict_workflow_api() -> None:
    models_dir = snapshot_root() / "models"
    if not (models_dir / "knn_inflight.joblib").exists():
        return
    df = add_conversion_target(pd.read_csv("tests/fixtures/sample_ads.csv"))
    row = df.iloc[0]
    payload = predict_workflow(
        [
            {
                col: row[col]
                for col in [
                    "xyz_campaign_id",
                    "age",
                    "gender",
                    "interest",
                    "Impressions",
                    "Clicks",
                    "Spent",
                ]
            }
        ],
        "knn",
        "inflight",
    )
    assert payload["status"] == "ok"
    assert payload["predictions"]
