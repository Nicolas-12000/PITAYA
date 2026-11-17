"use client";

import { Command } from "cmdk";
import { Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Dialog } from "radix-ui";
import { useEffect } from "react";

import { NAV } from "./nav";

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-ink-muted data-selected:bg-surface-2 data-selected:text-ink";

const groupClass =
  "**:[[cmdk-group-heading]]:label-mono **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-ink-tertiary";

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-40 bg-canvas/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fade-in fixed top-[12vh] left-1/2 z-50 w-[min(560px,92vw)] -translate-x-1/2 overflow-hidden rounded-lg border border-hairline-strong bg-surface-1 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.5)]">
          <Dialog.Title className="sr-only">Paleta de comandos</Dialog.Title>
          <Dialog.Description className="sr-only">Navega entre páginas o cambia el tema.</Dialog.Description>
          <Command label="Paleta de comandos" loop>
            <div className="flex items-center gap-2 border-b border-hairline px-4">
              <Search className="size-4 text-ink-subtle" strokeWidth={1.5} aria-hidden />
              <Command.Input
                autoFocus
                placeholder="Busca una página o acción…"
                className="h-12 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-tertiary focus:outline-none"
              />
              <kbd className="rounded-sm border border-hairline bg-surface-2 px-1.5 font-mono text-[11px] text-ink-subtle">Esc</kbd>
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-[13px] text-ink-subtle">Sin resultados.</Command.Empty>
              {NAV.map((group) => (
                <Command.Group
                  key={group.label}
                  heading={group.label}
                  className={groupClass}
                >
                  {group.items.map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.description}`}
                      onSelect={() => run(() => router.push(item.href))}
                      className={itemClass}
                    >
                      <item.icon className="size-4 text-ink-subtle" strokeWidth={1.5} />
                      <span className="text-ink">{item.label}</span>
                      <span className="ml-auto truncate text-xs text-ink-tertiary max-sm:hidden">{item.description}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
              <Command.Group
                heading="Preferencias"
                className={groupClass}
              >
                <Command.Item onSelect={() => run(() => setTheme("light"))} className={itemClass}>
                  <Sun className="size-4" strokeWidth={1.5} /> Tema claro
                </Command.Item>
                <Command.Item onSelect={() => run(() => setTheme("dark"))} className={itemClass}>
                  <Moon className="size-4" strokeWidth={1.5} /> Tema oscuro
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
