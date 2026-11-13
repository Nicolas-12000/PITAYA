"use client";

import { ArrowLeftRight, CheckCircle2, CircleDashed } from "lucide-react";
import { useState } from "react";

import { ChartFrame } from "@/components/charts/ChartFrame";
import { KpiCard } from "@/components/data/KpiCard";
import { Notice } from "@/components/notices/notices";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Badge, Panel, PanelHeader, Stat } from "@/components/ui/primitives";
import type { AbTestResponse } from "@/lib/api/types";
import {
  formatCurrency,
  formatDecimal,
  formatInteger,
  formatInterval,
  formatNumber,
  formatPercent,
  formatPValue,
  formatRate,
  formatSignedPercent,
} from "@/lib/format";
import { campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

type Metric = "ctr" | "cvr" | "cpa";
const METRIC_LABEL: Record<Metric, string> = { ctr: "CTR", cvr: "CVR", cpa: "CPA" };

export function AbExplorer({ data }: { data: AbTestResponse }) {
  const ids = data.campaign_summaries.map((s) => String(s.campaign_id));
  const [tab, setTab] = useState<"compare" | "simulator">("compare");
  const [a, setA] = useState(ids[0]);
  const [b, setB] = useState(ids[1] ?? ids[0]);
  const [metric, setMetric] = useState<Metric>("cvr");

  const pick = (which: "a" | "b", value: string) => {
    if (which === "a") {
      if (value === b) setB(a);
      setA(value);
    } else {
      if (value === a) setA(b);
      setB(value);
    }
  };

  return (
    <div className="space-y-6">
      <Segmented
        label="Vista"
        value={tab}
        onChange={setTab}
        options={[
          { value: "compare", label: "Entre campañas" },
          { value: "simulator", label: "Tamaño de muestra" },
        ]}
      />
      {tab === "compare" ? (
        <>
          <Panel className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-6 font-mono text-[12px] text-ink-subtle">A</span>
              <Segmented
                label="Campaña A"
                value={a}
                onChange={(v) => pick("a", v)}
                options={ids.map((id) => ({ value: id, label: <CampaignLabel id={id} /> }))}
              />
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Intercambiar A y B"
              onClick={() => {
                setA(b);
                setB(a);
              }}
            >
              <ArrowLeftRight strokeWidth={1.5} />
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-6 font-mono text-[12px] text-ink-subtle">B</span>
              <Segmented
                label="Campaña B"
                value={b}
                onChange={(v) => pick("b", v)}
                options={ids.map((id) => ({ value: id, label: <CampaignLabel id={id} /> }))}
              />
            </div>
            <div className="flex items-center gap-3 lg:ml-auto">
              <span className="text-[12px] text-ink-subtle">Métrica</span>
              <Segmented
                label="Métrica"
                value={metric}
                onChange={setMetric}
                options={(["ctr", "cvr", "cpa"] as const).map((m) => ({ value: m, label: METRIC_LABEL[m] }))}
              />
            </div>
          </Panel>
          {metric === "cpa" ? <CpaComparison data={data} a={a} b={b} /> : <RateComparison data={data} a={a} b={b} metric={metric} />}
          <SummaryTable data={data} highlight={[a, b]} />
        </>
      ) : (
        <Simulator data={data} />
      )}
    </div>
  );
}

function CampaignLabel({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(id) }} />
      {id}
    </span>
  );
}

