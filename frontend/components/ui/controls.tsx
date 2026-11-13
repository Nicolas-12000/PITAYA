"use client";

import { Tooltip as RTooltip } from "radix-ui";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

/** Control segmentado (tabs en pill). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[];
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex max-w-full overflow-x-auto rounded-full border border-hairline bg-surface-2 p-0.5", className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3 font-medium whitespace-nowrap transition-colors duration-[120ms]",
              size === "sm" ? "h-7 text-[12px]" : "h-8 text-[13px] max-md:h-10",
              active ? "bg-surface-1 text-ink ring-1 ring-hairline-strong" : "text-ink-subtle hover:text-ink",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[12px] text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-ink-tertiary">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "h-10 w-full rounded-md border border-hairline-strong bg-surface-1 px-3 text-sm text-ink placeholder:text-ink-tertiary transition-colors duration-[120ms] hover:border-hairline-tertiary focus-visible:border-primary-text max-md:h-11 aria-invalid:border-danger-ink";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, "font-mono tabular", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputBase, "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 stroke-ink-subtle"
        fill="none"
        strokeWidth="1.5"
      >
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RTooltip.Root delayDuration={250}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className="fade-in z-50 max-w-72 rounded-md border border-hairline-strong bg-surface-3 px-3 py-2 text-[12px] leading-relaxed text-ink-muted shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]"
        >
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

/** Chip multiselección para filtros. */
export function ToggleChip({
  pressed,
  onPressedChange,
  children,
  color,
}: {
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] transition-colors duration-[120ms] max-md:h-10",
        pressed
          ? "border-primary-text bg-primary-subtle text-ink"
          : "border-hairline bg-surface-1 text-ink-muted hover:border-hairline-strong hover:text-ink",
      )}
    >
      {color ? <span aria-hidden className="size-2 rounded-full" style={{ background: color }} /> : null}
      {children}
    </button>
  );
}

export function useFieldId(prefix: string): string {
  return `${prefix}-${useId()}`;
}
