from pitaya.kernel.config import get_settings
from pitaya.modules.performance.roi import roi_sensitivity
from pitaya.orchestration.workflows.dataset import load_prepared_dataset


def roi_workflow() -> dict[str, object]:
    settings = get_settings()
    df = load_prepared_dataset()
    return roi_sensitivity(df, value_per_conversion=settings.value_per_approved_conversion)
