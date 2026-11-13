import "server-only";

import { ApiError, toUserMessage } from "./errors";

/** Resultado que cada widget usa para aislar su propio error. */
export type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

const BASE = process.env.BACKEND_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}/${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, null, "network");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}

/** Llamada directa a FastAPI desde Server Components. Nunca lanza. */
export async function load<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  try {
    return { ok: true, data: await request<T>(path, init) };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : -1;
    return { ok: false, status, message: toUserMessage(error) };
  }
}

/** POST de solo lectura (p. ej. /v1/ab-test) desde el servidor. */
export function loadPost<T>(path: string, body: unknown): Promise<Result<T>> {
  return load<T>(path, { method: "POST", body: JSON.stringify(body) });
}
