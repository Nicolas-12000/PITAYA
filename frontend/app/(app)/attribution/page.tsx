import type { Metadata } from "next";
import { Suspense } from "react";

import { BarList } from "@/components/charts/BarList";
import { Notice } from "@/components/notices/notices";
import { Busy, ChartSkeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { AttributionShapley, ChannelsResponse } from "@/lib/api/types";
import { formatInteger, formatPercent } from "@/lib/format";
import { FACTOR_LABEL } from "@/lib/labels";

import { CampaignSplit } from "./_components/CampaignSplit";

export const metadata: Metadata = { title: "Atribución" };

export default function AttributionPage() {
  return (
    <>
      <PageHeader
        title="Atribución"
        description="Reparte las conversiones del dataset. A la izquierda, cuánto separan campaña, edad, género e interés. A la derecha, qué parte del resultado real aporta cada campaña."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Suspense fallback={<Busy><ChartSkeleton height={220} /></Busy>}>
          <LevelA />
        </Suspense>
        <Suspense fallback={<Busy><ChartSkeleton height={220} /></Busy>}>
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
    value: degenerate ? 0 : (d.shapley_shares[f] ?? 0),
    display: formatPercent(degenerate ? 0 : (d.shapley_shares[f] ?? 0), 0),
  }));

  return (
    <Panel className="flex h-full flex-col rounded-xl">
      <PanelHeader
        eyebrow={<p className="label-mono text-ink-tertiary">Nivel A</p>}
        title={
          degenerate
            ? "Estos factores no separan las conversiones"
            : `${[...items].sort((a, b) => b.value - a.value)[0].label} es lo que más separa los anuncios que convierten`
        }
        subtitle={`Sobre ${formatInteger(d.grand_total_approved)} conversiones aprobadas. Cada barra es un factor del anuncio, no una campaña.`}
      />
      <div className="flex flex-1 flex-col justify-between gap-8 px-5 pt-6 pb-6">
        <BarList items={items} size="lg" />
        <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted text-pretty">
          <p>
            {degenerate
              ? "Campaña, edad, género e interés no cambian el resultado de un anuncio a otro, así que no hay una parte que atribuir."
              : `La barra más larga es el factor que más cambia el resultado al pasar de un anuncio a otro, descontando lo que ya explican los demás. Juntos separan el ${formatPercent(d.variance_explained ?? 0, 0)} de esa diferencia. El rosa de aquí no es una campaña: solo marca el tamaño.`}
          </p>
          <p>
            Campaña es a cuál de las tres pertenece el anuncio. Edad es el rango de quien lo vio. Género distingue mujer y
            hombre. Interés es el tema de Facebook al que se dirigió.
          </p>
        </div>
        {degenerate ? (
          <Notice tone="warning" className="mt-4" title="Sin diferencias que repartir.">
            Con estas filas el resultado no cambia al mirar campaña, edad, género o interés.
          </Notice>
        ) : null}
      </div>
    </Panel>
  );
}

async function LevelB() {
  const res = await load<ChannelsResponse>("v1/channels/compare");
  if (!res.ok) return <ErrorState title="No pudimos cargar el reparto por campaña" message={res.message} />;
  return (
    <Panel className="h-full rounded-xl">
      <PanelHeader
        eyebrow={<p className="label-mono text-ink-tertiary">Nivel B</p>}
        title="Qué aportó cada campaña"
        subtitle="Conversiones, clics y gasto medidos en el dataset. No hay recorridos inventados."
      />
      <CampaignSplit campaigns={res.data.campaigns} />
    </Panel>
  );
}
