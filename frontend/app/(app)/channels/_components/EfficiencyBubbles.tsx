"use client";

import { useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { ChartFrame } from "@/components/charts/ChartFrame";
import { AXIS_PROPS, ChartTooltipBox, GRID_PROPS } from "@/components/charts/ChartTooltip";
import { Segmented, Select } from "@/components/ui/controls";
import { Badge, Panel, PanelHeader } from "@/components/ui/primitives";
import type { CampaignRow, Segment } from "@/lib/api/types";
import { formatCurrency, formatInteger, formatRatio } from "@/lib/format";
import { genderLabel } from "@/lib/labels";
import { CAMPAIGN_IDS, CAMPAIGN_SHAPE, campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

type Point = { id: string; campaign: string; label: string; cpa: number; roas: number; spent: number; conversions: number };

export function EfficiencyBubbles({
  channel,
  campaigns,
  segments,
  segmentsError,
}: {
  channel: string;
  campaigns: CampaignRow[];
  segments: Segment[];
  segmentsError: string | null;
}) {
  const [level, setLevel] = useState<"campaigns" | "segments">("campaigns");
  const [hover, setHover] = useState<string | null>(null);

  const campaignPoints: Point[] = campaigns.map((c) => ({
    id: String(c.xyz_campaign_id),
    campaign: String(c.xyz_campaign_id),
    label: `Campaña ${c.xyz_campaign_id}`,
    cpa: c.kpis.cpa,
    roas: c.kpis.roas,
    spent: c.kpis.spent,
    conversions: c.kpis.approved_conversions,
  }));
  const segmentPoints: Point[] = segments
    .filter((s) => s.kpis.approved_conversions > 0 && s.kpis.spent > 0)
    .map((s) => ({
      id: `${s.xyz_campaign_id}|${s.age}|${s.gender}|${s.interest}`,
      campaign: String(s.xyz_campaign_id),
      label: `${s.xyz_campaign_id} · ${s.age} · ${genderLabel(s.gender)} · #${s.interest}`,
      cpa: s.kpis.cpa,
      roas: s.kpis.roas,
      spent: s.kpis.spent,
      conversions: s.kpis.approved_conversions,
    }));

  const points = level === "campaigns" ? campaignPoints : segmentPoints;
  const ranking = [...points].sort((a, b) => b.roas - a.roas).slice(0, level === "campaigns" ? 3 : 10);
  const best = ranking[0];
  const isLog = level === "segments";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ChartFrame
        eyebrow={
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-36">
              <Select aria-label="Canal" defaultValue={channel} className="h-8 text-[13px] max-md:h-10">
                <option value={channel}>Facebook</option>
              </Select>
            </div>
            <Segmented
              size="sm"
              label="Nivel"
              value={level}
              onChange={setLevel}
              options={[
                { value: "campaigns", label: "Campañas" },
                { value: "segments", label: `Segmentos (${formatInteger(segmentPoints.length)})`, disabled: !segmentPoints.length },
              ]}
            />
          </div>
        }
        title={best ? `${best.label} tiene el mejor retorno: ${formatRatio(best.roas)} con CPA de ${formatCurrency(best.cpa)}` : "Sin datos"}
        subtitle={
          isLog
            ? "Escala logarítmica en ambos ejes; solo segmentos con al menos una conversión aprobada. El tamaño es el gasto."
            : "El tamaño de cada burbuja es el gasto. La línea punteada marca ROAS = 1× (recupera la inversión)."
        }
        table={{
          columns: [
            { key: "label", label: level === "campaigns" ? "Campaña" : "Segmento" },
            { key: "cpa", label: "CPA", align: "right" },
            { key: "roas", label: "ROAS", align: "right" },
            { key: "spent", label: "Gasto", align: "right" },
          ],
          rows: [...points]
            .sort((a, b) => b.roas - a.roas)
            .map((p) => ({ label: p.label, cpa: formatCurrency(p.cpa), roas: formatRatio(p.roas), spent: formatCurrency(p.spent, 0) })),
        }}
        minHeight={400}
      >
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 16, bottom: 20, left: 4 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                type="number"
                dataKey="cpa"
                name="CPA"
                scale={isLog ? "log" : "linear"}
                domain={isLog ? ["auto", "auto"] : [0, "auto"]}
                {...AXIS_PROPS}
                tickFormatter={(v: number) => formatCurrency(v, 0)}
                label={{ value: "CPA (menor es mejor)", position: "insideBottom", offset: -12, fill: "var(--ink-subtle)", fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="roas"
                name="ROAS"
                scale={isLog ? "log" : "linear"}
                domain={isLog ? ["auto", "auto"] : [0, "auto"]}
                width={52}
                {...AXIS_PROPS}
                tickFormatter={(v: number) => formatRatio(v, v < 10 ? 1 : 0)}
              />
              <ZAxis type="number" dataKey="spent" range={isLog ? [24, 400] : [200, 2400]} />
              <ReferenceLine y={1} stroke="var(--ink-subtle)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "var(--hairline-strong)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as Point;
                  return (
                    <ChartTooltipBox
                      title={p.label}
                      rows={[
                        { label: "CPA", value: formatCurrency(p.cpa) },
                        { label: "ROAS", value: formatRatio(p.roas) },
                        { label: "Gasto", value: formatCurrency(p.spent, 0) },
                        { label: "Aprobadas", value: formatInteger(p.conversions) },
                      ]}
                    />
                  );
                }}
              />
              {CAMPAIGN_IDS.map((cid) => {
                const data = points.filter((p) => p.campaign === String(cid));
                return (
                  <Scatter
                    key={cid}
                    name={`Campaña ${cid}`}
                    data={data}
                    shape={CAMPAIGN_SHAPE[String(cid)] === "square" ? "square" : CAMPAIGN_SHAPE[String(cid)] === "diamond" ? "diamond" : "circle"}
                    fill={campaignColor(cid)}
                    fillOpacity={isLog ? 0.55 : 0.75}
                    stroke={campaignColor(cid)}
                    strokeWidth={1}
                    animationDuration={320}
                    onMouseEnter={(d: unknown) => setHover((d as { payload?: Point })?.payload?.id ?? null)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 flex flex-wrap gap-4 text-[12px] text-ink-subtle">
          {CAMPAIGN_IDS.map((cid) => (
            <li key={cid} className="inline-flex items-center gap-1.5">
              <ShapeIcon id={String(cid)} />
              Campaña <span className="font-mono">{cid}</span>
            </li>
          ))}
        </ul>
      </ChartFrame>

      <Panel className="flex flex-col">
        <PanelHeader title="Ranking por ROAS" subtitle={level === "campaigns" ? "Las tres campañas" : "Top 10 segmentos con conversiones"} />
        <ol className="mt-3 flex-1 space-y-1 px-2 pb-3">
          {ranking.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "grid grid-cols-[20px_1fr_auto] items-center gap-3 rounded-md px-3 py-2",
                hover === p.id ? "bg-surface-2" : undefined,
              )}
            >
              <span className="font-mono text-[12px] text-ink-tertiary tabular">{i + 1}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 truncate text-[13px] text-ink">
                  <ShapeIcon id={p.campaign} />
                  <span className="truncate">{p.label}</span>
                </span>
                <span className="block text-[12px] text-ink-subtle">
                  CPA {formatCurrency(p.cpa)} · {formatCurrency(p.spent, 0)}
                </span>
              </span>
              <Badge tone={p.roas >= 1 ? "success" : "danger"} className="font-mono tabular">
                {formatRatio(p.roas, 1)}
              </Badge>
            </li>
          ))}
        </ol>
        {segmentsError && level === "segments" ? <p className="px-5 pb-4 text-[12px] text-danger-ink">{segmentsError}</p> : null}
      </Panel>
    </div>
  );
}

function ShapeIcon({ id }: { id: string }) {
  const shape = CAMPAIGN_SHAPE[id] ?? "circle";
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0", shape === "circle" && "rounded-full", shape === "diamond" && "rotate-45 scale-90")}
      style={{ background: campaignColor(id) }}
    />
  );
}
