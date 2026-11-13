import type { Metadata } from "next";
import { Suspense } from "react";

import { DivergingBars } from "@/components/charts/BarList";
import { Notice, SimulatedBadge } from "@/components/notices/notices";
import { Busy, ChartSkeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { Badge, PageHeader, Panel, PanelHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { AttributionShapley, AttributionSynthetic } from "@/lib/api/types";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { ATTRIBUTION_MODELS, FACTOR_LABEL } from "@/lib/labels";

import { SyntheticAttribution } from "./_components/SyntheticAttribution";

export const metadata: Metadata = { title: "Atribución" };

export default function AttributionPage() {
  return (
    <>
      <PageHeader
        title="Atribución"
        description="Nivel A reparte las conversiones reales entre los factores del anuncio con valores de Shapley exactos. Nivel B compara modelos multi-touch sobre recorridos simulados."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Suspense fallback={<Busy><ChartSkeleton height={220} /></Busy>}>
          <LevelA />
        </Suspense>
        <Suspense fallback={<Busy><ChartSkeleton height={220} className="border-dashed border-series-4" /></Busy>}>
          <LevelB />
        </Suspense>
      </div>
    </>
  );
}

async function LevelA() {
  const res = await load<AttributionShapley>("v1/attribution?model=shapley");
  if (!res.ok) return <ErrorState title="No pudimos calcular Shapley" message={res.message} />;
  const d = res.data;
  const maxAbs = Math.max(...Object.values(d.shapley_values).map(Math.abs));
  const degenerate = maxAbs < 1e-6;
  const items = d.factors.map((f) => ({
    key: f,
    label: FACTOR_LABEL[f] ?? f,
    value: d.shapley_values[f] ?? 0,
    display: degenerate ? formatDecimal(0, 3) : formatDecimal(d.shapley_values[f], 2),
  }));

  return (
    <Panel className="rounded-xl">
      <PanelHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <p className="label-mono text-ink-tertiary">Nivel A</p>
            <Badge tone="success" dot>
              Datos reales
            </Badge>
          </span>
        }
        title={
          degenerate
            ? "Shapley no distingue factores con la función de valor actual"
            : `${[...items].sort((a, b) => b.value - a.value)[0].label} es el factor que más explica las conversiones`
        }
        subtitle={`Contribución de campaña, edad, género e interés a ${formatInteger(d.grand_total_approved)} conversiones aprobadas. Verde suma, coral resta.`}
      />
      <div className="px-5 pt-5 pb-5">
        <DivergingBars items={items} />
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-hairline pt-4 text-[12px]">
          <div>
            <dt className="text-ink-subtle">Total aprobado</dt>
            <dd className="mt-0.5 font-mono text-[14px] text-ink tabular">{formatInteger(d.grand_total_approved)}</dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Valor de la coalición completa</dt>
            <dd className="mt-0.5 font-mono text-[14px] text-ink tabular">{formatDecimal(d.coalition_check_grand_value, 1)}</dd>
          </div>
        </dl>
        {degenerate ? (
          <Notice tone="warning" className="mt-4" title="Resultado degenerado.">
            Todas las contribuciones son ≈ 0 (máx. |φ| = {maxAbs.toExponential(1)}). La función de valor del backend suma las
            medias por celda, y esa suma siempre es igual al total sin importar la coalición, por lo que ningún factor aporta.
            Hace falta una función de valor que mida ajuste (p. ej. varianza explicada) para que Shapley sea informativo.
          </Notice>
        ) : (
          <p className="mt-4 text-[12px] text-ink-tertiary">
            Participación: {d.factors.map((f) => `${FACTOR_LABEL[f]} ${formatPercent(d.shapley_shares[f], 0)}`).join(" · ")}
          </p>
        )}
      </div>
    </Panel>
  );
}

async function LevelB() {
  const results = await Promise.all(
    ATTRIBUTION_MODELS.map((m) => load<AttributionSynthetic>(`v1/attribution?model=${m.id}`)),
  );
  const ok = results.flatMap((r) => (r.ok ? [r.data] : []));
  if (!ok.length) {
    const first = results[0];
    return (
      <ErrorState
        title="No pudimos cargar la atribución simulada"
        message={first && !first.ok ? first.message : "Sin datos"}
      />
    );
  }
  return (
    <Panel className="border-dashed border-series-4 rounded-xl">
      <PanelHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <p className="label-mono text-ink-tertiary">Nivel B</p>
            <SimulatedBadge />
          </span>
        }
        title="Comparación de modelos multi-touch"
        subtitle={`${formatInteger(ok[0].journeys)} recorridos sintéticos (semilla ${ok[0].random_seed}). Datos simulados: no corresponden a usuarios reales; sirven para entender cómo reparte crédito cada modelo.`}
      />
      <SyntheticAttribution results={ok} />
    </Panel>
  );
}