function RateComparison({ data, a, b, metric }: { data: AbTestResponse; a: string; b: string; metric: "ctr" | "cvr" }) {
  const raw = data.frequentist_comparisons.find(
    (c) =>
      c.metric === metric &&
      ((String(c.campaign_a) === a && String(c.campaign_b) === b) || (String(c.campaign_a) === b && String(c.campaign_b) === a)),
  );
  if (!raw || a === b) {
    return <Notice>Elige dos campañas distintas para comparar.</Notice>;
  }
  const flipped = String(raw.campaign_a) !== a;
  const rateA = flipped ? raw.rate_b : raw.rate_a;
  const rateB = flipped ? raw.rate_a : raw.rate_b;
  const z = flipped ? -raw.z_statistic : raw.z_statistic;
  const lift = rateA ? rateB / rateA - 1 : null;
  const winner = rateB > rateA ? b : a;

  const posteriors = Object.fromEntries(data.bayesian_posteriors.map((p) => [String(p.campaign_id), p]));
  const pair = data.bayesian_pairwise.find(
    (p) =>
      (String(p.campaign_a) === a && String(p.campaign_b) === b) || (String(p.campaign_a) === b && String(p.campaign_b) === a),
  );
  const pBbeatsA = pair ? (String(pair.campaign_a) === a ? pair.probability_b_beats_a : 1 - pair.probability_b_beats_a) : null;

  const verdict = raw.holm_significant
    ? `La campaña ${winner} tiene un ${METRIC_LABEL[metric]} mayor y la diferencia resiste la corrección de Holm`
    : raw.significant_at_005
      ? `Hay diferencia al 5 %, pero no sobrevive a la corrección por comparaciones múltiples`
      : `No hay evidencia de diferencia en ${METRIC_LABEL[metric]} entre ${a} y ${b}`;

  const pa = posteriors[a];
  const pb = posteriors[b];

  return (
    <>
      <Panel className="rounded-xl p-5">
        <div className="flex items-start gap-3">
          {raw.holm_significant ? (
            <CheckCircle2 className="mt-1 size-5 shrink-0 text-success-ink" strokeWidth={1.5} aria-hidden />
          ) : (
            <CircleDashed className="mt-1 size-5 shrink-0 text-ink-subtle" strokeWidth={1.5} aria-hidden />
          )}
          <div>
            <p className="label-mono text-ink-tertiary">Veredicto</p>
            <p className="mt-1 type-title text-ink text-balance" aria-live="polite">
              {verdict}.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          label={`${METRIC_LABEL[metric]} de A · ${a}`}
          value={formatRate(rateA)}
          note={metric === "cvr" && pa ? `${formatInteger(pa.successes)} aprobadas / ${formatInteger(pa.trials)} clics` : undefined}
        />
        <KpiCard
          label={`${METRIC_LABEL[metric]} de B · ${b}`}
          value={formatRate(rateB)}
          note={metric === "cvr" && pb ? `${formatInteger(pb.successes)} aprobadas / ${formatInteger(pb.trials)} clics` : undefined}
        />
        <KpiCard
          label="Diferencia relativa (B frente a A)"
          value={formatSignedPercent(lift, 1)}
          tone={lift === null ? undefined : lift >= 0 ? "positive" : "negative"}
          note={
            <span className="flex flex-wrap gap-x-3">
              <span>
                z = <span className="font-mono">{formatDecimal(z, 2)}</span>
              </span>
              <span>
                p = <span className="font-mono">{formatPValue(raw.p_value)}</span>
              </span>
              <span>Holm: {raw.holm_significant ? "significativo" : "no significativo"}</span>
            </span>
          }
        />
      </div>

      {metric === "cvr" && pa && pb ? (
        <ChartFrame
          eyebrow={<p className="label-mono text-ink-tertiary">Bayesiano · Beta-Binomial con prior uniforme</p>}
          title={
            pBbeatsA !== null
              ? `P(B > A) = ${formatPercent(pBbeatsA, 1)}: ${pBbeatsA > 0.95 ? `${b} supera a ${a} con alta probabilidad` : pBbeatsA < 0.05 ? `${a} supera a ${b} con alta probabilidad` : "la evidencia no es concluyente"}`
              : "Posteriores de la tasa de conversión"
          }
          subtitle="Media posterior con intervalo creíble del 95 %. Si los intervalos no se solapan, la diferencia es clara."
          minHeight={140}
          table={{
            columns: [
              { key: "c", label: "Campaña" },
              { key: "mean", label: "Media posterior", align: "right" },
              { key: "ci", label: "IC 95 %", align: "right" },
            ],
            rows: [pa, pb].map((p) => ({
              c: String(p.campaign_id),
              mean: formatPercent(p.posterior_mean, 2),
              ci: formatInterval(p.posterior_mean, p.credible_interval_95[0], p.credible_interval_95[1], (v) => formatPercent(v, 2)),
            })),
          }}
        >
          <ForestPlot
            rows={[pa, pb].map((p) => ({
              id: String(p.campaign_id),
              label: String(p.campaign_id) === a ? "A" : "B",
              mean: p.posterior_mean,
              low: p.credible_interval_95[0],
              high: p.credible_interval_95[1],
            }))}
            fmt={(v) => formatPercent(v, 1)}
          />
        </ChartFrame>
      ) : (
        <Notice>
          Las posteriores bayesianas del backend se calculan sobre el CVR (aprobadas / clics). Cambia a CVR para verlas.
        </Notice>
      )}
    </>
  );
}

