"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, Rows3, Rows4, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { ToggleChip } from "@/components/ui/controls";
import { Badge, Stat } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/sheet";
import type { GlobalKpis, Segment } from "@/lib/api/types";
import {
  formatCurrency,
  formatInteger,
  formatNumber,
  formatRate,
  formatRatio,
  formatSignedPercent,
} from "@/lib/format";
import { genderLabel } from "@/lib/labels";
import { CAMPAIGN_IDS, campaignColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

type ColKey = "impressions" | "clicks" | "spent" | "approved_conversions" | "ctr" | "cvr" | "cpa" | "roas";

const COLUMNS: { key: ColKey; label: string; fmt: (v: number) => string; info: string }[] = [
  { key: "impressions", label: "Impresiones", fmt: (v) => formatInteger(v), info: "Veces que se mostró el anuncio" },
  { key: "clicks", label: "Clics", fmt: (v) => formatInteger(v), info: "Clics en el anuncio" },
  { key: "spent", label: "Gasto", fmt: (v) => formatCurrency(v), info: "Spent total" },
  { key: "approved_conversions", label: "Aprobadas", fmt: (v) => formatInteger(v), info: "Conversiones aprobadas" },
  { key: "ctr", label: "CTR", fmt: formatRate, info: "Clics / impresiones" },
  { key: "cvr", label: "CVR", fmt: formatRate, info: "Aprobadas / clics" },
  { key: "cpa", label: "CPA", fmt: (v) => formatCurrency(v), info: "Gasto / aprobadas" },
  { key: "roas", label: "ROAS", fmt: (v) => formatRatio(v), info: "Ingreso estimado / gasto" },
];

type FilterKey = "campaign" | "age" | "gender" | "interest";

const segmentId = (s: Segment) => `${s.xyz_campaign_id}|${s.age}|${s.gender}|${s.interest}`;

function fieldOf(s: Segment, key: FilterKey): string {
  if (key === "campaign") return String(s.xyz_campaign_id);
  return String(s[key]);
}

export function SegmentExplorer({ segments, global }: { segments: Segment[]; global: GlobalKpis | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" }>({ key: "spent", dir: "desc" });
  const [hidden, setHidden] = useState<Set<ColKey>>(new Set(["impressions"]));
  const [compact, setCompact] = useState(false);
  const [showCols, setShowCols] = useState(false);
  const [selected, setSelected] = useState<Segment | null>(null);

  const options = useMemo(() => {
    const uniq = (k: FilterKey) =>
      [...new Set(segments.map((s) => fieldOf(s, k)))].sort((a, b) =>
        k === "interest" ? Number(a) - Number(b) : a.localeCompare(b),
      );
    return { campaign: CAMPAIGN_IDS.map(String), age: uniq("age"), gender: uniq("gender"), interest: uniq("interest") };
  }, [segments]);

  const filters: Record<FilterKey, string[]> = {
    campaign: params.getAll("campaign"),
    age: params.getAll("age"),
    gender: params.getAll("gender"),
    interest: params.getAll("interest"),
  };
  const activeCount = Object.values(filters).reduce((a, v) => a + v.length, 0);

  const toggle = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(key);
    next.delete(key);
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    updated.forEach((v) => next.append(key, v));
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });

  const dir = sort.dir === "asc" ? 1 : -1;
  const rows = segments
    .filter((s) =>
      (Object.keys(filters) as FilterKey[]).every((k) => filters[k].length === 0 || filters[k].includes(fieldOf(s, k))),
    )
    .sort((a, b) => (a.kpis[sort.key] - b.kpis[sort.key]) * dir);

  const visible = COLUMNS.filter((c) => !hidden.has(c.key));

  const exportCsv = () => {
    const header = ["campaign", "age", "gender", "interest", "ads", ...COLUMNS.map((c) => c.key)];
    const lines = rows.map((s) =>
      [s.xyz_campaign_id, s.age, s.gender, s.interest, s.row_count, ...COLUMNS.map((c) => s.kpis[c.key])].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pitaya-segmentos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterGroups: { key: FilterKey; label: string; render: (v: string) => React.ReactNode; color?: (v: string) => string }[] = [
    { key: "campaign", label: "Campaña", render: (v) => <span className="font-mono">{v}</span>, color: campaignColor },
    { key: "age", label: "Edad", render: (v) => v },
    { key: "gender", label: "Género", render: genderLabel },
    { key: "interest", label: "Interés", render: (v) => <span className="font-mono">{v}</span> },
  ];

  return (
    <div>
      {/* FilterBar */}
      <div className="mb-4 space-y-3 rounded-lg border border-hairline bg-surface-1 p-4">
        {filterGroups.map((g) => (
          <div key={g.key} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <span className="w-20 shrink-0 pt-1.5 text-[12px] text-ink-subtle">{g.label}</span>
            <div
              className={cn(
                "flex gap-1.5",
                g.key === "interest" ? "flex-nowrap overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible" : "flex-wrap",
              )}
            >
              {options[g.key].map((v) => (
                <ToggleChip
                  key={v}
                  pressed={filters[g.key].includes(v)}
                  onPressedChange={() => toggle(g.key, v)}
                  color={g.color?.(v)}
                >
                  {g.render(v)}
                </ToggleChip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-[13px] text-ink-subtle" aria-live="polite">
          <span className="font-mono text-ink tabular">{formatInteger(rows.length)}</span> de{" "}
          <span className="font-mono tabular">{formatInteger(segments.length)}</span> segmentos
          {activeCount ? (
            <button type="button" onClick={clear} className="ml-3 inline-flex items-center gap-1 text-primary-text hover:underline">
              <X className="size-3.5" strokeWidth={1.5} /> Limpiar {activeCount} filtro{activeCount > 1 ? "s" : ""}
            </button>
          ) : null}
        </p>
        <div className="relative">
          <Button size="sm" variant="ghost" onClick={() => setShowCols((v) => !v)} aria-expanded={showCols}>
            <Columns3 strokeWidth={1.5} /> Columnas
          </Button>
          {showCols ? (
            <div className="fade-in absolute right-0 z-20 mt-1 w-48 rounded-md border border-hairline-strong bg-surface-3 p-1.5 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
              {COLUMNS.map((c) => (
                <label key={c.key} className="flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] text-ink-muted hover:bg-surface-2">
                  <input
                    type="checkbox"
                    checked={!hidden.has(c.key)}
                    onChange={() =>
                      setHidden((prev) => {
                        const next = new Set(prev);
                        if (next.has(c.key)) next.delete(c.key);
                        else next.add(c.key);
                        return next;
                      })
                    }
                    className="accent-[var(--primary)]"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          ) : null}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setCompact((v) => !v)} aria-pressed={compact}>
          {compact ? <Rows3 strokeWidth={1.5} /> : <Rows4 strokeWidth={1.5} />}
          {compact ? "Cómoda" : "Compacta"}
        </Button>
        <Button size="sm" variant="secondary" onClick={exportCsv} disabled={!rows.length}>
          <Download strokeWidth={1.5} /> CSV
        </Button>
      </div>

      {/* DataTable */}
      {rows.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface-1">
          <EmptyState title="Ningún segmento cumple estos filtros">
            Quita la edad o el interés para ampliar la búsqueda.
          </EmptyState>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-lg border border-hairline bg-surface-1">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-[13px]">
            <thead className="sticky top-0 z-10 bg-surface-1">
              <tr>
                <th scope="col" className="sticky left-0 z-10 border-b border-hairline bg-surface-1 px-4 py-2.5 text-left font-medium text-ink-subtle">
                  Segmento
                </th>
                {visible.map((c) => {
                  const active = sort.key === c.key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                      className="border-b border-hairline px-3 py-2.5 text-right font-medium text-ink-subtle"
                    >
                      <button
                        type="button"
                        title={c.info}
                        onClick={() =>
                          setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === "desc" ? "asc" : "desc" }))
                        }
                        className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}
                      >
                        {c.label}
                        {active ? (
                          sort.dir === "asc" ? <ArrowUp className="size-3.5" strokeWidth={1.5} /> : <ArrowDown className="size-3.5" strokeWidth={1.5} />
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" strokeWidth={1.5} />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={segmentId(s)}
                  onClick={() => setSelected(s)}
                  className={cn("group cursor-pointer", compact ? "h-8" : "h-10")}
                >
                  <th
                    scope="row"
                    className="sticky left-0 border-b border-hairline bg-surface-1 px-4 text-left font-normal group-hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(s);
                      }}
                      className="inline-flex items-center gap-2 whitespace-nowrap text-ink"
                    >
                      <span aria-hidden className="size-2 rounded-full" style={{ background: campaignColor(s.xyz_campaign_id) }} />
                      <span className="font-mono">{s.xyz_campaign_id}</span>
                      <span className="text-ink-muted">{s.age}</span>
                      <span className="text-ink-muted">{genderLabel(s.gender)}</span>
                      <span className="font-mono text-ink-subtle">#{s.interest}</span>
                    </button>
                  </th>
                  {visible.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "border-b border-hairline px-3 text-right font-mono whitespace-nowrap tabular group-hover:bg-surface-2",
                        c.key === "roas"
                          ? s.kpis.roas >= 1
                            ? "text-success-ink"
                            : "text-danger-ink"
                          : "text-ink",
                      )}
                    >
                      {c.key === "cpa" && s.kpis.approved_conversions === 0 ? (
                        <span title="Sin conversiones aprobadas: el CPA no está definido" className="text-ink-tertiary">
                          —
                        </span>
                      ) : (
                        c.fmt(s.kpis[c.key])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SegmentDetail segment={selected} global={global} onClose={() => setSelected(null)} />
    </div>
  );
}

function SegmentDetail({
  segment,
  global,
  onClose,
}: {
  segment: Segment | null;
  global: GlobalKpis | null;
  onClose: () => void;
}) {
  const s = segment;
  const compare: { key: "ctr" | "cvr" | "roas"; label: string; fmt: (v: number) => string; higherIsBetter: boolean }[] = [
    { key: "ctr", label: "CTR", fmt: formatRate, higherIsBetter: true },
    { key: "cvr", label: "CVR", fmt: formatRate, higherIsBetter: true },
    { key: "roas", label: "ROAS", fmt: (v) => formatRatio(v), higherIsBetter: true },
  ];
  return (
    <Sheet
      open={!!s}
      onOpenChange={(o) => !o && onClose()}
      title={
        s ? (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: campaignColor(s.xyz_campaign_id) }} />
            Campaña <span className="font-mono">{s.xyz_campaign_id}</span>
          </span>
        ) : (
          "Segmento"
        )
      }
      description={s ? `${s.age} · ${genderLabel(s.gender)} · interés ${s.interest} · ${formatInteger(s.row_count)} anuncios` : undefined}
    >
      {s ? (
        <div className="space-y-6 p-5">
          <dl className="grid grid-cols-2 gap-4">
            <Stat label="Gasto" value={formatCurrency(s.kpis.spent)} />
            <Stat label="Conversiones aprobadas" value={formatInteger(s.kpis.approved_conversions)} />
            <Stat label="Impresiones" value={formatNumber(s.kpis.impressions)} />
            <Stat label="Clics" value={formatInteger(s.kpis.clicks)} />
            <Stat label="CPC" value={formatCurrency(s.kpis.cpc)} />
            <Stat
              label="CPA"
              value={s.kpis.approved_conversions ? formatCurrency(s.kpis.cpa) : "—"}
              hint={s.kpis.approved_conversions ? undefined : "Sin conversiones aprobadas"}
            />
          </dl>
          <div>
            <h3 className="label-mono mb-3 text-ink-tertiary">Frente al promedio global</h3>
            {global ? (
              <ul className="space-y-4">
                {compare.map((c) => {
                  const segVal = s.kpis[c.key];
                  const globVal = global[c.key];
                  const rel = globVal ? segVal / globVal - 1 : null;
                  const better = rel !== null && (c.higherIsBetter ? rel >= 0 : rel <= 0);
                  const max = Math.max(segVal, globVal) || 1;
                  return (
                    <li key={c.key}>
                      <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                        <span className="text-ink-muted">{c.label}</span>
                        <Badge tone={rel === null ? "neutral" : better ? "success" : "danger"} className="font-mono tabular">
                          {formatSignedPercent(rel, 0)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="w-16 shrink-0 text-ink-subtle">Segmento</span>
                          <span className="h-2 flex-1 rounded-full bg-surface-2">
                            <span className="bar-grow block h-full rounded-full bg-primary" style={{ width: `${(segVal / max) * 100}%` }} />
                          </span>
                          <span className="w-20 text-right font-mono text-ink tabular">{c.fmt(segVal)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="w-16 shrink-0 text-ink-subtle">Global</span>
                          <span className="h-2 flex-1 rounded-full bg-surface-2">
                            <span className="bar-grow block h-full rounded-full bg-ink-tertiary" style={{ width: `${(globVal / max) * 100}%` }} />
                          </span>
                          <span className="w-20 text-right font-mono text-ink-muted tabular">{c.fmt(globVal)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[13px] text-ink-subtle">No pudimos cargar los KPIs globales para comparar.</p>
            )}
          </div>
          <p className="border-t border-hairline pt-4 text-[12px] text-ink-tertiary">
            Segmentos con pocos anuncios ({formatInteger(s.row_count)}) tienen métricas muy variables; úsalas como señal, no como
            conclusión.
          </p>
        </div>
      ) : null}
    </Sheet>
  );
}
