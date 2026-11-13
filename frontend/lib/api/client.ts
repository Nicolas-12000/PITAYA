import { ApiError } from "./errors";

export { ApiError, toUserMessage, toFieldErrors } from "./errors";

/** Llamadas desde el navegador: siempre a través del proxy same-origin. */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { idempotencyKey?: string },
): Promise<T> {
  const { idempotencyKey, ...rest } = init ?? {};
  let response: Response;
  try {
    response = await fetch(`/api/backend/${path}`, {
      ...rest,
      headers: {
        "content-type": "application/json",
        ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
        ...rest.headers,
      },
    });
  } catch {
    throw new ApiError(0, null, "network");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T;
}

export function apiPost<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body), idempotencyKey });
}
