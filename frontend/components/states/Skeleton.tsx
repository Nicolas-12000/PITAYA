import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} style={style} />;
}

/** Contenedor accesible para cualquier skeleton. */
export function Busy({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-busy="true" className={className}>
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}

export function KpiSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-hairline bg-surface-1 p-5", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-9 w-32" />
      <Skeleton className="mt-4 h-3 w-40" />
    </div>
  );
}

export function ChartSkeleton({ height = 280, className }: { height?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-hairline bg-surface-1 p-5", className)}>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-2 h-3 w-72 max-w-full" />
      <div className="mt-6 flex items-end gap-3" style={{ height }}>
        {[60, 85, 40, 70, 55, 90, 35].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8, cols = 6, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-hairline bg-surface-1", className)}>
      <div className="flex gap-4 border-b border-hairline px-4 py-3">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex h-10 items-center gap-4 border-b border-hairline px-4 last:border-0">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={cn("h-3 flex-1", c === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ["w-full", "w-11/12", "w-3/4", "w-2/3"];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-3", widths[i % widths.length])} />
      ))}
    </div>
  );
}
