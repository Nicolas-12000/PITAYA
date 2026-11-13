"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { ChartFrame } from "@/components/charts/ChartFrame";
import { KpiCard } from "@/components/data/KpiCard";
import { EmptyState } from "@/components/states/states";
import { Segmented } from "@/components/ui/controls";
import { Badge, Panel, PanelHeader } from "@/components/ui/primitives";
import type { MetricKey, ModelManifest } from "@/lib/api/types";
import { formatDateTime, formatDecimal, formatInterval, formatPValue, shortHash } from "@/lib/format";
import { MODEL_LABEL, MODEL_SHORT } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Split = "cv" | "test";
type Base = "roc_auc" | "pr_auc" | "f1" | "brier";

const METRICS: { base: Base; label: string; info: string; lowerIsBetter?: boolean }[] = [
  { base: "roc_auc", label: "ROC-AUC", info: "Probabilidad de ordenar un anuncio que convierte por encima de uno que no. 0,5 = azar." },
  { base: "pr_auc", label: "PR-AUC", info: "Área bajo precisión-recall; útil cuando importa la clase positiva." },
  { base: "f1", label: "F1", info: "Media armónica de precisión y recall con umbral 0,5." },
  { base: "brier", label: "Brier", info: "Error cuadrático de la probabilidad. Menor es mejor; mide calibración.", lowerIsBetter: true },
];

const TABLE_METRICS: { base: string; label: string; lowerIsBetter?: boolean }[] = [
  { base: "roc_auc", label: "ROC-AUC" },
  { base: "pr_auc", label: "PR-AUC" },
  { base: "f1", label: "F1" },
  { base: "precision", label: "Precisión" },
  { base: "recall", label: "Recall" },
  { base: "brier", label: "Brier", lowerIsBetter: true },
];

