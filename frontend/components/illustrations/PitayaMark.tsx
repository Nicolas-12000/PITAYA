import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Mood = "happy" | "thinking" | "oops" | "sleepy" | "celebrate";

const INK = "var(--mark-ink)";
const BODY = "M64 22 C88 22 102 44 102 68 C102 94 86 112 64 112 C42 112 26 94 26 68 C26 44 40 22 64 22 Z";
const SHADE = "M84 30 C96 38 102 52 102 68 C102 94 86 112 64 112 C80 106 92 90 92 68 C92 54 90 40 84 30 Z";
const CROWN = "M64 26 C58 18 58 9 64 2 C70 9 70 18 64 26 Z";
// Lado izquierdo; el derecho es su espejo
const SIDE = [
  "M55 28 C47 22 43 14 44 6 C52 10 58 17 60 27 Z",
  "M32 58 C22 56 14 48 10 36 C22 35 32 40 36 48 Z",
  "M28 76 C18 74 11 68 7 60 C18 58 27 62 31 68 Z",
  "M34 98 C24 98 16 93 11 84 C22 82 32 86 38 92 Z",
  "M50 108 C44 112 40 118 42 124 C48 122 54 116 56 110 Z",
];

const MOUTH: Record<Mood, ReactNode> = {
  happy: <path d="M55 77 Q64 88 73 77" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />,
  thinking: <path d="M57 81 H71" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />,
  oops: <ellipse cx="64" cy="81" rx="3.6" ry="4.4" fill={INK} />,
  sleepy: <path d="M60 80 Q64 83 68 80" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />,
  celebrate: (
    <>
      <path d="M53 75 Q64 94 75 75 Z" fill={INK} />
      <path d="M58 84 Q64 90 70 84 Q64 80 58 84 Z" fill="var(--mark-tongue)" />
    </>
  ),
};

function Face({ mood }: { mood: Mood }) {
  const closed = mood === "sleepy" || mood === "celebrate";
  const [base, peak] = mood === "celebrate" ? [69, 62] : [66, 71];
  return (
    <g>
      {closed ? (
        <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
          <path d={`M48 ${base} Q53 ${peak} 58 ${base}`} />
          <path d={`M70 ${base} Q75 ${peak} 80 ${base}`} />
        </g>
      ) : (
        <g className="pitaya-eyes">
          <circle cx="53" cy="66" r="4.4" fill={INK} />
          <circle cx="75" cy="66" r="4.4" fill={INK} />
          <circle cx="54.5" cy="64.5" r="1.5" fill="var(--on-primary)" />
          <circle cx="76.5" cy="64.5" r="1.5" fill="var(--on-primary)" />
        </g>
      )}
      <ellipse cx="45" cy="77" rx="5.5" ry="3.4" fill="var(--mark-cheek)" opacity=".55" />
      <ellipse cx="83" cy="77" rx="5.5" ry="3.4" fill="var(--mark-cheek)" opacity=".55" />
      {MOUTH[mood]}
      {mood === "thinking" && <path d="M69 57 L80 55" stroke={INK} strokeWidth="3" strokeLinecap="round" />}
      {mood === "oops" && (
        <path d="M91 44 C94 49 94 53 91 53 C88 53 88 49 91 44 Z" className="fill-series-5" />
      )}
      {mood === "sleepy" && (
        <path
          d="M88 36 h9 l-9 10 h9"
          fill="none"
          className="stroke-ink-subtle"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {mood === "celebrate" && (
        <g className="fill-series-4">
          <path d="M20 24 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
          <path d="M108 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" />
        </g>
      )}
    </g>
  );
}

export function PitayaMark({
  mood = "happy",
  size = 64,
  decorative = false,
  className,
}: {
  mood?: Mood;
  size?: number;
  decorative?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={cn("pitaya shrink-0", mood === "celebrate" && "pitaya-hop", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Pitaya, la mascota de PITAYA" })}
    >
      <g className="fill-series-3">
        <path d={CROWN} />
        {SIDE.map((d) => (
          <path key={d} d={d} />
        ))}
        <g transform="matrix(-1 0 0 1 128 0)">
          {SIDE.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
      <path d={BODY} className="fill-primary" />
      <path d={SHADE} fill="var(--mark-shade)" opacity=".55" />
      <path
        d="M44 46 C47 38 53 33 60 31"
        fill="none"
        stroke="var(--on-primary)"
        strokeOpacity=".4"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Face mood={mood} />
    </svg>
  );
}

export function PitayaLockup({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <PitayaMark size={size} decorative />
      <span className="text-[17px] font-semibold lowercase tracking-[-0.04em] text-ink">pitaya</span>
    </span>
  );
}
