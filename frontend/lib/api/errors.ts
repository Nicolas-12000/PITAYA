/** Errores de API normalizados (sin dependencias de servidor: usable en cliente). */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export type FieldErrors = Record<string, string>;

/** 422 de FastAPI → { campo: mensaje }. */
export function toFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || error.status !== 422) return {};
  const detail = error.detail as { detail?: { loc?: (string | number)[]; msg?: string }[] } | null;
  const out: FieldErrors = {};
  for (const item of detail?.detail ?? []) {
    const field = String(item.loc?.[item.loc.length - 1] ?? "form");
    out[field] = item.msg ?? "Valor no válido";
  }
  return out;
}

/** Mensaje = qué pasó + qué hacer (AGENTS.md del frontend). */
export function toUserMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Ocurrió un error inesperado. Reintenta.";
  const { status } = error;
  if (status === 0 || status === 502) {
    return "No pudimos conectar con el servicio. Reintenta en unos segundos.";
  }
  if (status === 503) {
    return "Los datos del análisis no están listos. Reintenta en unos segundos.";
  }
  if (status === 422) return "Algunos campos no son válidos. Revisa los valores marcados.";
  if (status === 409) {
    return "Ya existe una recomendación con esta clave y otro contenido. Vuelve a calcular antes de guardar.";
  }
  if (status === 400) return "Esos valores no se pueden calcular. Ajusta los parámetros e inténtalo de nuevo.";
  if (status === 404) return "No encontramos lo que pediste.";
  if (status >= 500) return "No pudimos calcularlo. Reintenta en unos segundos.";
  return `Error inesperado (HTTP ${status}). Reintenta.`;
}
