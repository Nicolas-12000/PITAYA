import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const VARIANT: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed border border-transparent",
  secondary: "bg-surface-1 text-ink border border-hairline-strong hover:bg-surface-2 active:bg-surface-3",
  ghost: "bg-transparent text-ink-muted border border-transparent hover:bg-surface-2 hover:text-ink",
  danger: "bg-surface-1 text-danger-ink border border-hairline-strong hover:bg-surface-2",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2 max-md:h-11",
  icon: "size-9 max-md:size-11",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string): string {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center rounded-md font-medium whitespace-nowrap",
    "transition-[background-color,color,transform] duration-[120ms] ease-out-soft active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  asChild = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={buttonClass(variant, size, className)} {...props} />;
}
