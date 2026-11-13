"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { KpiCard } from "@/components/data/KpiCard";
import { IsoBox } from "@/components/illustrations/Iso";
import { Notice } from "@/components/notices/notices";
import { Button } from "@/components/ui/button";
import { Badge, Panel, PanelHeader } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/sheet";
import { apiFetch, apiPost, toUserMessage } from "@/lib/api/client";
import type { ModelManifest, StatusResponse, SyncResponse } from "@/lib/api/types";
import { formatDateTime, formatInteger, shortHash } from "@/lib/format";
import { STORAGE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function StatusBoard({
  initialStatus,
  healthy,
  manifest,
}: {
  initialStatus: StatusResponse;
  healthy: boolean;
  manifest: ModelManifest | null;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [lastSync, setLastSync] = useState<{ at: Date; flushed: number } | null>(null);

  const status = useQuery({
    queryKey: ["status"],
    queryFn: () => apiFetch<StatusResponse>("v1/status"),
    initialData: initialStatus,
    refetchInterval: 15_000,
  });
  const s = status.data;

  const sync = useMutation({
    mutationFn: () => apiPost<SyncResponse>("v1/admin/sync", {}),
    onSuccess: (res) => {
      setLastSync({ at: new Date(), flushed: res.flushed });
      toast.success(
        res.flushed ? `Sincronización lista: ${formatInteger(res.flushed)} elemento(s) del outbox.` : "No había nada pendiente en el outbox.",
      );
      status.refetch();
      router.refresh();
    },
    onError: (err) => toast.error(toUserMessage(err)),
  });

  const durable = s.persistence.durable_writes;
  const hashMatch = manifest && s.snapshot.dataset_hash ? manifest.dataset_hash === s.snapshot.dataset_hash : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Persistencia"
          value={STORAGE_LABEL[s.storage_mode] ?? s.storage_mode}
          note={durable ? "Escrituras duraderas en la misma petición" : "Solo memoria: se pierde al reiniciar"}
          footer={
            <Badge tone={durable ? "success" : "warning"} dot>
              {durable ? "Persistido" : "Temporal"}
            </Badge>
          }
        />
        <KpiCard
          label="Salud de la API"
          value={healthy ? "En línea" : "Sin respuesta"}
          tone={healthy ? "positive" : "negative"}
          note={status.isFetching ? "Sondeo cada 15 s · actualizando…" : status.isError ? "Sondeo cada 15 s · último intento falló" : "Sondeo cada 15 s · al día"}
        />
        <KpiCard
          label="Caché de lecturas"
          value={formatInteger(s.cache.entries)}
          note={`de ${formatInteger(s.cache.max_items)} entradas · TTL ${formatInteger(s.cache.ttl_seconds / 60)} min`}
        />
        <KpiCard
          label="Memoria del proceso"
          value={formatInteger(s.memory_store_entries)}
          note="Entradas en MemoryStore (temporales)"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel className="rounded-xl">
          <PanelHeader
            eyebrow={<p className="label-mono text-ink-tertiary">Run servido</p>}
            title={s.snapshot.loaded ? "Snapshot cargado" : "No hay snapshot"}
            subtitle="Hashes SHA-256 del dataset y del manifiesto de modelos."
          />
          <dl className="mt-4 divide-y divide-hairline border-t border-hairline text-[13px]">
            <HashRow label="dataset_hash (snapshot)" value={s.snapshot.dataset_hash} />
            <HashRow label="dataset_hash (manifiesto)" value={manifest?.dataset_hash ?? null} />
            <Row label="Coherencia">
              {hashMatch === null ? (
                <span className="text-ink-subtle">—</span>
              ) : hashMatch ? (
                <Badge tone="success" dot>
                  Los modelos se entrenaron con este snapshot
                </Badge>
              ) : (
                <Badge tone="danger" dot>
                  Modelos de otro snapshot: ejecuta make train
                </Badge>
              )}
            </Row>
            <Row label="Modelos entrenados">{manifest ? formatDateTime(manifest.created_at) : "—"}</Row>
            <Row label="scikit-learn">
              <span className="font-mono">{manifest?.sklearn_version ?? "—"}</span>
              {s.snapshot.sklearn_version_mismatch ? (
                <Badge tone="warning" className="ml-2">
                  {s.snapshot.sklearn_version_mismatch}
                </Badge>
              ) : manifest ? (
                <Badge tone="success" className="ml-2">
                  coincide con el runtime
                </Badge>
              ) : null}
            </Row>
            <Row label="Base de datos">
              {s.persistence.database_configured ? "DATABASE_URL configurada" : "Sin DATABASE_URL"}
            </Row>
          </dl>
        </Panel>

        <Panel className="rounded-xl">
          <PanelHeader
            eyebrow={<p className="label-mono text-ink-tertiary">Sincronización</p>}
            title="Outbox de escrituras pendientes"
            subtitle="Si una recomendación no se pudo persistir, queda en el outbox en memoria. Sincronizar lo vacía (best effort)."
          />
          <div className="space-y-4 px-5 pt-5 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={() => setConfirm(true)} disabled={sync.isPending}>
                <RefreshCw strokeWidth={1.5} className={sync.isPending ? "animate-spin" : undefined} />
                {sync.isPending ? "Sincronizando…" : "Sincronizar ahora"}
              </Button>
              <span className="text-[13px] text-ink-subtle" aria-live="polite">
                {lastSync
                  ? `Último sync ${lastSync.at.toLocaleTimeString("es-CO")} · ${formatInteger(lastSync.flushed)} elemento(s)`
                  : "Sin sincronizar en esta sesión"}
              </span>
            </div>
            <Notice>
              La API no publica el conteo del outbox en <code className="font-mono">/v1/status</code>; el número aparece al
              sincronizar. En Vercel no hay workers ni timers: la sincronización es siempre manual o en la misma petición.
            </Notice>
          </div>
        </Panel>
      </div>

      <LayersDiagram mode={s.storage_mode} />

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Sincronizar el outbox ahora?"
        description="Se vaciarán los elementos pendientes en memoria del backend. Es seguro repetirlo."
        confirmLabel="Sincronizar"
        onConfirm={() => sync.mutate()}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="flex flex-wrap items-center text-ink">{children}</dd>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <Row label={label}>
      <span className="font-mono text-ink" title={value ?? undefined}>
        {value ? `${shortHash(value, 12)}…${value.slice(-6)}` : "—"}
      </span>
      {value ? (
        <button
          type="button"
          onClick={() =>
            navigator.clipboard
              .writeText(value)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })
              .catch(() => toast.error("No pudimos copiar al portapapeles."))
          }
          className="ml-2 inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-[12px] text-ink-subtle hover:bg-surface-2 hover:text-ink"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="size-3.5 text-success-ink" strokeWidth={1.5} /> : <Copy className="size-3.5" strokeWidth={1.5} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      ) : null}
    </Row>
  );
}

