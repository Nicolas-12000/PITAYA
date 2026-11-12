from pitaya.kernel.config import get_settings
from pitaya.modules.performance import api as performance_api
from pitaya.orchestration.workflows.dataset import load_prepared_dataset


def get_kpis_workflow() -> dict[str, object]:
    settings = get_settings()
    df = load_prepared_dataset()
    kpis = performance_api.compute_global_kpis_api(
        df,
        value_per_approved_conversion=settings.value_per_approved_conversion,
    )
    return {"kpis": kpis, "row_count": len(df)}
