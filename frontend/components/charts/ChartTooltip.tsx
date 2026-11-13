"use client";

import type { ReactNode } from "react";

/** Tooltip de Recharts sobre surface-3 con borde hairline-strong (§13). */
export function ChartTooltipBox({ title, rows }: { title?: ReactNode; rows: { label: ReactNode; value: ReactNode; color?: string }[] }) {
  return (
    <div className="min-w-40 rounded-md border border-hairline-strong bg-surface-3 px-3 py-2 text-[12px] shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
      {title ? <p className="mb-1 font-medium text-ink">{title}</p> : null}
      <ul className="space-y-0.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-ink-subtle">
              {r.color ? <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} /> : null}
              {r.label}
            </span>
            <span className="font-mono text-ink tabular">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const AXIS_PROPS = {
  stroke: "var(--hairline-strong)",
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--ink-subtle)", fontSize: 12 },
} as const;

export const GRID_PROPS = {
  stroke: "var(--hairline)",
  strokeOpacity: 0.8,
  vertical: false,
} as const;
