import type { Metadata } from "next";
import { Suspense } from "react";

import { Notice } from "@/components/notices/notices";
import { TableSkeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader, Panel, PanelHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { ChannelsResponse, RoiResponse } from "@/lib/api/types";
import { formatCurrency, formatInteger, formatRatio, formatRate } from "@/lib/format";
import { campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import { RoiSensitivity } from "./_components/RoiSensitivity";
import { RoiSkeleton } from "./_components/RoiSkeleton";

export const metadata: Metadata = { title: "ROI" };

export default function RoiPage() {
  return (
    <>
      <PageHeader
        title="ROI y punto de equilibrio"
        description="El ingreso no se observa en el dataset: se estima como conversiones aprobadas × valor por conversión. Explora cómo cambia el ROI según ese valor."
      />
      <Suspense fallback={<RoiSkeleton />}>
        <Sensitivity />
      </Suspense>
      <Suspense fallback={<TableSkeleton rows={3} cols={6} className="mt-6" />}>
        <CampaignTable />
      </Suspense>
    </>
  );
}

async function Sensitivity() {
  const roi = await load<RoiResponse>("v1/roi");
  if (!roi.ok) return <ErrorState title="No pudimos cargar la sensibilidad del ROI" message={roi.message} />;
  return <RoiSensitivity data={roi.data} />;
}

async function CampaignTable() {
  const channels = await load<ChannelsResponse>("v1/channels/compare");
  if (!channels.ok) return <ErrorState className="mt-6" title="No pudimos cargar las campañas" message={channels.message} />;
  const rows = [...channels.data.campaigns].sort((a, b) => b.kpis.roas - a.kpis.roas);
  return (
    <Panel className="mt-6 overflow-hidden">
      <PanelHeader
        title="KPIs por campaña con el valor base"
        subtitle="ROAS ≥ 1× significa que el ingreso estimado cubre el gasto. Verde recupera la inversión; coral pierde dinero."
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="border-y border-hairline text-ink-subtle">
              <th scope="col" className="px-5 py-2.5 text-left font-medium">Campaña</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Gasto</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Aprobadas</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">CVR</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">CPA</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Ingreso est.</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.xyz_campaign_id} className="h-11 border-b border-hairline last:border-0">
                <th scope="row" className="px-5 text-left font-normal">
                  <span className="inline-flex items-center gap-2 font-mono text-ink">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(c.xyz_campaign_id) }} />
                    {c.xyz_campaign_id}
                  </span>
                </th>
                <td className="px-3 text-right font-mono text-ink tabular">{formatCurrency(c.kpis.spent)}</td>
                <td className="px-3 text-right font-mono text-ink tabular">{formatInteger(c.kpis.approved_conversions)}</td>
                <td className="px-3 text-right font-mono text-ink tabular">{formatRate(c.kpis.cvr)}</td>
                <td className="px-3 text-right font-mono text-ink tabular">{formatCurrency(c.kpis.cpa)}</td>
                <td className="px-3 text-right font-mono text-ink tabular">{formatCurrency(c.kpis.estimated_revenue)}</td>
                <td
                  className={cn(
                    "px-5 text-right font-mono font-medium tabular",
                    c.kpis.roas >= 1 ? "text-success-ink" : "text-danger-ink",
                  )}
                >
                  {formatRatio(c.kpis.roas)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-5 pt-4">
        <Notice>
          El backend calcula la sensibilidad solo a nivel global; el ROI por campaña con otros valores por conversión aún no
          está expuesto en la API.
        </Notice>
      </div>
    </Panel>
  );
}
