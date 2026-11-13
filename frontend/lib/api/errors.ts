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
    return "No pudimos conectar con el backend. Verifica que esté corriendo (make backend-dev) y reintenta.";
  }
  if (status === 503) {
    return "Falta el snapshot de datos o el modelo pedido. Ejecuta make ingest y make train en el backend.";
  }
  if (status === 422) return "Algunos campos no son válidos. Revisa los valores marcados.";
  if (status === 409) {
    return "Ya existe una recomendación con esta clave y otro contenido. Vuelve a calcular antes de guardar.";
  }
  if (status === 400) return `El backend rechazó la petición: ${detailText(error.detail)}. Ajusta los parámetros.`;
  if (status === 404) return "La ruta pedida no existe en el backend. Revisa la versión de la API.";
  if (status >= 500) return "El backend falló al calcular. Reintenta en unos segundos.";
  return `Error inesperado (HTTP ${status}). Reintenta.`;
}

function detailText(detail: unknown): string {
  if (detail && typeof detail === "object" && "detail" in detail) {
    const value = (detail as { detail: unknown }).detail;
    return typeof value === "string" ? value : JSON.stringify(value);
  }
  return "parámetros no válidos";
}
