import { cn } from "@/lib/utils";

const C = Math.cos(Math.PI / 6);
type Pt = [number, number];
const iso = (x: number, y: number, z: number): Pt => [(x - y) * C, (x + y) * 0.5 - z];
const poly = (p: Pt[]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

type Box = { x?: number; y?: number; z?: number; w: number; d: number; h: number; accent?: boolean };

function boxFaces({ x = 0, y = 0, z = 0, w, d, h }: Box) {
  const top = [iso(x, y, z + h), iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x, y + d, z + h)];
  const left = [iso(x, y + d, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x, y + d, z)];
  const right = [iso(x + w, y, z + h), iso(x + w, y + d, z + h), iso(x + w, y + d, z), iso(x + w, y, z)];
  return { top, left, right };
}

export function IsoBox(props: Box) {
  const { top, left, right } = boxFaces(props);
  return (
    <g fill="none" strokeLinejoin="round" strokeWidth={1}>
      <polygon points={poly(left)} pathLength={1} className="fill-surface-1 stroke-hairline-strong" vectorEffect="non-scaling-stroke" />
      <polygon points={poly(right)} pathLength={1} className="fill-surface-1 stroke-hairline-strong" vectorEffect="non-scaling-stroke" />
      <polygon
        points={poly(top)}
        pathLength={1}
        className={cn("fill-surface-1", props.accent ? "stroke-primary-text" : "stroke-ink-subtle")}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function viewBoxFor(boxes: Box[], pad = 8): string {
  const pts = boxes.flatMap((b) => {
    const f = boxFaces(b);
    return [...f.top, ...f.left, ...f.right];
  });
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return `${minX.toFixed(1)} ${minY.toFixed(1)} ${(Math.max(...xs) - minX + pad).toFixed(1)} ${(Math.max(...ys) - minY + pad).toFixed(1)}`;
}

function Figure({ boxes, className, draw }: { boxes: Box[]; className?: string; draw?: boolean }) {
  // Orden de pintor: primero lo más lejano (menor x + y, menor z).
  const ordered = [...boxes].sort((a, b) => (a.x ?? 0) + (a.y ?? 0) - ((b.x ?? 0) + (b.y ?? 0)) || (a.z ?? 0) - (b.z ?? 0));
  return (
    <svg viewBox={viewBoxFor(boxes)} aria-hidden className={cn("h-auto w-full", draw && "fig-draw", className)}>
      {ordered.map((b, i) => (
        <IsoBox key={i} {...b} />
      ))}
    </svg>
  );
}

/** FIG 0.1 Capas: datos → modelos → decisiones. */
const LAYERS: Box[] = Array.from({ length: 6 }, (_, i) => ({ w: 120, d: 120, h: 8, z: i * 14, accent: i === 5 }));
/** FIG 0.2 Módulos: cubos del monolito modular. */
const MODULES: Box[] = [
  [0, 0], [56, 0], [112, 0], [0, 56], [56, 56], [112, 56],
].map(([x, y], i) => ({ x, y, w: 44, d: 44, h: i === 1 ? 64 : 44, accent: i === 1 }));
/** FIG 0.3 Escamas: láminas verticales con altura decreciente. */
const SCALES: Box[] = Array.from({ length: 9 }, (_, i) => ({
  x: i * 16,
  w: 6,
  d: 70,
  h: 96 - i * 9,
  accent: i === 0,
}));

export function FigLayers(p: { className?: string; draw?: boolean }) {
  return <Figure boxes={LAYERS} {...p} />;
}
export function FigModules(p: { className?: string; draw?: boolean }) {
  return <Figure boxes={MODULES} {...p} />;
}
export function FigScales(p: { className?: string; draw?: boolean }) {
  return <Figure boxes={SCALES} {...p} />;
}

export function FigLabel({ n, children }: { n: string; children?: React.ReactNode }) {
  return (
    <p className="label-mono text-ink-tertiary">
      FIG {n}
      {children ? <span className="ml-2 text-ink-subtle">{children}</span> : null}
    </p>
  );
}
