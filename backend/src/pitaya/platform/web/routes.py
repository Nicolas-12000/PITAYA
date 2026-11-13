from fastapi import APIRouter, Header, HTTPException, Request

from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.orchestration.workflows import (
    ab_test,
    attribution,
    budget,
    kpis,
    models,
    predict,
    roi,
    segments,
    status,
    sync,
)
from pitaya.platform.web.schemas import (
    AbTestRequest,
    AbTestResponse,
    HealthResponse,
    KpisResponse,
    PredictRequest,
    PredictResponse,
    RecommendRequest,
    RecommendResponse,
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
    return StatusResponse.model_validate(status.build_status_view(ctx))


@router.get("/kpis", response_model=KpisResponse)
def get_kpis() -> KpisResponse:
    try:
        return KpisResponse.model_validate(kpis.get_kpis_workflow())
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/roi")
def get_roi() -> dict[str, object]:
    try:
        return roi.roi_workflow()
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/models")
def get_models() -> dict[str, object]:
    try:
        return models.models_manifest_workflow()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/segments", response_model=SegmentsResponse)
def get_segments() -> SegmentsResponse:
    try:
        return SegmentsResponse.model_validate(segments.get_segments_workflow())
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/channels/compare")
def compare_channels() -> dict[str, object]:
    try:
        return segments.get_channel_compare_workflow()
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/predict", response_model=PredictResponse)
def post_predict(body: PredictRequest) -> PredictResponse:
    try:
        return PredictResponse.model_validate(
            predict.predict_workflow(body.records, body.model_kind, body.scenario)
        )
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/ab-test", response_model=AbTestResponse)
def post_ab_test(body: AbTestRequest) -> AbTestResponse:
    try:
        return AbTestResponse.model_validate(ab_test.ab_test_workflow(body.campaign_ids))
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/attribution")
def get_attribution(model: str = "shapley") -> dict[str, object]:
    try:
        return attribution.attribution_workflow(model)
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/recommendations", response_model=RecommendResponse)
def post_recommendations(
    request: Request,
    body: RecommendRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> RecommendResponse:
    try:
        return RecommendResponse.model_validate(
            budget.recommend_workflow(
                request.app.state.ctx,
                body.total_budget,
                body.min_share,
                body.max_share,
                idempotency_key,
            )
        )
    except SnapshotNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/recommendations")
def get_recommendations(request: Request) -> dict[str, object]:
    return budget.list_recommendations_workflow(request.app.state.ctx)


@router.post("/admin/sync")
def admin_sync(request: Request) -> dict[str, object]:
    return sync.admin_sync_workflow(request.app.state.ctx)
