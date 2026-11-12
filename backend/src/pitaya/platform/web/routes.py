from fastapi import APIRouter, HTTPException, Request

from pitaya.kernel.errors import SnapshotNotFoundError
from pitaya.orchestration.workflows import kpis, status
from pitaya.platform.web.schemas import (
    HealthResponse,
    KpisResponse,
    PredictRequest,
    PredictResponse,
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


@router.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest) -> PredictResponse:
    return PredictResponse(
        status="not_implemented",
        message="Load trained artifacts from snapshot/models on first implementation pass.",
        predictions=None,
    )


@router.get("/segments")
def get_segments() -> dict[str, str]:
    return {"status": "not_implemented"}


@router.post("/ab-test")
def post_ab_test() -> dict[str, str]:
    return {"status": "not_implemented"}


@router.get("/attribution")
def get_attribution(model: str = "shapley") -> dict[str, str]:
    return {"status": "not_implemented", "model": model}


@router.get("/channels/compare")
def compare_channels() -> dict[str, str]:
    return {"status": "not_implemented"}


@router.post("/recommendations")
@router.get("/recommendations")
def recommendations() -> dict[str, str]:
    return {"status": "not_implemented"}


@router.post("/admin/sync")
def admin_sync() -> dict[str, str]:
    return {"status": "not_implemented", "reason": "memory_outbox_optional"}
