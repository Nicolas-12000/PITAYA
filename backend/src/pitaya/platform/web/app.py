from fastapi import FastAPI

from pitaya import __version__
from pitaya.kernel.config import get_settings
from pitaya.orchestration.context import AppContext
from pitaya.platform.cache.memory import TtlCache
from pitaya.platform.storage.memory import MemoryStore
from pitaya.platform.web.routes import router


def create_app() -> FastAPI:
    settings = get_settings()
    ctx = AppContext(
        memory_store=MemoryStore(),
        cache=TtlCache(
            ttl_seconds=settings.cache_ttl_seconds,
            max_items=settings.cache_max_items,
        ),
    )

    application = FastAPI(
        title="PITAYA API",
        version=__version__,
        description="Facebook Ads analytics — JSON API",
    )
    application.state.ctx = ctx
    application.include_router(router, prefix="/v1")
    return application
