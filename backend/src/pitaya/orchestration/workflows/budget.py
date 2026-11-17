from typing import Any

from pitaya.kernel.config import get_settings
from pitaya.modules.budget import api as budget_api
from pitaya.orchestration.context import AppContext
from pitaya.orchestration.workflows.dataset import load_prepared_dataset


def recommend_workflow(
    ctx: AppContext,
    total_budget: float,
    min_share: float,
    max_share: float,
    idempotency_key: str | None,
) -> dict[str, Any]:
    settings = get_settings()
    df = load_prepared_dataset()
    plan = budget_api.recommend_budget(
        df,
        total_budget=total_budget,
        value_per_approved_conversion=settings.value_per_approved_conversion,
        min_share=min_share,
        max_share=max_share,
    )
    payload = {"plan": plan, "saved_in_memory": False, "persisted": False, "created": False}
    if idempotency_key:
        stored = {**plan, "min_share": min_share, "max_share": max_share}
        existed = ctx.recommendations.get(idempotency_key) is not None
        record = ctx.recommendations.save(idempotency_key, stored)
        payload["saved_in_memory"] = True
        payload["persisted"] = record.persisted
        payload["created"] = not existed
        if not record.persisted:
            ctx.outbox.add({"type": "recommendation", "key": idempotency_key})
    return payload


def list_recommendations_workflow(ctx: AppContext) -> dict[str, Any]:
    return {"items": ctx.recommendations.list_all()}
