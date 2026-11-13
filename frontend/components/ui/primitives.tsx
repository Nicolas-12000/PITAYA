import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Panel: superficie con borde de 1 px, sin sombra (§6). */
export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("rounded-lg border border-hairline bg-surface-1", className)} {...props} />;
}

export function PanelHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? <div className="mb-1.5">{eyebrow}</div> : null}
        <h2 className="text-[17px] leading-snug font-medium tracking-[-0.3px] text-ink text-balance">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] text-ink-subtle text-pretty">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-muted border-hairline",
  primary: "bg-primary-subtle text-primary-text border-transparent",
  success: "bg-surface-2 text-success-ink border-hairline",
  warning: "bg-surface-2 text-warning-ink border-hairline",
  danger: "bg-surface-2 text-danger-ink border-hairline",
  info: "bg-surface-2 text-info-ink border-hairline",
};

export function Badge({
  tone = "neutral",
  className,
  dot = false,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] leading-5 font-medium whitespace-nowrap",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {props.children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  children,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
        <h1 className="type-headline text-ink text-balance">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-[15px] text-ink-muted text-pretty">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

/** Par etiqueta/valor para listas de definición. */
export function Stat({
  label,
  value,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[12px] text-ink-subtle">{label}</dt>
      <dd className="mt-1 font-mono text-[15px] text-ink tabular">{value}</dd>
      {hint ? <dd className="mt-0.5 text-[12px] text-ink-tertiary">{hint}</dd> : null}
    </div>
  );
}

export function Legend({ items }: { items: { label: ReactNode; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-subtle">
      {items.map((item, i) => (
        <li key={i} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("inline-block h-0.5 w-3.5 rounded-full", item.dashed && "border-t-2 border-dashed bg-transparent")}
            style={item.dashed ? { borderColor: item.color } : { background: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
