import type { Metadata } from "next";
import { Suspense } from "react";

import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { ChannelsResponse, RecommendationsList, StatusResponse } from "@/lib/api/types";

import { BudgetPlanner } from "./_components/BudgetPlanner";

export const metadata: Metadata = { title: "Recomendador" };

export default function BudgetPage() {
  return (
    <>
      <PageHeader
        title="Recomendador de presupuesto"
        description="Reparte un presupuesto entre segmentos con CVR suavizado (Beta-Binomial) y una curva de respuesta cóncava. Se basa en el histórico y no garantiza resultados."
      />
      <Suspense
        fallback={
          <Busy className="grid gap-6 lg:grid-cols-[340px_1fr]">
            <KpiSkeleton className="h-[420px]" />
            <ChartSkeleton height={340} />
          </Busy>
        }
      >
        <Planner />
      </Suspense>
    </>
  );
}

async function Planner() {
  const [channels, history, status] = await Promise.all([
    load<ChannelsResponse>("v1/channels/compare"),
    load<RecommendationsList>("v1/recommendations"),
    load<StatusResponse>("v1/status"),
  ]);
  if (!channels.ok) return <ErrorState title="No pudimos cargar el gasto actual" message={channels.message} />;
  return (
    <BudgetPlanner
      campaigns={channels.data.campaigns}
      initialHistory={history.ok ? history.data : { items: [] }}
      storageMode={status.ok ? status.data.storage_mode : null}
    />
  );
}
