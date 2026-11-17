"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { AXIS_PROPS, ChartTooltipBox, GRID_PROPS } from "@/components/charts/ChartTooltip";
import { Segmented, Select } from "@/components/ui/controls";
import { Badge, Panel, PanelHeader } from "@/components/ui/primitives";
import type { CampaignRow, Segment } from "@/lib/api/types";
import { formatCurrency, formatInteger, formatRate, formatRatio } from "@/lib/format";
import { genderLabel } from "@/lib/labels";
import { CAMPAIGN_IDS, CAMPAIGN_SHAPE, campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

type Point = {
  id: string;
  campaign: string;
  label: string;
  cpa: number;
  roas: number;
  cvr: number;
  spent: number;
  conversions: number;
  plotCpa: number;
  plotY: number;
};

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
    cvr: c.kpis.cvr,
    spent: c.kpis.spent,
    conversions: c.kpis.approved_conversions,
    plotCpa: c.kpis.cpa,
    plotY: c.kpis.roas,
  }));
  const segmentPoints: Point[] = spreadOverlaps(
    segments
      .filter((s) => s.kpis.approved_conversions > 0 && s.kpis.spent > 0)
      .map((s) => ({
        id: `${s.xyz_campaign_id}|${s.age}|${s.gender}|${s.interest}`,
        campaign: String(s.xyz_campaign_id),
        label: `${s.xyz_campaign_id} · ${s.age} · ${genderLabel(s.gender)} · #${s.interest}`,
        cpa: s.kpis.cpa,
        roas: s.kpis.roas,
        cvr: s.kpis.cvr,
        spent: s.kpis.spent,
        conversions: s.kpis.approved_conversions,
        plotCpa: s.kpis.cpa,
        plotY: s.kpis.cvr,
      })),
  );

  const points = level === "campaigns" ? campaignPoints : segmentPoints;
  const ranking = [...points].sort((a, b) => b.roas - a.roas).slice(0, level === "campaigns" ? 3 : 10);
  const best = ranking[0];
  const isLog = level === "segments";
  const bounds = useMemo(() => fullBounds(points, isLog, isLog), [points, isLog]);
  const [zoom, setZoom] = useState<ViewBox | null>(null);
  const view = zoom ?? bounds;
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartEl, setChartEl] = useState<HTMLDivElement | null>(null);
  const setChartNode = useCallback((node: HTMLDivElement | null) => {
    chartRef.current = node;
    setChartEl(node);
  }, []);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; view: ViewBox } | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const viewRef = useRef(view);
  const boundsRef = useRef(bounds);
  const logRef = useRef(isLog);
  viewRef.current = view;
  boundsRef.current = bounds;
  logRef.current = isLog;

  useEffect(() => {
    setZoom(null);
  }, [level]);

  useEffect(() => {
    const el = chartEl;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const box = readPlotBox(el);
      if (!box) return;
      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      if (!inside(px, py, box)) return;
      event.preventDefault();
      const logX = logRef.current;
      const current = viewRef.current;
      const limits = boundsRef.current;
      const anchor = pxToData(px, py, box, current, logX, logX);
      const factor = event.deltaY > 0 ? 1.28 : 0.78;
      const next = clampView(zoomBy(current, anchor, factor, logX, logX), limits, logX, logX);
      setZoom(nearlyFull(next, limits) ? null : next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [chartEl]);

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
            ? "Cada marca es un segmento. Horizontal: costo por conversión. Vertical: tasa de conversión, en escala logarítmica. El tamaño es el gasto."
            : "El tamaño es el gasto. La línea punteada marca retorno 1×: a partir de ahí se recupera la inversión."
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
        minHeight={520}
        actions={
          zoom ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => setZoom(null)}>
              Ver todo
            </Button>
          ) : null
        }
      >
        <div
          ref={setChartNode}
          role="application"
          aria-label="Gráfico de eficiencia. Arrastra un recuadro para acercar."
          className={`relative h-[clamp(400px,calc(100dvh-520px),620px)] w-full touch-none select-none ${zoom ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
          onDoubleClick={() => setZoom(null)}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            const el = chartRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const box = readPlotBox(el);
            if (!box || !inside(x, y, box)) return;
            if (zoom) {
              panRef.current = { x, y, view };
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                // The browser rejects capture for a pointer that is already gone.
              }
              return;
            }
            dragRef.current = { x, y };
            setSelection({ x, y, w: 0, h: 0 });
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // The browser rejects capture for a pointer that is already gone.
            }
          }}
          onPointerMove={(event) => {
            const el = chartRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const pan = panRef.current;
            if (pan) {
              const box = readPlotBox(el);
              if (!box) return;
              setZoom(clampPan(panView(pan.view, x - pan.x, y - pan.y, box, isLog, isLog), bounds, isLog, isLog));
              return;
            }
            const start = dragRef.current;
            if (!start) return;
            setSelection({
              x: Math.min(start.x, x),
              y: Math.min(start.y, y),
              w: Math.abs(x - start.x),
              h: Math.abs(y - start.y),
            });
          }}
          onPointerUp={(event) => {
            if (panRef.current) {
              panRef.current = null;
              return;
            }
            const start = dragRef.current;
            dragRef.current = null;
            setSelection(null);
            const el = chartRef.current;
            if (!start || !el) return;
            const rect = el.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            if (Math.abs(x - start.x) < 12 || Math.abs(y - start.y) < 12) return;
            const box = readPlotBox(el);
            if (!box) return;
            const a = pxToData(start.x, start.y, box, view, isLog, isLog);
            const b = pxToData(x, y, box, view, isLog, isLog);
            const next = clampView(
              {
                xMin: Math.min(a.x, b.x),
                xMax: Math.max(a.x, b.x),
                yMin: Math.min(a.y, b.y),
                yMax: Math.max(a.y, b.y),
              },
              bounds,
              isLog,
              isLog,
            );
            if (next.xMax <= next.xMin || next.yMax <= next.yMin) return;
            setZoom(next);
          }}
        >
          {selection && selection.w > 0 && selection.h > 0 ? (
            <div
              className="pointer-events-none absolute z-10 border border-ink/40 bg-ink/10"
              style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
            />
          ) : null}
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 20, bottom: 36, left: 8 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                type="number"
                dataKey="plotCpa"
                name="CPA"
                scale={isLog ? "log" : "linear"}
                domain={[view.xMin, view.xMax]}
                ticks={isLog ? logTicks(view.xMin, view.xMax) : undefined}
                allowDataOverflow
                minTickGap={36}
                tickMargin={8}
                {...AXIS_PROPS}
                tickFormatter={(v: number) => formatCurrency(v, 0)}
                label={{ value: "CPA (menor es mejor)", position: "insideBottom", offset: -24, fill: "var(--ink-subtle)", fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="plotY"
                name={isLog ? "CVR" : "ROAS"}
                scale={isLog ? "log" : "linear"}
                domain={[view.yMin, view.yMax]}
                ticks={isLog ? logTicks(view.yMin, view.yMax) : undefined}
                allowDataOverflow
                width={isLog ? 52 : 52}
                tickMargin={6}
                {...AXIS_PROPS}
                tickFormatter={(v: number) => (isLog ? formatRate(v) : formatRatio(v, v < 10 ? 1 : 0))}
              />
              <ZAxis type="number" dataKey="spent" range={isLog ? (zoom ? [100, 220] : [18, 48]) : [160, 780]} />
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
                        { label: "CVR", value: formatRate(p.cvr) },
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
                    shape={CampaignMark}
                    fill={campaignColor(cid)}
                    animationDuration={320}
                    onMouseEnter={(d: unknown) => setHover((d as { payload?: Point })?.payload?.id ?? null)}
                    onMouseLeave={() => setHover(null)}
                  />
                );
              })}
              {isLog ? null : <ReferenceLine y={1} stroke="var(--ink-subtle)" strokeDasharray="3 4" strokeOpacity={0.9} />}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-ink-subtle">
          {zoom
            ? "Arrastra para moverte. La rueda acerca o aleja. Doble clic vuelve a la vista completa."
            : "Usa la rueda para acercar o arrastra un recuadro. Doble clic vuelve a la vista completa."}
        </p>
        <ul className="mt-2 flex flex-wrap gap-4 text-xs text-ink-subtle">
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
              <span className="font-mono text-xs text-ink-tertiary tabular">{i + 1}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 truncate text-[13px] text-ink">
                  <ShapeIcon id={p.campaign} />
                  <span className="truncate">{p.label}</span>
                </span>
                <span className="block text-xs text-ink-subtle">
                  CPA {formatCurrency(p.cpa)} · {formatCurrency(p.spent, 0)}
                </span>
              </span>
              <Badge tone={p.roas >= 1 ? "success" : "danger"} className="font-mono tabular">
                {formatRatio(p.roas, 1)}
              </Badge>
            </li>
          ))}
        </ol>
        {segmentsError && level === "segments" ? <p className="px-5 pb-4 text-xs text-danger-ink">{segmentsError}</p> : null}
      </Panel>
    </div>
  );
}

type ViewBox = { xMin: number; xMax: number; yMin: number; yMax: number };
type PlotBox = { left: number; top: number; width: number; height: number };

function fullBounds(points: Point[], logX: boolean, logY: boolean): ViewBox {
  if (!points.length) return { xMin: logX ? 0.1 : 0, xMax: 1, yMin: logY ? 0.01 : 0, yMax: 1 };
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const point of points) {
    xMin = Math.min(xMin, point.plotCpa);
    xMax = Math.max(xMax, point.plotCpa);
    if (point.plotY > 0 || !logY) {
      yMin = Math.min(yMin, point.plotY);
      yMax = Math.max(yMax, point.plotY);
    }
  }
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    yMin = logY ? 0.01 : 0;
    yMax = 1;
  }
  return {
    xMin: logX ? Math.max(xMin * 0.72, 1e-4) : 0,
    xMax: logX ? xMax * 1.28 : xMax * 1.08 || 1,
    yMin: logY ? Math.max(yMin * 0.72, 1e-4) : 0,
    yMax: (logY ? yMax * 1.28 : yMax * 1.12) || 1,
  };
}

function readPlotBox(root: HTMLElement): PlotBox | null {
  const grid = root.querySelector(".recharts-cartesian-grid");
  if (!grid) return null;
  const gridRect = grid.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  if (gridRect.width < 10 || gridRect.height < 10) return null;
  return {
    left: gridRect.left - rootRect.left,
    top: gridRect.top - rootRect.top,
    width: gridRect.width,
    height: gridRect.height,
  };
}

function inside(px: number, py: number, box: PlotBox): boolean {
  return px >= box.left && px <= box.left + box.width && py >= box.top && py <= box.top + box.height;
}

function pxToData(px: number, py: number, box: PlotBox, view: ViewBox, logX: boolean, logY: boolean): { x: number; y: number } {
  const tx = Math.min(1, Math.max(0, (px - box.left) / box.width));
  const ty = Math.min(1, Math.max(0, (py - box.top) / box.height));
  const x = logX
    ? Math.exp(Math.log(view.xMin) + tx * (Math.log(view.xMax) - Math.log(view.xMin)))
    : view.xMin + tx * (view.xMax - view.xMin);
  const y = logY
    ? Math.exp(Math.log(view.yMax) + ty * (Math.log(view.yMin) - Math.log(view.yMax)))
    : view.yMax - ty * (view.yMax - view.yMin);
  return { x, y };
}

function zoomBy(view: ViewBox, anchor: { x: number; y: number }, factor: number, logX: boolean, logY: boolean): ViewBox {
  const anchorX = logX ? Math.log(Math.max(anchor.x, 1e-9)) : anchor.x;
  const anchorY = logY ? Math.log(Math.max(anchor.y, 1e-9)) : anchor.y;
  const xMin = logX ? Math.exp(anchorX + (Math.log(view.xMin) - anchorX) * factor) : anchor.x + (view.xMin - anchor.x) * factor;
  const xMax = logX ? Math.exp(anchorX + (Math.log(view.xMax) - anchorX) * factor) : anchor.x + (view.xMax - anchor.x) * factor;
  const yMin = logY ? Math.exp(anchorY + (Math.log(view.yMin) - anchorY) * factor) : anchor.y + (view.yMin - anchor.y) * factor;
  const yMax = logY ? Math.exp(anchorY + (Math.log(view.yMax) - anchorY) * factor) : anchor.y + (view.yMax - anchor.y) * factor;
  return { xMin, xMax, yMin, yMax };
}

function clampView(view: ViewBox, limits: ViewBox, logX: boolean, logY: boolean): ViewBox {
  const xMin = Math.max(view.xMin, limits.xMin);
  const xMax = Math.min(view.xMax, limits.xMax);
  const yMin = Math.max(view.yMin, limits.yMin);
  const yMax = Math.min(view.yMax, limits.yMax);
  const minXSpan = logX ? 1.08 : Math.max((limits.xMax - limits.xMin) * 0.02, 0.05);
  const minYSpan = logY ? 1.08 : Math.max((limits.yMax - limits.yMin) * 0.04, 0.002);
  return {
    xMin,
    xMax: logX ? Math.max(xMax, xMin * minXSpan) : Math.max(xMax, xMin + minXSpan),
    yMin,
    yMax: logY ? Math.max(yMax, yMin * minYSpan) : Math.max(yMax, yMin + minYSpan),
  };
}

function logTicks(min: number, max: number): number[] | undefined {
  if (!(min > 0) || !(max > min)) return undefined;
  const lo = Math.log(min);
  const hi = Math.log(max);
  const ticks: number[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < 4; i += 1) {
    const raw = Math.exp(lo + ((hi - lo) * i) / 3);
    const nice = Number(raw.toPrecision(2));
    const key = nice.toPrecision(2);
    if (seen.has(key) || nice <= 0) continue;
    seen.add(key);
    ticks.push(nice);
  }
  return ticks.length >= 2 ? ticks : undefined;
}

function panView(view: ViewBox, dx: number, dy: number, box: PlotBox, logX: boolean, logY: boolean): ViewBox {
  const fx = dx / box.width;
  const fy = dy / box.height;
  const xSpan = logX ? Math.log(view.xMax) - Math.log(view.xMin) : view.xMax - view.xMin;
  const ySpan = logY ? Math.log(view.yMax) - Math.log(view.yMin) : view.yMax - view.yMin;
  const xShift = -fx * xSpan;
  const yShift = fy * ySpan;
  return {
    xMin: logX ? Math.exp(Math.log(view.xMin) + xShift) : view.xMin + xShift,
    xMax: logX ? Math.exp(Math.log(view.xMax) + xShift) : view.xMax + xShift,
    yMin: logY ? Math.exp(Math.log(view.yMin) + yShift) : view.yMin + yShift,
    yMax: logY ? Math.exp(Math.log(view.yMax) + yShift) : view.yMax + yShift,
  };
}

function clampPan(view: ViewBox, limits: ViewBox, logX: boolean, logY: boolean): ViewBox {
  let { xMin, xMax, yMin, yMax } = view;
  if (logX) {
    if (xMin < limits.xMin) {
      const ratio = limits.xMin / xMin;
      xMin *= ratio;
      xMax *= ratio;
    }
    if (xMax > limits.xMax) {
      const ratio = limits.xMax / xMax;
      xMin *= ratio;
      xMax *= ratio;
    }
  } else {
    if (xMin < limits.xMin) {
      const delta = limits.xMin - xMin;
      xMin += delta;
      xMax += delta;
    }
    if (xMax > limits.xMax) {
      const delta = xMax - limits.xMax;
      xMin -= delta;
      xMax -= delta;
    }
  }
  if (logY) {
    if (yMin < limits.yMin) {
      const ratio = limits.yMin / Math.max(yMin, 1e-9);
      yMin *= ratio;
      yMax *= ratio;
    }
    if (yMax > limits.yMax) {
      const ratio = limits.yMax / yMax;
      yMin *= ratio;
      yMax *= ratio;
    }
  } else {
    if (yMin < limits.yMin) {
      const delta = limits.yMin - yMin;
      yMin += delta;
      yMax += delta;
    }
    if (yMax > limits.yMax) {
      const delta = yMax - limits.yMax;
      yMin -= delta;
      yMax -= delta;
    }
  }
  return { xMin, xMax, yMin, yMax };
}

function nearlyFull(view: ViewBox, limits: ViewBox): boolean {
  const xSpan = limits.xMax - limits.xMin || 1;
  const ySpan = limits.yMax - limits.yMin || 1;
  return (
    Math.abs(view.xMin - limits.xMin) < xSpan * 0.04 &&
    Math.abs(view.xMax - limits.xMax) < xSpan * 0.04 &&
    Math.abs(view.yMin - limits.yMin) < ySpan * 0.04 &&
    Math.abs(view.yMax - limits.yMax) < ySpan * 0.04
  );
}

/** Same CPA and CVR land on one pixel. Nudge only the drawn position; the tooltip keeps the real values. */
function spreadOverlaps(points: Point[]): Point[] {
  const groups = new Map<string, Point[]>();
  for (const point of points) {
    const key = `${point.cpa.toFixed(2)}|${point.cvr.toFixed(4)}`;
    const group = groups.get(key);
    if (group) group.push(point);
    else groups.set(key, [point]);
  }
  const placed: Point[] = [];
  for (const group of groups.values()) {
    group.forEach((point, index) => {
      if (group.length === 1) {
        placed.push(point);
        return;
      }
      const angle = (index / group.length) * Math.PI * 2;
      placed.push({
        ...point,
        plotCpa: point.cpa * (1 + Math.cos(angle) * 0.12),
        plotY: point.cvr * (1 + Math.sin(angle) * 0.18),
      });
    });
  }
  return placed;
}

/** Compact mark: size encodes spend, but never covers the axis. */
function CampaignMark(props: { cx?: number; cy?: number; size?: number; fill?: string; payload?: Point }) {
  const { cx = 0, cy = 0, size = 64, fill = "currentColor", payload } = props;
  const shape = CAMPAIGN_SHAPE[payload?.campaign ?? ""] ?? "circle";
  const dense = (size || 160) < 80;
  const cap = dense ? 5 : shape === "diamond" ? 13 : 15;
  const r = Math.min(cap, Math.max(dense ? 3.5 : 6, Math.sqrt((size || 160) / Math.PI)));
  const common = { fill, fillOpacity: 0.42, stroke: fill, strokeWidth: 1.5, strokeLinejoin: "round" as const };
  if (shape === "square") {
    return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={2} {...common} />;
  }
  if (shape === "diamond") {
    const d = r * 1.15;
    return <polygon points={`${cx},${cy - d} ${cx + d},${cy} ${cx},${cy + d} ${cx - d},${cy}`} {...common} />;
  }
  return <circle cx={cx} cy={cy} r={r} {...common} />;
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