function CpaComparison({ data, a, b }: { data: AbTestResponse; a: string; b: string }) {
  const ca = data.bootstrap_cpa[a];
  const cb = data.bootstrap_cpa[b];
  if (!ca || !cb || a === b) return <Notice>Elige dos campañas distintas para comparar.</Notice>;
  const overlap = ca.cpa_ci_low <= cb.cpa_ci_high && cb.cpa_ci_low <= ca.cpa_ci_high;
  const cheaper = ca.cpa_mean <= cb.cpa_mean ? a : b;
  return (
    <ChartFrame
      eyebrow={<p className="label-mono text-ink-tertiary">Bootstrap · 1.000 remuestreos</p>}
      title={
        overlap
          ? `Los intervalos del CPA de ${a} y ${b} se solapan: no hay diferencia clara`
          : `La campaña ${cheaper} consigue conversiones más baratas y los intervalos no se solapan`
      }
      subtitle="CPA medio por anuncio con conversiones, con intervalo percentil del 95 %. Difiere del CPA agregado (gasto total / aprobadas)."
      minHeight={140}
      table={{
        columns: [
          { key: "c", label: "Campaña" },
          { key: "mean", label: "CPA medio", align: "right" },
          { key: "ci", label: "IC 95 %", align: "right" },
        ],
        rows: [
          [a, ca],
          [b, cb],
        ].map(([id, v]) => {
          const x = v as typeof ca;
          return { c: id as string, mean: formatCurrency(x.cpa_mean), ci: formatInterval(x.cpa_mean, x.cpa_ci_low, x.cpa_ci_high, (n) => formatCurrency(n)) };
        }),
      }}
    >
      <ForestPlot
        rows={[
          { id: a, label: "A", mean: ca.cpa_mean, low: ca.cpa_ci_low, high: ca.cpa_ci_high },
          { id: b, label: "B", mean: cb.cpa_mean, low: cb.cpa_ci_low, high: cb.cpa_ci_high },
        ]}
        fmt={(v) => formatCurrency(v)}
        fromZero
      />
    </ChartFrame>
  );
}

/** Gráfico de intervalos: punto con bigotes, color de campaña + etiqueta A/B. */
function ForestPlot({
  rows,
  fmt,
  fromZero = false,
}: {
  rows: { id: string; label: string; mean: number; low: number; high: number }[];
  fmt: (v: number) => string;
  fromZero?: boolean;
}) {
  const min = fromZero ? 0 : Math.min(...rows.map((r) => r.low));
  const max = Math.max(...rows.map((r) => r.high));
  const pad = (max - min) * 0.08 || 1;
  const lo = fromZero ? 0 : Math.max(0, min - pad);
  const hi = max + pad;
  const pos = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  return (
    <div>
      <ul className="space-y-5">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[72px_1fr] items-center gap-3 sm:grid-cols-[72px_1fr_220px]">
            <span className="inline-flex items-center gap-2 text-[13px] text-ink">
              <span className="font-mono text-ink-subtle">{r.label}</span>
              <CampaignLabel id={r.id} />
            </span>
            <span className="relative h-8">
              <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
              <span
                className="bar-grow absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-35"
                style={{ left: pos(r.low), width: `calc(${pos(r.high)} - ${pos(r.low)})`, background: campaignColor(r.id) }}
              />
              <span className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink-subtle" style={{ left: pos(r.low) }} />
              <span className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink-subtle" style={{ left: pos(r.high) }} />
              <span
                className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-1"
                style={{ left: pos(r.mean), background: campaignColor(r.id) }}
              />
            </span>
            <span className="col-span-2 text-right font-mono text-[13px] text-ink tabular sm:col-span-1">
              {formatInterval(r.mean, r.low, r.high, (v) => fmt(v ?? 0))}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between font-mono text-[11px] text-ink-tertiary tabular sm:mr-[232px] sm:ml-[84px]">
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  );
}

