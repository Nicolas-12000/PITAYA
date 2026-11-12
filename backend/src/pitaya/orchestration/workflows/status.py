import json

from pitaya.kernel.config import get_settings
from pitaya.orchestration.context import AppContext
from pitaya.platform.storage import factory
from pitaya.platform.storage.snapshot import manifest_path, snapshot_dataset_hash


def build_status_view(ctx: AppContext) -> dict[str, object]:
    settings = get_settings()
    mode = factory.resolve_storage_mode()
    snap_hash = snapshot_dataset_hash()
    manifest_loaded = False
    sklearn_mismatch: str | None = None

    mp = manifest_path()
    if mp.exists():
        manifest_loaded = True
        try:
            manifest = json.loads(mp.read_text(encoding="utf-8"))
            trained_version = manifest.get("sklearn_version")
            if trained_version:
                import sklearn

                if sklearn.__version__ != trained_version:
                    sklearn_mismatch = f"runtime={sklearn.__version__} manifest={trained_version}"
        except (json.JSONDecodeError, OSError):
            manifest_loaded = False

    return {
        "storage_mode": mode.value,
        "persistence": {
            "database_configured": bool(settings.database_url),
            "durable_writes": mode.value in ("sqlite", "postgres"),
        },
        "snapshot": {
            "loaded": snap_hash is not None,
            "dataset_hash": snap_hash,
            "manifest_present": manifest_loaded,
            "sklearn_version_mismatch": sklearn_mismatch,
        },
        "cache": {
            "entries": ctx.cache.size,
            "ttl_seconds": settings.cache_ttl_seconds,
            "max_items": settings.cache_max_items,
        },
        "memory_store_entries": ctx.memory_store.size,
    }
