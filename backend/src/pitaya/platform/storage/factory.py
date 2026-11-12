from enum import StrEnum

from pitaya.kernel.config import get_settings


class ActiveStorageMode(StrEnum):
    MEMORY = "memory"
    SQLITE = "sqlite"
    POSTGRES = "postgres"


def resolve_storage_mode() -> ActiveStorageMode:
    settings = get_settings()
    mode = settings.storage_mode.lower()
    if mode == "memory":
        return ActiveStorageMode.MEMORY
    if mode == "sqlite" and settings.database_url:
        return ActiveStorageMode.SQLITE
    if mode == "postgres" and settings.database_url:
        return ActiveStorageMode.POSTGRES
    if mode == "auto":
        if settings.database_url.startswith("postgresql"):
            return ActiveStorageMode.POSTGRES
        if settings.database_url.startswith("sqlite"):
            return ActiveStorageMode.SQLITE
        return ActiveStorageMode.MEMORY
    return ActiveStorageMode.MEMORY
