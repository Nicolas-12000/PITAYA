"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Copy, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { KpiCard } from "@/components/data/KpiCard";
import { Button } from "@/components/ui/button";
import { Badge, Panel, PanelHeader } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/sheet";
import { apiFetch, apiPost, toUserMessage } from "@/lib/api/client";
import type { ModelManifest, StatusResponse, SyncResponse } from "@/lib/api/types";
import { formatDateTime, formatInteger, shortHash } from "@/lib/format";
import { STORAGE_LABEL } from "@/lib/labels";

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
        res.flushed ? `Listo: se guardaron ${formatInteger(res.flushed)}.` : "No había nada pendiente.",
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
          note={durable ? "Lo que guardas se escribe en la base al momento" : "Solo dura mientras esta sesión siga abierta"}
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
          note={status.isFetching ? "Revisando…" : status.isError ? "No pudimos revisar el servicio" : "Se revisa cada 15 segundos"}
        />
        <KpiCard
          label="Caché de lecturas"
          value={formatInteger(s.cache.entries)}
          note={`de ${formatInteger(s.cache.max_items)} posibles · se renuevan cada ${formatInteger(s.cache.ttl_seconds / 60)} min`}
        />
        <KpiCard
          label="Memoria del proceso"
          value={formatInteger(s.memory_store_entries)}
          note="Datos temporales de esta sesión"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel className="rounded-xl">
          <PanelHeader
            title={s.snapshot.loaded ? "Datos listos" : "No hay datos cargados"}
            subtitle="Sirve para ver si los modelos se entrenaron con los datos que estás consultando."
          />
          <dl className="mt-4 divide-y divide-hairline border-t border-hairline text-[13px]">
            <HashRow label="Datos actuales" value={s.snapshot.dataset_hash} />
            <HashRow label="Datos del entrenamiento" value={manifest?.dataset_hash ?? null} />
            <Row label="Coherencia">
              {hashMatch === null ? (
                <span className="text-ink-subtle">—</span>
              ) : hashMatch ? (
                <Badge tone="success" dot>
                  Los modelos se entrenaron con este snapshot
                </Badge>
              ) : (
                <Badge tone="danger" dot>
                  Los modelos no coinciden con los datos actuales
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
              {s.persistence.database_configured ? "Conectada" : "Sin conexión"}
            </Row>
          </dl>
        </Panel>

        <Panel className="flex h-full flex-col rounded-xl">
          <PanelHeader
            eyebrow={<p className="label-mono text-ink-tertiary">Sincronización</p>}
            title="Sincronización"
            subtitle="Si una recomendación no alcanzó a guardarse, este botón vuelve a intentarlo."
          />
          <p className="px-5 pt-4 text-[15px] leading-relaxed text-ink-muted text-pretty">
            Cada recomendación se guarda al calcularla. Este cuadro no lista el historial: solo reintenta las que se quedaron a medias
            porque la base no respondió en ese momento.
          </p>
          <dl className="mt-4 divide-y divide-hairline border-t border-hairline text-[13px]">
            <Row label="En espera">
              <span aria-live="polite">
                {(s.persistence.outbox_pending ?? 0) === 0
                  ? "Nada. Lo que calculas queda escrito al momento."
                  : `${formatInteger(s.persistence.outbox_pending ?? 0)} por guardar`}
              </span>
            </Row>
            <Row label="Último intento">
              {lastSync
                ? `${lastSync.at.toLocaleTimeString("es-CO")} · ${formatInteger(lastSync.flushed)} guardada${lastSync.flushed === 1 ? "" : "s"}`
                : "Todavía no se ha usado en esta visita"}
            </Row>
            <Row label="Cuándo usarlo">Cuando una recomendación avisa que quedó solo en esta sesión.</Row>
          </dl>
          <div className="mt-auto flex justify-center px-5 py-5">
            <Button variant="primary" onClick={() => setConfirm(true)} disabled={sync.isPending}>
              <RefreshCw strokeWidth={1.5} className={sync.isPending ? "animate-spin" : undefined} />
              {sync.isPending ? "Sincronizando…" : "Sincronizar ahora"}
            </Button>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="¿Reintentar lo que no se guardó?"
        description="Se volverán a guardar en la base las recomendaciones que quedaron solo en memoria."
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
          className="ml-2 inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-xs text-ink-subtle hover:bg-surface-2 hover:text-ink"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="size-3.5 text-success-ink" strokeWidth={1.5} /> : <Copy className="size-3.5" strokeWidth={1.5} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      ) : null}
    </Row>
  );
}
