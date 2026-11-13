"use client";

import { useState } from "react";

import { SimpleTable } from "@/components/charts/ChartFrame";
import { Segmented } from "@/components/ui/controls";
import type { AttributionSynthetic } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { ATTRIBUTION_MODELS } from "@/lib/labels";
import { CAMPAIGN_IDS, campaignColor, campaignFromChannelKey } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function SyntheticAttribution({ results }: { results: AttributionSynthetic[] }) {
  const [model, setModel] = useState(results[0].model);
  const [asTable, setAsTable] = useState(false);
  const byModel = Object.fromEntries(results.map((r) => [r.model, r]));
  const meta = ATTRIBUTION_MODELS.find((m) => m.id === model);
  const credits = (r: AttributionSynthetic) =>
    Object.fromEntries(Object.entries(r.attribution_credits).map(([k, v]) => [campaignFromChannelKey(k), v]));
  const current = byModel[model] ? credits(byModel[model]) : {};
  const ids = CAMPAIGN_IDS.map(String);

  return (
    <div className="px-5 pt-4 pb-5">
      <Segmented
        label="Modelo de atribución"
        size="sm"
        value={model}
        onChange={setModel}
        className="w-full"
        options={ATTRIBUTION_MODELS.filter((m) => byModel[m.id]).map((m) => ({ value: m.id, label: m.label }))}
      />
      <p className="mt-3 min-h-10 text-[13px] text-ink-muted" aria-live="polite">
        <span className="font-medium text-ink">{meta?.label}:</span> {meta?.help}
      </p>

      <ul className="mt-4 grid grid-cols-3 gap-3">
        {ids.map((id) => (
          <li key={id} className="rounded-md border border-hairline bg-canvas p-3">
            <p className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-subtle">
              <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(id) }} />
              {id}
            </p>
            <p className="mt-1 font-mono text-[22px] font-medium text-ink tabular">{formatPercent(current[id], 1)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="label-mono text-ink-tertiary">Reparto por modelo</h3>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="text-[12px] text-ink-subtle hover:text-ink"
          aria-pressed={asTable}
        >
          {asTable ? "Ver gráfico" : "Ver como tabla"}
        </button>
      </div>
      {asTable ? (
        <div className="mt-3">
          <SimpleTable
            table={{
              columns: [{ key: "m", label: "Modelo" }, ...ids.map((id) => ({ key: id, label: id, align: "right" as const }))],
              rows: results.map((r) => {
                const c = credits(r);
                return {
                  m: ATTRIBUTION_MODELS.find((m) => m.id === r.model)?.label ?? r.model,
                  ...Object.fromEntries(ids.map((id) => [id, formatPercent(c[id], 1)])),
                };
              }),
            }}
          />
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {results.map((r) => {
            const c = credits(r);
            const active = r.model === model;
            return (
              <li key={r.model}>
                <button
                  type="button"
                  onClick={() => setModel(r.model)}
                  aria-pressed={active}
                  className={cn(
                    "grid w-full grid-cols-[96px_1fr] items-center gap-3 rounded-md px-2 py-1.5 text-left",
                    active ? "bg-primary-subtle" : "hover:bg-surface-2",
                  )}
                >
                  <span className={cn("truncate text-[13px]", active ? "text-ink" : "text-ink-muted")}>
                    {ATTRIBUTION_MODELS.find((m) => m.id === r.model)?.label ?? r.model}
                  </span>
                  <span className="flex h-5 w-full min-w-0 overflow-hidden rounded-sm bg-surface-2">
                    {ids.map((id, i) => (
                      <span
                        key={id}
                        className={cn("bar-grow h-full", i > 0 && "border-l-2 border-surface-1")}
                        style={{ width: `${(c[id] ?? 0) * 100}%`, background: campaignColor(id), opacity: active ? 1 : 0.55 }}
                        title={`${id}: ${formatPercent(c[id], 1)}`}
                      />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ul className="mt-3 flex gap-4 text-[12px] text-ink-subtle">
        {ids.map((id) => (
          <li key={id} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-[2px]" style={{ background: campaignColor(id) }} />
            Campaña <span className="font-mono">{id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
