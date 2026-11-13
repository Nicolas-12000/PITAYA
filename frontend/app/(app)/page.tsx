import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";

import { BarList } from "@/components/charts/BarList";
import { KpiCard, MiniBars } from "@/components/data/KpiCard";
import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { Badge, PageHeader, Panel, PanelHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { ChannelsResponse, KpisResponse, RoiResponse, SegmentsResponse } from "@/lib/api/types";
import {
  formatCurrency,
  formatInteger,
  formatNumber,
  formatRatio,
  formatRate,
  formatSignedPercent,
} from "@/lib/format";
import { genderLabel } from "@/lib/labels";
import { campaignColor } from "@/lib/palette";

import { IntroFigures } from "./_components/IntroFigures";

export const metadata: Metadata = { title: "Resumen" };

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Resumen"
        description="Rendimiento global de las campañas de Facebook Ads del snapshot. El ingreso es estimado: conversiones aprobadas × valor por conversión configurado en el backend."
      />
      <Suspense fallback={<KpiRowSkeleton />}>
        <KpiRow />
      </Suspense>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton height={180} />}>
          <CampaignEfficiency />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height={180} />}>
          <TopSegments />
        </Suspense>
      </div>
      <IntroFigures />
    </>
  );
}

function KpiRowSkeleton() {
  return (
    <Busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <KpiSkeleton key={i} className="h-[196px]" />
      ))}
    </Busy>
  );
}

async function KpiRow() {
  const [kpis, roi, channels] = await Promise.all([
    load<KpisResponse>("v1/kpis"),
    load<RoiResponse>("v1/roi"),
    load<ChannelsResponse>("v1/channels/compare"),
  ]);
  if (!kpis.ok) return <ErrorState title="No pudimos cargar los KPIs" message={kpis.message} />;

  const k = kpis.data.kpis;
  const base = roi.ok ? roi.data.scenarios.find((s) => s.multiplier === 1) : undefined;
  const campaigns = channels.ok
    ? [...channels.data.campaigns].sort((a, b) => a.xyz_campaign_id - b.xyz_campaign_id)
    : [];
  const bars = (pick: (c: (typeof campaigns)[number]) => number, fmt: (v: number) => string) =>
    campaigns.length ? (
      <MiniBars
        items={campaigns.map((c) => ({
          label: String(c.xyz_campaign_id),
          value: pick(c),
          display: fmt(pick(c)),
          color: campaignColor(c.xyz_campaign_id),
        }))}
      />
    ) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        hero
        label="ROI estimado"
        value={formatSignedPercent(base?.roi)}
        tone={base ? (base.roi >= 0 ? "positive" : "negative") : undefined}
        info="(Ingreso estimado − gasto) / gasto, con el valor por conversión aprobada del backend."
        note={
          roi.ok
            ? `Con ${formatCurrency(roi.data.base_value_per_conversion)} por conversión. Equilibrio en ${formatCurrency(roi.data.break_even_value_per_conversion)}.`
            : roi.message
        }
        footer={
          <Link href="/roi" className="inline-flex items-center gap-1 text-[13px] text-primary-text hover:underline">
            Ver sensibilidad <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        }
      />
      <KpiCard
        label="Gasto total"
        value={formatCurrency(k.spent, 0)}
        info="Suma de Spent de todos los anuncios del snapshot."
        note={`${formatInteger(kpis.data.row_count)} anuncios · CPC ${formatCurrency(k.cpc)}`}
        footer={bars((c) => c.kpis.spent, (v) => formatCurrency(v, 0))}
      />
      <KpiCard
        label="Conversiones aprobadas"
        value={formatInteger(k.approved_conversions)}
        info="Suma de Approved_Conversion. CVR = aprobadas / clics."
        note={`CVR ${formatRate(k.cvr)} · ${formatNumber(k.clicks)} clics`}
        footer={bars((c) => c.kpis.approved_conversions, (v) => formatInteger(v))}
      />
      <KpiCard
        label="ROAS"
        value={formatRatio(k.roas)}
        info="Ingreso estimado / gasto. Por encima de 1× la campaña recupera lo invertido."
        note={`CTR ${formatRate(k.ctr)} · ${formatNumber(k.impressions)} impresiones`}
        footer={bars((c) => c.kpis.roas, (v) => formatRatio(v, 1))}
      />
    </div>
  );
}

