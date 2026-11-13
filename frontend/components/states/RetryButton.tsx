"use client";

import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function RetryButton({ onRetry, label = "Reintentar" }: { onRetry?: () => void; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => (onRetry ? onRetry() : start(() => router.refresh()))}
    >
      <RotateCw strokeWidth={1.5} className={pending ? "animate-spin" : undefined} />
      {pending ? "Reintentando…" : label}
    </Button>
  );
}
