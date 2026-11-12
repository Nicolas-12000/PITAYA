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
    status: str
    model_kind: str | None = None
    scenario: str | None = None
    message: str | None = None
    predictions: list[float] | None = None


class AbTestRequest(BaseModel):
    campaign_ids: list[int] | None = Field(
        default=None,
        description="Defaults to 916, 936, 1178 from the Kaggle dataset",
    )


class AbTestResponse(BaseModel):
    analysis_type: str
    disclaimer: str
    comparisons: list[dict[str, Any]]
