import type { ReactNode } from "react";

import { PitayaMark } from "@/components/illustrations/PitayaMark";
import { cn } from "@/lib/utils";

import { RetryButton } from "./RetryButton";

/** Error dentro del widget, con reintento; el resto de la página sigue viva. */
export function ErrorState({
  title = "No pudimos cargar este panel",
  message,
  className,
  compact = false,
  retry = true,
}: {
  title?: string;
  message: string;
  className?: string;
  compact?: boolean;
  retry?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-4 rounded-lg border border-hairline bg-surface-1 p-5",
        compact ? "flex-row" : "flex-col py-10 text-center sm:flex-row sm:text-left",
        className,
      )}
    >
      <PitayaMark mood="oops" size={compact ? 40 : 72} decorative />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        <p className="mt-1 text-[13px] text-ink-muted text-pretty">{message}</p>
      </div>
      {retry ? <RetryButton /> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
  mood = "thinking",
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
  mood?: "thinking" | "sleepy" | "happy";
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)}>
      <PitayaMark mood={mood} size={72} decorative />
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {children ? <div className="max-w-md text-[13px] text-ink-muted text-pretty">{children}</div> : null}
      {action}
    </div>
  );
}
