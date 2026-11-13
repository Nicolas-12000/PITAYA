import { FlaskConical, Info, Scale, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Ámbar, borde punteado y texto «Datos simulados» (§13). */
export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-series-4 px-2 py-0.5 text-[12px] leading-5 font-medium text-warning-ink",
        className,
      )}
      title="Datos simulados: no corresponden a usuarios reales."
    >
      <FlaskConical className="size-3.5" strokeWidth={1.5} aria-hidden />
      Datos simulados
    </span>
  );
}

/** Aviso de comparación no aleatorizada. */
export function ObservationalNote({ className }: { className?: string }) {
  return (
    <p className={cn("inline-flex items-start gap-2 text-[13px] text-ink-muted", className)}>
      <Scale className="mt-0.5 size-4 shrink-0 text-info-ink" strokeWidth={1.5} aria-hidden />
      <span>
        <span className="font-medium text-ink">Comparación observacional:</span> las campañas no se asignaron al
        azar. Las diferencias pueden deberse a audiencia, presupuesto o fecha, no solo a la campaña.
      </span>
    </p>
  );
}

type NoticeTone = "info" | "warning";

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-surface-1 px-4 py-3 text-[13px] text-ink-muted",
        tone === "warning" ? "border-dashed border-series-4" : "border-hairline",
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", tone === "warning" ? "text-warning-ink" : "text-info-ink")}
        strokeWidth={1.5}
        aria-hidden
      />
      <div className="min-w-0 text-pretty">
        {title ? <span className="font-medium text-ink">{title} </span> : null}
        {children}
      </div>
    </div>
  );
}