const LAYERS = [
  {
    id: "L1",
    title: "Memoria y caché",
    text: "MemoryStore y caché TTL del proceso. Rápidas y temporales: se pierden al reiniciar.",
    active: () => true,
  },
  {
    id: "L2",
    title: "Base de datos",
    text: "SQLite en local o PostgreSQL opcional. Las recomendaciones se persisten en la misma petición.",
    active: (mode: string) => mode === "sqlite" || mode === "postgres",
  },
  {
    id: "L3",
    title: "Snapshot",
    text: "ads.csv.gz, manifest.json y modelos .joblib en backend/snapshot. Inmutable; se regenera offline.",
    active: () => true,
  },
];

function LayersDiagram({ mode }: { mode: string }) {
  return (
    <Panel className="rounded-xl">
      <PanelHeader
        eyebrow={<p className="label-mono text-ink-tertiary">FIG 0.4 · Niveles de almacenamiento</p>}
        title={`Hoy la app lee del snapshot (L3) y escribe en ${mode === "memory" ? "memoria (L1)" : `${STORAGE_LABEL[mode] ?? mode} (L2)`}`}
        subtitle="Los niveles apagados no participan en el modo actual."
      />
      <div className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-hairline max-md:divide-y max-md:divide-hairline">
        {LAYERS.map((layer, i) => {
          const on = layer.active(mode);
          return (
            <figure key={layer.id} className={cn("flex flex-col gap-3 p-5", !on && "opacity-45")}>
              <div className="flex items-center gap-2">
                <span className="label-mono text-ink-tertiary">{layer.id}</span>
                {on ? (
                  <Badge tone="success" dot>
                    activo
                  </Badge>
                ) : (
                  <Badge>inactivo</Badge>
                )}
              </div>
              <div className="dot-grid flex h-36 items-center justify-center rounded-lg border border-hairline bg-canvas">
                <svg viewBox="-110 -70 220 150" aria-hidden className="fig-draw h-28 w-auto">
                  {Array.from({ length: i + 1 }, (_, k) => (
                    <IsoBox key={k} x={-40} y={-40} z={k * 18 - 10} w={80} d={80} h={12} accent={on && k === i} />
                  ))}
                </svg>
              </div>
              <figcaption>
                <p className="text-[14px] font-medium text-ink">{layer.title}</p>
                <p className="mt-1 text-[13px] text-ink-muted text-pretty">{layer.text}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Panel>
  );
}
