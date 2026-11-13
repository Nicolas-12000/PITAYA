from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "pitaya-api"


class StatusResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    storage_mode: str
    persistence: dict[str, Any]
    snapshot: dict[str, Any]
    cache: dict[str, Any]
    memory_store_entries: int


class KpisResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    kpis: dict[str, Any]
    row_count: int


class SegmentsResponse(BaseModel):
    dimensions: list[str]
    segments: list[dict[str, Any]]


class PredictRequest(BaseModel):
    scenario: str = Field(default="inflight", description="prelaunch | inflight")
    model_kind: str = Field(
        default="random_forest",
        description="dummy | logistic_regression | knn | random_forest | adaboost",
    )
    records: list[dict[str, Any]] = Field(default_factory=list)


class PredictResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str
    model_kind: str | None = None
    scenario: str | None = None
    message: str | None = None
    predictions: list[float] | None = None


class AbTestRequest(BaseModel):
    campaign_ids: list[int] | None = None


class AbTestResponse(BaseModel):
    model_config = ConfigDict(extra="allow")


class RecommendRequest(BaseModel):
    total_budget: float = Field(gt=0)
    min_share: float = Field(default=0.0, ge=0.0, le=1.0)
    max_share: float = Field(default=1.0, ge=0.0, le=1.0)


class RecommendResponse(BaseModel):
    model_config = ConfigDict(extra="allow")
