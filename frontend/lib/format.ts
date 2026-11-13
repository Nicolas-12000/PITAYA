/** Único punto de formato de números (FRONTEND.md §13). Locale es-CO. */
const LOCALE = "es-CO";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";
export const EMPTY = "—";

type Num = number | null | undefined;

function ok(value: Num): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Notación compacta propia: la de Intl difiere entre el ICU de Node y el del
 * navegador («K» vs «k») y rompe la hidratación.
 */
function compact(value: number): { scaled: number; suffix: string } | null {
  const abs = Math.abs(value);
  if (abs >= 1e9) return { scaled: value / 1e9, suffix: " mil M" };
  if (abs >= 1e6) return { scaled: value / 1e6, suffix: " M" };
  if (abs >= 1e4) return { scaled: value / 1e3, suffix: " k" };
  return null;
}

export function formatNumber(value: Num, digits = 0): string {
  if (!ok(value)) return EMPTY;
  const c = compact(value);
  const fmt = (v: number, d: number, min: number) =>
    new Intl.NumberFormat(LOCALE, { maximumFractionDigits: d, minimumFractionDigits: min }).format(v);
  return c ? `${fmt(c.scaled, 1, 0)}${c.suffix}` : fmt(value, digits, digits);
}

/** Entero completo sin notación compacta (tablas). */
export function formatInteger(value: Num): string {
  if (!ok(value)) return EMPTY;
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

export function formatCurrency(value: Num, digits = 2): string {
  if (!ok(value)) return EMPTY;
  const c = compact(value);
  const fmt = (v: number, d: number, min: number) =>
    new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
      maximumFractionDigits: d,
      minimumFractionDigits: min,
    }).format(v);
  return c ? `${fmt(c.scaled, 1, 0)}${c.suffix}` : fmt(value, digits, digits);
}

/** Proporción (0–1) como porcentaje. */
export function formatPercent(value: Num, digits = 1): string {
  if (!ok(value)) return EMPTY;
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

/** Porcentaje con signo (ROI, deltas). */
export function formatSignedPercent(value: Num, digits = 1): string {
  if (!ok(value)) return EMPTY;
  return new Intl.NumberFormat(LOCALE, {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
    signDisplay: "exceptZero",
  }).format(value);
}

/** Tasas muy pequeñas (CTR ~0,01 %) con más decimales. */
export function formatRate(value: Num): string {
  if (!ok(value)) return EMPTY;
  const digits = Math.abs(value) < 0.001 ? 3 : Math.abs(value) < 0.1 ? 2 : 1;
  return formatPercent(value, digits);
}

export function formatRatio(value: Num, digits = 2): string {
  if (!ok(value)) return EMPTY;
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)}×`;
}

export function formatDecimal(value: Num, digits = 3): string {
  if (!ok(value)) return EMPTY;
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

export function formatPValue(value: Num): string {
  if (!ok(value)) return EMPTY;
  if (value < 0.0001) return "< 0,0001";
  return formatDecimal(value, 4);
}

/** Intervalo: «12,4 % [10,1 – 14,8]». */
export function formatInterval(
  point: Num,
  low: Num,
  high: Num,
  fmt: (v: Num) => string = (v) => formatPercent(v, 1),
): string {
  if (!ok(point)) return EMPTY;
  if (!ok(low) || !ok(high)) return `${fmt(point)} [${EMPTY}]`;
  return `${fmt(point)} [${fmt(low).replace(/\s?%$/, "")} – ${fmt(high).replace(/\s?%$/, "")}]`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return EMPTY;
  // Formato manual en UTC: idéntico en servidor y navegador (sin desajustes de hidratación).
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

export function shortHash(hash: string | null | undefined, size = 7): string {
  return hash ? hash.slice(0, size) : EMPTY;
}
