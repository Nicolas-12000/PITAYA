"use client";

import { BarChart3, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Panel, PanelHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export type TableView = {
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, ReactNode>[];
};

/**
 * Marco de gráfico: el título enuncia la conclusión; botón «Ver como tabla»
 * como alternativa accesible (§13).
 */
export function ChartFrame({
  title,
  subtitle,
  eyebrow,
  legend,
  actions,
  table,
  children,
  minHeight = 240,
  className,
  simulated = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  legend?: ReactNode;
  actions?: ReactNode;
  table?: TableView;
  children: ReactNode;
  minHeight?: number;
  className?: string;
  simulated?: boolean;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Panel className={cn("rounded-xl", simulated && "border-dashed border-series-4", className)}>
      <PanelHeader
        title={title}
        subtitle={subtitle}
        eyebrow={eyebrow}
        actions={
          <>
            {actions}
            {table ? (
              <button
                type="button"
                onClick={() => setAsTable((v) => !v)}
                aria-pressed={asTable}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] text-ink-subtle hover:bg-surface-2 hover:text-ink max-md:h-10"
              >
                {asTable ? <BarChart3 className="size-4" strokeWidth={1.5} /> : <Table2 className="size-4" strokeWidth={1.5} />}
                {asTable ? "Ver gráfico" : "Ver como tabla"}
              </button>
            ) : null}
          </>
        }
      />
      {legend ? <div className="px-5 pt-3">{legend}</div> : null}
      <div className="px-5 pt-4 pb-5" style={{ minHeight }}>
        {asTable && table ? <SimpleTable table={table} /> : children}
      </div>
    </Panel>
  );
}

export function SimpleTable({ table }: { table: TableView }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-hairline text-ink-subtle">
            {table.columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-2 py-2 font-medium", c.align === "right" ? "text-right" : "text-left")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-hairline last:border-0">
              {table.columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("px-2 py-2", c.align === "right" ? "text-right font-mono text-ink tabular" : "text-ink-muted")}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
