from pitaya.kernel.config import get_settings
from pitaya.modules.catalog.domain import add_conversion_target, validate_schema
from pitaya.modules.performance import api as performance_api
from pitaya.platform.storage.snapshot import load_snapshot_dataframe


def get_kpis_workflow() -> dict[str, object]:
    settings = get_settings()
    raw = load_snapshot_dataframe()
    validate_schema(raw)
    df = add_conversion_target(raw)
    kpis = performance_api.compute_global_kpis(
        df,
        value_per_approved_conversion=settings.value_per_approved_conversion,
    )
    return {"kpis": kpis, "row_count": len(df)}