function SummaryTable({ data, highlight }: { data: AbTestResponse; highlight: string[] }) {
  return (
    <Panel className="overflow-hidden">
      <PanelHeader title="Resumen por campaña" subtitle="Datos agregados de las tres campañas del snapshot." />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="border-y border-hairline text-ink-subtle">
              <th scope="col" className="px-5 py-2.5 text-left font-medium">Campaña</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">CTR</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">CVR</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">CPA</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Gasto</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Aprobadas</th>
            </tr>
          </thead>
          <tbody>
            {data.campaign_summaries.map((s) => {
              const id = String(s.campaign_id);
              const role = highlight[0] === id ? "A" : highlight[1] === id ? "B" : null;
              return (
                <tr key={id} className={cn("h-11 border-b border-hairline last:border-0", role && "bg-surface-2")}>
                  <th scope="row" className="px-5 text-left font-normal">
                    <span className="inline-flex items-center gap-2">
                      <CampaignLabel id={id} />
                      {role ? <Badge tone="primary">{role}</Badge> : null}
                    </span>
                  </th>
                  <td className="px-3 text-right font-mono text-ink tabular">{formatRate(s.ctr)}</td>
                  <td className="px-3 text-right font-mono text-ink tabular">{formatRate(s.cvr)}</td>
                  <td className="px-3 text-right font-mono text-ink tabular">{formatCurrency(s.cpa)}</td>
                  <td className="px-3 text-right font-mono text-ink tabular">{formatCurrency(s.spent, 0)}</td>
                  <td className="px-5 text-right font-mono text-ink tabular">{formatInteger(s.approved_conversions)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Simulator({ data }: { data: AbTestResponse }) {
  const s = data.sample_size_simulator;
  const years = s.estimated_days / 365;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Panel className="rounded-xl">
        <PanelHeader
          eyebrow={<p className="label-mono text-ink-tertiary">Calculadora de tamaño de muestra</p>}
          title={
            years > 1
              ? `Detectar +10 % de CTR exigiría unos ${formatNumber(years, 0)} años de tráfico`
              : `Detectar +10 % de CTR exigiría unos ${formatNumber(s.estimated_days, 0)} días`
          }
          subtitle={`Con un CTR base de ${formatRate(s.baseline_rate)} y 500 visitas diarias por variante. Las tasas tan bajas necesitan muestras enormes.`}
        />
        <dl className="grid grid-cols-2 gap-6 px-5 pt-6 pb-5 md:grid-cols-4">
          <Stat label="Muestra por grupo" value={formatNumber(s.n_per_group)} hint="impresiones" />
          <Stat label="Duración estimada" value={`${formatNumber(s.estimated_days, 0)} días`} />
          <Stat label="Tasa base" value={formatRate(s.baseline_rate)} />
          <Stat label="Tasa objetivo" value={formatRate(s.target_rate)} />
        </dl>
        <div className="border-t border-hairline px-5 py-4 text-[13px] text-ink-muted">
          Supuestos del backend: α = <span className="font-mono">{formatDecimal(s.assumption_alpha, 2)}</span> (dos colas),
          potencia = <span className="font-mono">{formatPercent(s.assumption_power, 0)}</span>, aproximación normal para dos
          proporciones. La tasa base es el CTR de la primera campaña seleccionada en el backend.
        </div>
      </Panel>
      <Notice title="Qué significa.">
        Un experimento aleatorizado real que compare variantes con CTR cercano a {formatRate(s.baseline_rate)} necesita
        millones de impresiones por grupo. Para decisiones rápidas, compara métricas con más señal (CVR o CPA) o acepta
        efectos mínimos detectables más grandes.
      </Notice>
    </div>
  );
}