async function CampaignEfficiency() {
  const channels = await load<ChannelsResponse>("v1/channels/compare");
  if (!channels.ok) return <ErrorState title="No pudimos cargar la eficiencia" message={channels.message} />;
  const rows = [...channels.data.campaigns].sort((a, b) => a.kpis.cpa - b.kpis.cpa);
  const best = rows[0];
  return (
    <Panel className="rounded-xl">
      <PanelHeader
        eyebrow={<p className="label-mono text-ink-tertiary">Eficiencia por campaña</p>}
        title={best ? `La campaña ${best.xyz_campaign_id} tiene el menor costo por conversión` : "Costo por conversión"}
        subtitle="CPA agregado = gasto / conversiones aprobadas. Menor es mejor. Es un punto estimado: el intervalo por anuncio está en Pruebas A/B."
        actions={
          <Link href="/ab" className="text-[13px] text-primary-text hover:underline">
            Ver intervalos
          </Link>
        }
      />
      <div className="px-5 pt-5 pb-5">
        <BarList
          labelWidth="w-24"
          items={rows.map((c) => ({
            key: String(c.xyz_campaign_id),
            label: <span className="font-mono">{c.xyz_campaign_id}</span>,
            sub: `${formatInteger(c.row_count)} anuncios`,
            value: c.kpis.cpa,
            display: formatCurrency(c.kpis.cpa),
            color: campaignColor(c.xyz_campaign_id),
          }))}
        />
      </div>
    </Panel>
  );
}

async function TopSegments() {
  const segments = await load<SegmentsResponse>("v1/segments");
  if (!segments.ok) return <ErrorState title="No pudimos cargar los segmentos" message={segments.message} />;
  const top = segments.data.segments
    .filter((s) => s.kpis.approved_conversions >= 3)
    .sort((a, b) => b.kpis.roas - a.kpis.roas)
    .slice(0, 5);

  return (
    <Panel className="rounded-xl">
      <PanelHeader
        eyebrow={<p className="label-mono text-ink-tertiary">Segmentos que más rinden</p>}
        title="Top 5 segmentos por ROAS"
        subtitle="Campaña × edad × género × interés, con al menos 3 conversiones aprobadas para evitar ruido."
        actions={
          <Link href="/campaigns" className="text-[13px] text-primary-text hover:underline">
            Ver todos
          </Link>
        }
      />
      <ol className="mt-3 px-2 pb-3">
        {top.map((s, i) => {
          const qs = new URLSearchParams({
            campaign: String(s.xyz_campaign_id),
            age: s.age,
            gender: s.gender,
            interest: String(s.interest),
          });
          return (
            <li key={`${s.xyz_campaign_id}-${s.age}-${s.gender}-${s.interest}`}>
              <Link
                href={`/campaigns?${qs.toString()}`}
                className="group grid grid-cols-[20px_1fr_auto] items-center gap-3 rounded-md px-3 py-2.5 hover:bg-surface-2"
              >
                <span className="font-mono text-[12px] text-ink-tertiary tabular">{i + 1}</span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5 text-[14px] text-ink">
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(s.xyz_campaign_id) }} />
                      {s.xyz_campaign_id}
                    </span>
                    <span className="text-ink-tertiary">·</span>
                    {s.age}
                    <span className="text-ink-tertiary">·</span>
                    {genderLabel(s.gender)}
                    <span className="text-ink-tertiary">·</span>
                    interés {s.interest}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-subtle">
                    {formatInteger(s.kpis.approved_conversions)} conversiones · CPA {formatCurrency(s.kpis.cpa)}
                  </span>
                </span>
                <Badge tone={s.kpis.roas >= 1 ? "success" : "danger"} className="font-mono tabular">
                  {formatRatio(s.kpis.roas, 1)}
                </Badge>
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
