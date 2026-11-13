"use client";

import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Panel lateral deslizable (overlay con blur, único lugar donde se permite). */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-40 bg-canvas/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            "fade-in fixed top-0 z-50 flex h-dvh w-[min(420px,92vw)] flex-col border-hairline bg-surface-1 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.45)] focus:outline-none",
            side === "right" ? "right-0 border-l" : "left-0 border-r",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-[17px] font-medium tracking-[-0.3px] text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-[13px] text-ink-subtle">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Panel lateral</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="-mr-1 inline-flex size-9 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-2 hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="size-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-40 bg-canvas/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fade-in fixed top-1/2 left-1/2 z-50 w-[min(420px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-hairline-strong bg-surface-1 p-5 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.45)]">
          <Dialog.Title className="text-[17px] font-medium text-ink">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-ink-muted">{description}</Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close className="inline-flex h-10 items-center rounded-md border border-hairline-strong px-4 text-sm font-medium text-ink hover:bg-surface-2">
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
