import Link from "next/link";

import { FigScales } from "@/components/illustrations/Iso";
import { PitayaMark } from "@/components/illustrations/PitayaMark";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="label-mono text-ink-tertiary">FIG 404 · Ruta no encontrada</p>
      <div className="relative w-56">
        <FigScales draw className="opacity-80" />
        <PitayaMark mood="oops" size={96} decorative className="absolute -top-6 left-1/2 -translate-x-1/2" />
      </div>
      <h1 className="type-display text-ink max-sm:text-[36px]">Esta página no existe</h1>
      <p className="max-w-md text-ink-muted">
        La dirección no corresponde a ninguna pantalla de PITAYA. Vuelve al resumen o usa la paleta de comandos (Ctrl K).
      </p>
      <Link href="/" className={buttonClass("primary")}>
        Ir al resumen
      </Link>
    </main>
  );
}
