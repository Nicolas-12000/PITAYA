"use client";

import { BarChart3, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/ui/primitives";
import { formatInteger } from "@/lib/format";
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
              <Button type="button" size="sm" variant="secondary" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
                {asTable ? <BarChart3 strokeWidth={1.5} /> : <Table2 strokeWidth={1.5} />}
                {asTable ? "Ver gráfico" : "Ver como tabla"}
              </Button>
            ) : null}
          </>
        }
      />
      {legend ? <div className="px-5 pt-3">{legend}</div> : null}
      <div className="px-5 pt-4 pb-5" style={asTable ? undefined : { minHeight }}>
        {asTable && table ? <SimpleTable table={table} /> : children}
      </div>
    </Panel>
  );
}

const PAGE_SIZE = 12;

export function SimpleTable({ table }: { table: TableView }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(table.rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const start = current * PAGE_SIZE;
  const rows = table.rows.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-ink-subtle">
              {table.columns.map((c) => (
                <th key={c.key} scope="col" className={cn("px-3 py-2.5 font-medium", c.align === "right" ? "text-right" : "text-left")}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={start + i} className="h-10 border-b border-hairline last:border-0">
                {table.columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-3", c.align === "right" ? "text-right font-mono text-ink tabular" : "text-ink")}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.rows.length > PAGE_SIZE ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-[13px]">
          <p className="text-ink-subtle">
            <span className="font-mono text-ink tabular">{formatInteger(start + 1)}</span>
            –
            <span className="font-mono text-ink tabular">{formatInteger(Math.min(table.rows.length, start + PAGE_SIZE))}</span>
            {" de "}
            <span className="font-mono tabular">{formatInteger(table.rows.length)}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Anterior
            </Button>
            <span className="font-mono text-ink-subtle tabular">
              {current + 1} / {pages}
            </span>
            <Button size="sm" variant="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
