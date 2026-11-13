"use client";

import { useState } from "react";

/**
 * Una clave por contenido: se reutiliza en reintentos del mismo cuerpo
 * y se renueva solo cuando cambia el payload (FRONTEND.md §16).
 */
export function useIdempotencyKey(payload: unknown): string {
  const sig = JSON.stringify(payload);
  const [state, setState] = useState(() => ({ sig, key: crypto.randomUUID() }));
  if (state.sig !== sig) {
    const next = { sig, key: crypto.randomUUID() };
    setState(next);
    return next.key;
  }
  return state.key;
}
