from pitaya.kernel.config import get_settings
from pitaya.modules.performance import api as performance_api
from pitaya.orchestration.workflows.dataset import load_prepared_dataset


def get_segments_workflow() -> dict[str, object]:
    settings = get_settings()
    df = load_prepared_dataset()
    segments = performance_api.segment_stats(
        df,
        value_per_approved_conversion=settings.value_per_approved_conversion,
    )
    return {
        "dimensions": list(performance_api.DEFAULT_SEGMENT_DIMENSIONS),
        "segments": segments,
    }


def get_channel_compare_workflow() -> dict[str, object]:
    settings = get_settings()
    df = load_prepared_dataset()
    return performance_api.channel_compare(
        df,
        value_per_approved_conversion=settings.value_per_approved_conversion,
    )
