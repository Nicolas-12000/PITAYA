from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.modules.modeling import api as modeling_api
from pitaya.modules.modeling.domain import FeatureScenario, ModelKind
from pitaya.platform.storage.snapshot import snapshot_root


def predict_workflow(
    records: list[dict[str, object]],
    model_kind: str,
    scenario: str,
) -> dict[str, object]:
    try:
        kind = ModelKind(model_kind)
        scen = FeatureScenario(scenario)
    except ValueError as exc:
        raise ValueError(f"Invalid model_kind or scenario: {exc}") from exc

    models_dir = snapshot_root() / "models"
    try:
        probabilities = modeling_api.predict_conversion(models_dir, records, kind, scen)
    except SnapshotNotFoundError:
        raise
    except ValueError as exc:
        raise ValueError(str(exc)) from exc

    return {
        "status": "ok",
        "model_kind": kind.value,
        "scenario": scen.value,
        "predictions": probabilities,
    }
