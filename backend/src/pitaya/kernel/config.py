from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

from pitaya.kernel.paths import repository_root

# Stable hold-out: hash(ad_id) % 10 < TEST_FOLD_MODULO_THRESHOLD
TEST_FOLD_MODULO = 10
TEST_FOLD_MODULO_THRESHOLD = 2

LEAKAGE_COLUMNS = frozenset({"Total_Conversion"})

PRELAUNCH_FEATURE_COLUMNS = (
    "xyz_campaign_id",
    "age",
    "gender",
    "interest",
)

INFLIGHT_FEATURE_COLUMNS = (
    "xyz_campaign_id",
    "age",
    "gender",
    "interest",
    "Impressions",
    "Clicks",
    "Spent",
)


class PitayaSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=repository_root() / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    storage_mode: str = "auto"
    database_url: str = ""
    cache_ttl_seconds: int = 900
    cache_max_items: int = 256
    snapshot_dir: str = "snapshot"
    sync_timeout_seconds: int = 2
    pitaya_random_seed: int = 42
    value_per_approved_conversion: float = 50.0

    def resolved_snapshot_dir(self) -> Path:
        return Path(self.snapshot_dir).resolve()


@lru_cache
def get_settings() -> PitayaSettings:
    return PitayaSettings()
