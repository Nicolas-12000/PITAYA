"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame } from "@/components/charts/ChartFrame";
import { AXIS_PROPS, ChartTooltipBox, GRID_PROPS } from "@/components/charts/ChartTooltip";
import { Panel } from "@/components/ui/primitives";
import type { RoiResponse } from "@/lib/api/types";
import { formatCurrency, formatInteger, formatRatio, formatSignedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RoiSensitivity({ data }: { data: RoiResponse }) {
  const scenarios = [...data.scenarios].sort((a, b) => a.multiplier - b.multiplier);
  const baseIdx = Math.max(0, scenarios.findIndex((s) => s.multiplier === 1));
  const [idx, setIdx] = useState(baseIdx);
  const current = scenarios[idx];
  const breakEven = data.break_even_value_per_conversion;
  const positive = current.roi >= 0;

  const chartData = scenarios.map((s) => ({ value: s.value_per_approved_conversion, roi: s.roi, roas: s.roas }));
  const xs = chartData.map((d) => d.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Panel className="flex flex-col p-5">
        <label htmlFor="roi-scenario" className="text-[13px] text-ink-subtle">
          Valor por conversión aprobada
        </label>
        <p className="mt-2 type-kpi text-ink">{formatCurrency(current.value_per_approved_conversion)}</p>
        <input
          id="roi-scenario"
          type="range"
          min={0}
          max={scenarios.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          aria-valuetext={formatCurrency(current.value_per_approved_conversion)}
          className="mt-5 h-2 w-full cursor-pointer"
        />
        <div role="group" aria-label="Multiplicador sobre el valor base" className="mt-1 flex justify-between">
          {scenarios.map((s, i) => (
            <button
              key={s.multiplier}
              type="button"
              onClick={() => setIdx(i)}
              aria-pressed={i === idx}
              className={cn(
                "rounded-sm px-1 py-1 font-mono text-[11px] tabular transition-colors duration-[120ms] max-md:py-2",
                i === idx ? "text-primary-text" : "text-ink-tertiary hover:text-ink",
              )}
            >
              {formatInteger(s.multiplier * 100)}%
            </button>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-hairline pt-5" aria-live="polite">
          <div>
            <dt className="text-[12px] text-ink-subtle">ROI</dt>
            <dd className={cn("mt-1 font-mono text-[22px] font-medium tabular", positive ? "text-success-ink" : "text-danger-ink")}>
              {formatSignedPercent(current.roi)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-subtle">ROAS</dt>
            <dd className="mt-1 font-mono text-[22px] font-medium text-ink tabular">{formatRatio(current.roas)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-subtle">Ingreso estimado</dt>
            <dd className="mt-1 font-mono text-[15px] text-ink tabular">{formatCurrency(current.estimated_revenue, 0)}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-ink-subtle">Gasto</dt>
            <dd className="mt-1 font-mono text-[15px] text-ink tabular">{formatCurrency(data.spent, 0)}</dd>
          </div>
        </dl>
        <p className="mt-auto pt-5 text-[12px] text-ink-tertiary">
          Valores calculados por el backend para {scenarios.length} multiplicadores del valor base (
          {formatCurrency(data.base_value_per_conversion)}). El valor base se configura con VALUE_PER_APPROVED_CONVERSION.
        </p>
      </Panel>

      <ChartFrame
        eyebrow={<p className="label-mono text-ink-tertiary">Sensibilidad</p>}
        title={
          breakEven !== null
            ? `Con menos de ${formatCurrency(breakEven)} por conversión, el portafolio pierde dinero`
            : "No hay conversiones aprobadas: el punto de equilibrio no está definido"
        }
        subtitle={`${formatInteger(data.approved_conversions)} conversiones aprobadas sobre ${formatCurrency(data.spent, 0)} de gasto. La zona sombreada marca ROI negativo.`}
        table={{
          columns: [
            { key: "value", label: "Valor por conversión", align: "right" },
            { key: "revenue", label: "Ingreso estimado", align: "right" },
            { key: "roi", label: "ROI", align: "right" },
            { key: "roas", label: "ROAS", align: "right" },
          ],
          rows: scenarios.map((s) => ({
            value: formatCurrency(s.value_per_approved_conversion),
            revenue: formatCurrency(s.estimated_revenue, 0),
            roi: formatSignedPercent(s.roi),
            roas: formatRatio(s.roas),
          })),
        }}
        minHeight={320}
      >
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 4 }}>
              <CartesianGrid {...GRID_PROPS} />
              {breakEven !== null ? (
                <ReferenceArea x1={minX} x2={breakEven} fill="var(--s6)" fillOpacity={0.06} ifOverflow="hidden" />
              ) : null}
              <XAxis
                dataKey="value"
                type="number"
                domain={[minX, maxX]}
                {...AXIS_PROPS}
                tickFormatter={(v: number) => formatCurrency(v, 0)}
              />
              <YAxis {...AXIS_PROPS} width={56} tickFormatter={(v: number) => formatSignedPercent(v, 0)} />
              <ReferenceLine y={0} stroke="var(--hairline-tertiary)" />
              {breakEven !== null ? (
                <ReferenceLine
                  x={breakEven}
                  stroke="var(--ink-subtle)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Equilibrio ${formatCurrency(breakEven)}`,
                    position: "insideTopLeft",
                    fill: "var(--ink-muted)",
                    fontSize: 12,
                  }}
                />
              ) : null}
              <Tooltip
                cursor={{ stroke: "var(--hairline-strong)" }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <ChartTooltipBox
                      title={formatCurrency(payload[0].payload.value)}
                      rows={[
                        { label: "ROI", value: formatSignedPercent(payload[0].payload.roi), color: "var(--primary)" },
                        { label: "ROAS", value: formatRatio(payload[0].payload.roas) },
                      ]}
                    />
                  ) : null
                }
              />
              <Line
                type="linear"
                dataKey="roi"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--surface-1)", stroke: "var(--primary)", strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
                animationDuration={320}
                isAnimationActive
              />
              <ReferenceDot
                x={current.value_per_approved_conversion}
                y={current.roi}
                r={7}
                fill="var(--primary)"
                stroke="var(--surface-1)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartFrame>
    </div>
  );
}
