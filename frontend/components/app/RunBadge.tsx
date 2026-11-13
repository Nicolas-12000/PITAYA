import { Database, HardDrive, MemoryStick } from "lucide-react";

import { Skeleton } from "@/components/states/Skeleton";
import { Tooltip } from "@/components/ui/controls";
import { load } from "@/lib/api/server";
import type { ModelsResponse, StatusResponse } from "@/lib/api/types";
import { formatDateTime, shortHash } from "@/lib/format";
import { STORAGE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Insignia del run: modo de persistencia y hash corto del snapshot. */
export async function RunBadge() {
  const [status, models] = await Promise.all([
    load<StatusResponse>("v1/status"),
    load<ModelsResponse>("v1/models"),
  ]);

  if (!status.ok) {
    return (
      <Tooltip content={status.message}>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-series-6 px-2.5 text-[12px] text-danger-ink">
          <span aria-hidden className="size-1.5 rounded-full bg-series-6" />
          Sin backend
        </span>
      </Tooltip>
    );
  }

  const mode = status.data.storage_mode;
  const Icon = mode === "memory" ? MemoryStick : mode === "sqlite" ? HardDrive : Database;
  const manifest = models.ok && models.data.status === "ok" ? models.data.manifest : null;
  const hash = status.data.snapshot.dataset_hash;

  return (
    <Tooltip
      side="bottom"
      content={
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt className="text-ink-subtle">Persistencia</dt>
          <dd className="text-ink">{STORAGE_LABEL[mode] ?? mode}</dd>
          <dt className="text-ink-subtle">dataset_hash</dt>
          <dd className="font-mono break-all text-ink">{hash ?? "—"}</dd>
          <dt className="text-ink-subtle">Modelos</dt>
          <dd className="text-ink">{manifest ? formatDateTime(manifest.created_at) : "sin manifiesto"}</dd>
        </dl>
      }
    >
      <button
        type="button"
        className="inline-flex h-8 items-center gap-2 rounded-full border border-hairline bg-surface-1 px-2.5 text-[12px] text-ink-muted hover:border-hairline-strong"
        aria-label={`Run: ${STORAGE_LABEL[mode] ?? mode}, hash ${shortHash(hash)}`}
      >
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", mode === "memory" ? "bg-series-4" : "bg-series-3")}
        />
        <Icon className="size-3.5 max-sm:hidden" strokeWidth={1.5} aria-hidden />
        <span className="max-sm:hidden">{STORAGE_LABEL[mode] ?? mode}</span>
        <span className="font-mono text-ink tabular">{shortHash(hash)}</span>
      </button>
    </Tooltip>
  );
}

export function RunBadgeSkeleton() {
  return <Skeleton className="h-8 w-32 rounded-full" />;
}

/** Aviso cuando la app corre sin base de datos (modo memoria). */
export async function DemoModeBanner() {
  const status = await load<StatusResponse>("v1/status");
  if (!status.ok || status.data.storage_mode !== "memory") return null;
  return (
    <div className="border-b border-dashed border-series-4 bg-surface-1 px-4 py-2 text-center text-[12px] text-warning-ink md:px-6">
      Modo memoria: las recomendaciones guardadas se pierden al reiniciar el backend.
      <span className="max-sm:hidden">
        {" "}
        Configura <code className="font-mono">STORAGE_MODE=sqlite</code> para persistirlas.
      </span>
    </div>
  );
}
