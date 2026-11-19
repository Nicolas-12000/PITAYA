import { FigLabel, FigLayers, FigModules, FigScales } from "@/components/illustrations/Iso";

const COLUMNS = [
  {
    n: "0.1",
    title: "Capas",
    Fig: FigLayers,
    text: "Datos → modelos → decisiones. El dataset de Kaggle se limpia y valida, los modelos se entrenan antes de publicar, y la aplicación solo consulta resultados ya calculados.",
  },
  {
    n: "0.2",
    title: "Módulos",
    Fig: FigModules,
    text: "Un solo sistema dividido en piezas independientes: datos, rendimiento, modelos, pruebas A/B, atribución y presupuesto. Cada una responde una pregunta del negocio.",
  },
  {
    n: "0.3",
    title: "Escamas",
    Fig: FigScales,
    text: "Cada lámina es un segmento: campaña × edad × género × interés. Los que más rinden reciben más presupuesto en el recomendador.",
  },
];

/** Introducción con FIG 0.1–0.3: cómo está construido PITAYA. */
export function IntroFigures() {
  return (
    <section aria-labelledby="intro-title" className="mt-10 rounded-xl border border-hairline bg-surface-1">
      <div className="border-b border-hairline px-5 py-3">
        <h2 id="intro-title" className="text-[14px] font-medium text-ink">
          Cómo está hecho PITAYA
        </h2>
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
