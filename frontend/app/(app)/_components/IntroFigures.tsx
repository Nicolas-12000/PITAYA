"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { FigLabel, FigLayers, FigModules, FigScales } from "@/components/illustrations/Iso";

const KEY = "pitaya:intro-dismissed";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

const COLUMNS = [
  {
    n: "0.1",
    title: "Capas",
    Fig: FigLayers,
    text: "Datos → modelos → decisiones. El snapshot de Kaggle se valida (CRISP-DM), se entrena offline y la API solo sirve resultados.",
  },
  {
    n: "0.2",
    title: "Módulos",
    Fig: FigModules,
    text: "Monolito modular: catálogo, rendimiento, modelado, experimentos, atribución y presupuesto, cada uno con su api.py.",
  },
  {
    n: "0.3",
    title: "Escamas",
    Fig: FigScales,
    text: "Cada lámina es un segmento: campaña × edad × género × interés. Los que más rinden reciben más presupuesto.",
  },
];

/** Introducción descartable con FIG 0.1–0.3 (se recuerda en localStorage). */
export function IntroFigures() {
  const dismissed = useSyncExternalStore(subscribe, read, () => true);
  if (dismissed) return null;
  return (
    <section aria-labelledby="intro-title" className="fade-in mt-10 rounded-xl border border-hairline bg-surface-1">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <h2 id="intro-title" className="text-[14px] font-medium text-ink">
          Cómo está hecho PITAYA
        </h2>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* sin almacenamiento */
            }
            listeners.forEach((l) => l());
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] text-ink-subtle hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={1.5} /> Ocultar
        </button>
      </div>
      <div className="grid md:grid-cols-3 md:divide-x md:divide-hairline max-md:divide-y max-md:divide-hairline">
        {COLUMNS.map(({ n, title, Fig, text }) => (
          <figure key={n} className="flex flex-col gap-4 p-5">
            <FigLabel n={n}>{title}</FigLabel>
            <div className="dot-grid flex h-44 items-center justify-center rounded-lg border border-hairline bg-canvas p-6">
              <Fig draw className="max-h-full max-w-[200px]" />
            </div>
            <figcaption className="text-[13px] text-ink-muted text-pretty">{text}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
