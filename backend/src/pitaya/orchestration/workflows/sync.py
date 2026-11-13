from pitaya.orchestration.context import AppContext


def admin_sync_workflow(ctx: AppContext) -> dict[str, object]:
    flushed = ctx.outbox.flush()
    return {
        "status": "ok",
        "flushed": len(flushed),
        "items": flushed,
        "note": "best_effort_memory_outbox",
    }