export function ModelsExplorer({ manifest }: { manifest: ModelManifest }) {
  const kinds = manifest.models.map((m) => m.kind);
  const [kind, setKind] = useState(kinds.includes("random_forest") ? "random_forest" : kinds[0]);
  const [split, setSplit] = useState<Split>("cv");
  const model = manifest.models.find((m) => m.kind === kind) ?? manifest.models[0];
  const dummy = manifest.models.find((m) => m.kind === "dummy");
  const folds = manifest.cv_fold_roc_auc[kind] ?? [];
  const metric = (base: string, s: Split = split, m = model) => m.metrics[`${s}_${base}` as MetricKey];
  const wilcoxon = manifest.model_comparison.random_forest_vs_adaboost_wilcoxon;

  const best = (base: string, lower = false) => {
    const vals = manifest.models.map((m) => metric(base, split, m)).filter((v): v is number => v !== null);
    return lower ? Math.min(...vals) : Math.max(...vals);
  };

  // Rango de ROC-AUC entre folds (dato del manifiesto; no es un IC).
  const foldsSorted = [...manifest.models].sort(
    (a, b) => (metric("roc_auc", "cv", b) ?? 0) - (metric("roc_auc", "cv", a) ?? 0),
  );
  const allFolds = Object.values(manifest.cv_fold_roc_auc).flat();
  const lo = Math.min(0.4, ...allFolds);
  const hi = Math.max(0.8, ...allFolds);
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  const topCv = foldsSorted[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Escenario de features"
          value={manifest.feature_scenario}
          onChange={() => undefined}
          options={[
            {
              value: "prelaunch",
              label: "Pre-lanzamiento",
              disabled: manifest.feature_scenario !== "prelaunch",
              title: "Este snapshot no incluye modelos pre-lanzamiento",
            },
            { value: "inflight", label: "En vuelo", disabled: manifest.feature_scenario !== "inflight" },
          ]}
        />
        <Segmented
          label="Conjunto de evaluación"
          value={split}
          onChange={setSplit}
          options={[
            { value: "cv", label: "Validación cruzada" },
            { value: "test", label: "Prueba" },
          ]}
        />
        <span className="text-[12px] text-ink-subtle">
          Entrenado {formatDateTime(manifest.created_at)} · sklearn {manifest.sklearn_version} · semilla {manifest.random_seed}
        </span>
      </div>

      <Segmented
        label="Modelo"
        value={kind}
        onChange={setKind}
        className="w-full sm:w-auto"
        options={manifest.models.map((m) => ({ value: m.kind, label: MODEL_SHORT[m.kind] ?? m.kind }))}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
        {METRICS.map((m) => {
          const v = metric(m.base);
          const baseline = dummy ? metric(m.base, split, dummy) : null;
          const isRoc = m.base === "roc_auc" && split === "cv" && folds.length > 0;
          return (
            <KpiCard
              key={m.base}
              label={m.label}
              info={m.info}
              value={formatDecimal(v, 3)}
              note={
                isRoc ? (
                  <>
                    Rango entre folds{" "}
                    <span className="font-mono tabular">
                      {formatInterval(v, Math.min(...folds), Math.max(...folds), (x) => formatDecimal(x, 3))}
                    </span>
                  </>
                ) : (
                  <>
                    Intervalo <span className="font-mono">—</span> · baseline {formatDecimal(baseline, 3)}
                  </>
                )
              }
            />
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartFrame
          eyebrow={<p className="label-mono text-ink-tertiary">ROC-AUC por fold</p>}
          title={`${MODEL_LABEL[topCv.kind] ?? topCv.kind} tiene el mayor ROC-AUC medio en validación cruzada`}
          subtitle="Cada punto es un fold; la barra vertical es la media. Si los rangos se solapan, la diferencia entre modelos no es concluyente."
          table={{
            columns: [
              { key: "model", label: "Modelo" },
              ...Array.from({ length: folds.length }, (_, i) => ({ key: `f${i}`, label: `Fold ${i + 1}`, align: "right" as const })),
              { key: "mean", label: "Media", align: "right" },
            ],
            rows: foldsSorted.map((m) => ({
              model: MODEL_LABEL[m.kind] ?? m.kind,
              ...Object.fromEntries((manifest.cv_fold_roc_auc[m.kind] ?? []).map((f, i) => [`f${i}`, formatDecimal(f, 3)])),
              mean: formatDecimal(metric("roc_auc", "cv", m), 3),
            })),
          }}
        >
          <ul className="space-y-4">
            {foldsSorted.map((m) => {
              const fs = manifest.cv_fold_roc_auc[m.kind] ?? [];
              const mean = metric("roc_auc", "cv", m) ?? 0;
              const active = m.kind === kind;
              return (
                <li key={m.kind}>
                  <button
                    type="button"
                    onClick={() => setKind(m.kind)}
                    className={cn(
                      "grid w-full grid-cols-[110px_1fr_56px] items-center gap-3 rounded-md px-2 py-1.5 text-left",
                      active ? "bg-primary-subtle" : "hover:bg-surface-2",
                    )}
                  >
                    <span className={cn("truncate text-[13px]", active ? "text-ink" : "text-ink-muted")}>
                      {MODEL_SHORT[m.kind] ?? m.kind}
                    </span>
                    <span className="relative h-6">
                      <span className="absolute inset-x-0 top-1/2 h-px bg-hairline-strong" />
                      <span
                        className="absolute top-1/2 h-px -translate-y-1/2 bg-ink-subtle"
                        style={{ left: pos(Math.min(...fs)), width: `calc(${pos(Math.max(...fs))} - ${pos(Math.min(...fs))})` }}
                      />
                      <span
                        className="absolute top-0.5 bottom-0.5 w-px bg-hairline-tertiary"
                        style={{ left: pos(0.5) }}
                        title="0,5 = azar"
                      />
                      {fs.map((f, i) => (
                        <span
                          key={i}
                          className={cn(
                            "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border",
                            active ? "border-primary bg-primary" : "border-ink-subtle bg-surface-1",
                          )}
                          style={{ left: pos(f) }}
                        />
                      ))}
                      <span
                        className={cn("absolute top-0 bottom-0 w-0.5 -translate-x-1/2 rounded-full", active ? "bg-primary" : "bg-ink")}
                        style={{ left: pos(mean) }}
                      />
                    </span>
                    <span className="text-right font-mono text-[13px] text-ink tabular">{formatDecimal(mean, 3)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 grid grid-cols-[110px_1fr_56px] gap-3 px-2 font-mono text-[11px] text-ink-tertiary tabular">
            <span />
            <span className="relative h-4">
              <span className="absolute left-0">{formatDecimal(lo, 2)}</span>
              <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pos(0.5) }}>
                0,50 azar
              </span>
              <span className="absolute right-0">{formatDecimal(hi, 2)}</span>
            </span>
          </div>
        </ChartFrame>

        <div className="space-y-6">
          <Panel className="rounded-xl">
            <PanelHeader
              eyebrow={<p className="label-mono text-ink-tertiary">Random Forest vs AdaBoost</p>}
              title={
                wilcoxon
                  ? wilcoxon.p_value < 0.05
                    ? "Los dos modelos difieren de forma significativa"
                    : "No hay evidencia de que uno supere al otro"
                  : "Comparación no disponible"
              }
            />
            {wilcoxon ? (
              <div className="px-5 pt-3 pb-5">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-[12px] text-ink-subtle">Estadístico W</dt>
                    <dd className="mt-1 font-mono text-[20px] text-ink tabular">{formatDecimal(wilcoxon.statistic, 1)}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] text-ink-subtle">Valor p</dt>
                    <dd className="mt-1 font-mono text-[20px] text-ink tabular">{formatPValue(wilcoxon.p_value)}</dd>
                  </div>
                </dl>
                <p className="mt-4 text-[13px] text-ink-muted text-pretty">
                  La prueba de rangos con signo de Wilcoxon compara el ROC-AUC de ambos modelos fold a fold. Con p ={" "}
                  {formatPValue(wilcoxon.p_value)}
                  {wilcoxon.p_value < 0.05
                    ? ", la diferencia no parece debida al azar."
                    : ", la diferencia observada es compatible con el azar: con 5 folds conviene preferir el modelo más simple."}
                </p>
              </div>
            ) : null}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success-ink" strokeWidth={1.5} aria-hidden />
              <div className="text-[13px] text-ink-muted">
                <p className="font-medium text-ink">Sin fuga de información</p>
                <p className="mt-1 text-pretty">
                  <code className="font-mono text-ink">Total_Conversion</code> no se usa como variable: incluye las
                  conversiones aprobadas y filtraría la respuesta. El preprocesamiento vive dentro del Pipeline de scikit-learn.
                </p>
                <ul className="mt-3 space-y-1 text-[12px] text-ink-subtle">
                  {Object.entries(manifest.notes).map(([k, v]) => (
                    <li key={k}>
                      <span className="font-mono text-ink-tertiary">{k}</span> · {v}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Todas las métricas"
          subtitle={`${split === "cv" ? "Media de validación cruzada" : "Conjunto de prueba"}. En negrita, el mejor valor de cada columna.`}
          actions={<Badge className="font-mono">dataset {shortHash(manifest.dataset_hash)}</Badge>}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-[13px]">
            <thead>
              <tr className="border-y border-hairline text-ink-subtle">
                <th scope="col" className="px-5 py-2.5 text-left font-medium">Modelo</th>
                {TABLE_METRICS.map((m) => (
                  <th key={m.base} scope="col" className="px-3 py-2.5 text-right font-medium last:pr-5">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {manifest.models.map((m) => (
                <tr
                  key={m.kind}
                  onClick={() => setKind(m.kind)}
                  className={cn("h-11 cursor-pointer border-b border-hairline last:border-0", m.kind === kind ? "bg-primary-subtle" : "hover:bg-surface-2")}
                >
                  <th scope="row" className="px-5 text-left font-normal text-ink">
                    {MODEL_LABEL[m.kind] ?? m.kind}
                  </th>
                  {TABLE_METRICS.map((t) => {
                    const v = metric(t.base, split, m);
                    const isBest = v !== null && v === best(t.base, t.lowerIsBetter);
                    return (
                      <td
                        key={t.base}
                        className={cn("px-3 text-right font-mono tabular last:pr-5", isBest ? "font-semibold text-ink" : "text-ink-muted")}
                      >
                        {formatDecimal(v, 3)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <EmptyState title="Curvas ROC, PR, calibración e importancias" mood="thinking">
          El manifiesto actual solo publica métricas agregadas. Cuando el backend exponga las curvas y la importancia por
          permutación en <code className="font-mono">/v1/models</code>, se dibujarán aquí.
        </EmptyState>
      </Panel>
    </div>
  );
}
