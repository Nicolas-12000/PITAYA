"use client";

import { PitayaMark } from "@/components/illustrations/PitayaMark";
import { Button } from "@/components/ui/button";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-hairline bg-surface-1 px-6 py-16 text-center">
      <PitayaMark mood="oops" size={112} decorative />
      <h1 className="type-title text-ink">Esta pantalla falló al renderizar</h1>
      <p className="max-w-md text-[14px] text-ink-muted">
        Ocurrió un error inesperado en el cliente{error.digest ? ` (ref. ${error.digest})` : ""}. Reintenta; si persiste,
        revisa la consola del servidor de Next.js.
      </p>
      <Button variant="primary" onClick={() => retry()}>
        Reintentar
      </Button>
    </div>
  );
}
