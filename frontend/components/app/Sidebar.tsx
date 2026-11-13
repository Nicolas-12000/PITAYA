"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { PitayaLockup, PitayaMark } from "@/components/illustrations/PitayaMark";
import { cn } from "@/lib/utils";

import { NAV, findNav } from "./nav";

const KEY = "pitaya:sidebar-collapsed";
const listeners = new Set<() => void>();

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
function setCollapsed(value: boolean) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* almacenamiento no disponible */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function NavLinks({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = findNav(pathname)?.href;
  return (
    <nav aria-label="Principal" className="flex flex-col gap-5">
      {NAV.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-6 bg-hairline" />
          ) : (
            <p className="label-mono mb-1.5 px-3 text-ink-tertiary">{group.label}</p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = item.href === current;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-3 rounded-md px-3 text-[14px] transition-colors duration-[120ms] max-lg:h-11",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary-subtle text-ink"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {active ? (
                      <span aria-hidden className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-primary" />
                    ) : null}
                    <Icon
                      className={cn("size-5 shrink-0", active ? "text-primary-text" : "text-ink-subtle group-hover:text-ink-muted")}
                      strokeWidth={1.5}
                    />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-hairline bg-canvas transition-[width] duration-200 ease-out-soft lg:flex",
        collapsed ? "w-14" : "w-[232px]",
      )}
    >
      <div className={cn("flex h-12 items-center border-b border-hairline", collapsed ? "justify-center" : "px-4")}>
        <Link href="/" aria-label="PITAYA, ir al resumen" className="rounded-md">
          {collapsed ? <PitayaMark size={24} decorative /> : <PitayaLockup size={24} />}
        </Link>
      </div>
      <div className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-2" : "px-3")}>
        <NavLinks collapsed={collapsed} />
      </div>
      <div className={cn("border-t border-hairline p-2", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] text-ink-subtle hover:bg-surface-2 hover:text-ink",
            collapsed ? "w-9 justify-center px-0" : "w-full",
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" strokeWidth={1.5} /> : <PanelLeftClose className="size-4" strokeWidth={1.5} />}
          {collapsed ? null : "Contraer"}
        </button>
      </div>
    </aside>
  );
}
