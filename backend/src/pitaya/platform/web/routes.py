from fastapi import APIRouter, HTTPException, Request

from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.orchestration.workflows import ab_test, kpis, predict, segments, status
from pitaya.platform.web.schemas import (
    AbTestRequest,
    AbTestResponse,
    HealthResponse,
    KpisResponse,
    PredictRequest,
    PredictResponse,
    SegmentsResponse,
    StatusResponse,
)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse()


@router.get("/status", response_model=StatusResponse)
def get_status(request: Request) -> StatusResponse:
    ctx = request.app.state.ctx
    payload = status.build_status_view(ctx)
    return StatusResponse(**payload)


@router.get("/kpis", response_model=KpisResponse)
def get_kpis() -> KpisResponse:
    try:
        payload = kpis.get_kpis_workflow()
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return KpisResponse(**payload)


@router.get("/segments", response_model=SegmentsResponse)
def get_segments() -> SegmentsResponse:
    try:
        payload = segments.get_segments_workflow()
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return SegmentsResponse(**payload)


@router.get("/channels/compare")
def compare_channels() -> dict[str, object]:
    try:
        return segments.get_channel_compare_workflow()
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/predict", response_model=PredictResponse)
def post_predict(body: PredictRequest) -> PredictResponse:
    try:
        payload = predict.predict_workflow(body.records, body.model_kind, body.scenario)
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PredictResponse(**payload)


@router.post("/ab-test", response_model=AbTestResponse)
def post_ab_test(body: AbTestRequest) -> AbTestResponse:
    try:
        payload = ab_test.ab_test_workflow(body.campaign_ids)
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return AbTestResponse(**payload)


@router.get("/attribution")
def get_attribution(model: str = "shapley") -> dict[str, str]:
    return {"status": "planned", "model": model, "level": "A"}


@router.post("/recommendations")
@router.get("/recommendations")
def recommendations() -> dict[str, str]:
    return {"status": "planned", "disclaimer": "observational_recommendation"}


@router.post("/admin/sync")
def admin_sync() -> dict[str, str]:
    return {"status": "skipped", "reason": "memory_outbox_optional"}
