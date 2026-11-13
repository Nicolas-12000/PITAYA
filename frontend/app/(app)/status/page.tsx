import type { Metadata } from "next";
import { Suspense } from "react";

import { Busy, KpiSkeleton, Skeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { HealthResponse, ModelsResponse, StatusResponse } from "@/lib/api/types";

import { StatusBoard } from "./_components/StatusBoard";

export const metadata: Metadata = { title: "Estado" };

export default function StatusPage() {
  return (
    <>
      <PageHeader
        title="Estado del sistema"
        description="Qué pasa por debajo: dónde se guardan los datos, qué snapshot y modelos se sirven y qué queda pendiente de sincronizar."
      />
      <Suspense
        fallback={
          <Busy>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <KpiSkeleton key={i} />
              ))}
            </div>
            <Skeleton className="mt-6 h-[360px] rounded-xl" />
          </Busy>
        }
      >
        <Status />
      </Suspense>
    </>
  );
}

async function Status() {
  const [status, health, models] = await Promise.all([
    load<StatusResponse>("v1/status"),
    load<HealthResponse>("v1/health"),
    load<ModelsResponse>("v1/models"),
  ]);
  if (!status.ok) {
    return (
      <ErrorState
        title="El backend no responde"
        message={`${status.message} Comprueba BACKEND_URL en frontend/.env.local.`}
      />
    );
  }
  return (
    <StatusBoard
      initialStatus={status.data}
      healthy={health.ok && health.data.status === "ok"}
      manifest={models.ok && models.data.status === "ok" ? models.data.manifest : null}
    />
  );
}
