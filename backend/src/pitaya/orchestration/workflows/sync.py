from pitaya.orchestration.context import AppContext


def admin_sync_workflow(ctx: AppContext) -> dict[str, object]:
    """Retry recommendations that stayed in memory because SQLite or Postgres failed."""
    pending = ctx.outbox.flush()
    saved = 0
    for item in pending:
        key = item.get("key")
        if not isinstance(key, str):
            continue
        record = ctx.recommendations.get(key)
        if record is None:
            continue
        again = ctx.recommendations.save(key, record.payload)
        if again.persisted:
            saved += 1
        else:
            ctx.outbox.add(item)
    return {
        "status": "ok",
        "flushed": saved,
        "pending": len(ctx.outbox.pending),
    }
