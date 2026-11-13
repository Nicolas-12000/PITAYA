import { Info } from "lucide-react";
import type { ReactNode } from "react";

import { Tooltip } from "@/components/ui/controls";
import { cn } from "@/lib/utils";

export function MetricInfo({ children, label = "Definición" }: { children: ReactNode; label?: string }) {
  return (
    <Tooltip content={children}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex size-5 items-center justify-center rounded-full text-ink-tertiary hover:text-ink-muted"
      >
        <Info className="size-3.5" strokeWidth={1.5} />
      </button>
    </Tooltip>
  );
}

export function KpiCard({
  label,
  value,
  note,
  info,
  footer,
  tone,
  hero = false,
  className,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  info?: ReactNode;
  footer?: ReactNode;
  tone?: "positive" | "negative";
  hero?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col rounded-lg border bg-surface-1 p-5",
        hero ? "border-hairline-strong" : "border-hairline",
        className,
      )}
    >
      {hero ? <span aria-hidden className="absolute inset-x-5 top-0 h-px bg-primary" /> : null}
      <div className="flex items-center gap-1">
        <h3 className="text-[13px] text-ink-subtle">{label}</h3>
        {info ? <MetricInfo label={`Definición de ${label}`}>{info}</MetricInfo> : null}
      </div>
      <p
        className={cn(
          "mt-3",
          hero ? "type-kpi-hero" : "type-kpi",
          tone === "positive" && "text-success-ink",
          tone === "negative" && "text-danger-ink",
          !tone && "text-ink",
        )}
      >
        {value}
      </p>
      {note ? <p className="mt-2 text-[12px] text-ink-subtle">{note}</p> : null}
      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </article>
  );
}

/** Mini barras por campaña dentro de una KpiCard. */
export function MiniBars({
  items,
}: {
  items: { label: string; value: number; display: string; color: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;
  return (
    <ul className="space-y-1.5" aria-label="Desglose por campaña">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[44px_1fr_auto] items-center gap-2 text-[12px]">
          <span className="font-mono text-ink-subtle tabular">{item.label}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span
              className="bar-grow block h-full rounded-full"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            />
          </span>
          <span className="font-mono text-ink-muted tabular">{item.display}</span>
        </li>
      ))}
    </ul>
  );
}
