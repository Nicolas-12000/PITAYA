import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BarItem = {
  key: string;
  label: ReactNode;
  value: number;
  display: string;
  color?: string;
  /** Intervalo opcional en las mismas unidades que value. */
  low?: number;
  high?: number;
  sub?: ReactNode;
};

/**
 * Barras horizontales desde cero con bigotes de intervalo opcionales.
 * Server-renderizable (sin JS); el valor siempre se etiqueta directo.
 */
export function BarList({
  items,
  max: maxProp,
  className,
  labelWidth = "w-28",
}: {
  items: BarItem[];
  max?: number;
  className?: string;
  labelWidth?: string;
}) {
  const max = maxProp ?? (Math.max(...items.map((i) => Math.max(i.value, i.high ?? 0)), 0) || 1);
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
        return (
          <li key={item.key} className="flex items-center gap-3">
            <div className={cn("shrink-0 text-[13px] text-ink-muted", labelWidth)}>
              <div className="truncate">{item.label}</div>
              {item.sub ? <div className="truncate text-[11px] text-ink-tertiary">{item.sub}</div> : null}
            </div>
            <div className="relative h-6 min-w-0 flex-1">
              <div className="absolute inset-y-0 left-0 w-full rounded-sm bg-surface-2" />
              <div
                className="bar-grow absolute inset-y-0 left-0 rounded-sm"
                style={{ width: pct(item.value), background: item.color ?? "var(--primary)" }}
              />
              {item.low !== undefined && item.high !== undefined ? (
                <div
                  aria-hidden
                  className="absolute top-1/2 h-3 -translate-y-1/2 border-x border-ink"
                  style={{ left: pct(item.low), width: `calc(${pct(item.high)} - ${pct(item.low)})` }}
                >
                  <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-ink" />
                </div>
              ) : null}
            </div>
            <div className="w-24 shrink-0 text-right font-mono text-[13px] text-ink tabular">{item.display}</div>
          </li>
        );
      })}
    </ul>
  );
}

/** Barras divergentes alrededor de cero (Shapley). */
export function DivergingBars({
  items,
}: {
  items: { key: string; label: ReactNode; value: number; display: string }[];
}) {
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 0) || 1;
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const w = `${(Math.abs(item.value) / max) * 50}%`;
        const positive = item.value >= 0;
        return (
          <li key={item.key} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-[13px] text-ink-muted">{item.label}</div>
            <div className="relative h-6 min-w-0 flex-1 rounded-sm bg-surface-2">
              <div className="absolute inset-y-0 left-1/2 w-px bg-hairline-tertiary" />
              <div
                className={cn("absolute inset-y-1 rounded-sm", positive ? "bg-series-3" : "bg-series-6")}
                style={positive ? { left: "50%", width: w } : { right: "50%", width: w }}
              />
            </div>
            <div className="w-28 shrink-0 text-right font-mono text-[13px] text-ink tabular">{item.display}</div>
          </li>
        );
      })}
    </ul>
  );
}

/** Barra apilada de reparto (en lugar de pasteles o donas). */
export function StackedBar({
  segments,
  label,
}: {
  segments: { key: string; value: number; color: string; label: string; display: string }[];
  label: string;
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-[12px] text-ink-subtle">
        <span>{label}</span>
      </div>
      <div className="flex h-7 w-full overflow-hidden rounded-sm bg-surface-2" role="img" aria-label={label}>
        {segments.map((s, i) => (
          <div
            key={s.key}
            className={cn("bar-grow h-full", i > 0 && "border-l-2 border-surface-1")}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.display}`}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        {segments.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5 text-ink-muted">
            <span aria-hidden className="size-2 rounded-[2px]" style={{ background: s.color }} />
            {s.label}
            <span className="font-mono text-ink tabular">{s.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
