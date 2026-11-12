from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "pitaya-api"


class StatusResponse(BaseModel):
    storage_mode: str
    persistence: dict[str, Any]
    snapshot: dict[str, Any]
    cache: dict[str, Any]
    memory_store_entries: int


class KpisResponse(BaseModel):
    kpis: dict[str, Any]
    row_count: int


class PredictRequest(BaseModel):
    scenario: str = Field(default="inflight", description="prelaunch | inflight")
    records: list[dict[str, Any]] = Field(default_factory=list)


class PredictResponse(BaseModel):
    status: str
    message: str | None = None
    predictions: list[float] | None = None
