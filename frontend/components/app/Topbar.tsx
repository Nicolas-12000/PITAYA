"use client";

import { ChevronRight, Command, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { PitayaLockup } from "@/components/illustrations/PitayaMark";
import { Sheet } from "@/components/ui/sheet";

import { CommandMenu } from "./CommandMenu";
import { findNav } from "./nav";
import { NavLinks } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar({ runBadge }: { runBadge: React.ReactNode }) {
  const pathname = usePathname();
  const current = findNav(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-hairline bg-canvas px-4 md:px-6">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir navegación"
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 lg:hidden"
        >
          <Menu className="size-5" strokeWidth={1.5} />
        </button>
        <nav aria-label="Migas de pan" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <Link href="/" className="hidden text-ink-subtle hover:text-ink sm:inline">
            pitaya
          </Link>
          <ChevronRight className="hidden size-3.5 text-ink-tertiary sm:inline" strokeWidth={1.5} aria-hidden />
          <span className="truncate text-ink" aria-current="page">
            {current?.label ?? "Página"}
          </span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="hidden h-8 items-center gap-2 rounded-md border border-hairline bg-surface-1 pr-1.5 pl-3 text-[13px] text-ink-subtle hover:border-hairline-strong hover:text-ink md:inline-flex"
          >
            Buscar o saltar a…
            <kbd className="inline-flex items-center gap-0.5 rounded-sm border border-hairline bg-surface-2 px-1.5 font-mono text-[11px] text-ink-subtle">
              <Command className="size-3" strokeWidth={1.5} />K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            aria-label="Abrir paleta de comandos"
            className="inline-flex size-11 items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 md:hidden"
          >
            <Command className="size-4" strokeWidth={1.5} />
          </button>
          {runBadge}
          <ThemeToggle className="hidden sm:inline-flex" />
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={<PitayaLockup size={24} />} side="left" className="lg:hidden">
        <div className="px-3 py-4">
          <NavLinks onNavigate={() => setMenuOpen(false)} />
          <div className="mt-6 flex items-center justify-between border-t border-hairline px-3 pt-4">
            <span className="text-[13px] text-ink-subtle">Tema</span>
            <ThemeToggle />
          </div>
        </div>
      </Sheet>

      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
