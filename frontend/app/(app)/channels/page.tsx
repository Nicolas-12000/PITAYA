import type { Metadata } from "next";
import { Suspense } from "react";

import { Notice } from "@/components/notices/notices";
import { Busy, ChartSkeleton, Skeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { ChannelsResponse, SegmentsResponse } from "@/lib/api/types";

import { EfficiencyBubbles } from "./_components/EfficiencyBubbles";

export const metadata: Metadata = { title: "Canales" };

export default function ChannelsPage() {
  return (
    <>
      <PageHeader
        title="Eficiencia por canal"
        description="Costo por conversión frente a retorno del gasto. Abajo a la derecha es caro y rinde poco; arriba a la izquierda es barato y rinde mucho."
      />
      <Notice className="mb-6">
        Hoy solo hay datos de Facebook; la comparación es entre campañas y segmentos. El selector de canal ya está listo para
        más fuentes.
      </Notice>
      <Suspense
        fallback={
          <Busy className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <ChartSkeleton height={380} />
            <Skeleton className="h-[460px] rounded-lg" />
          </Busy>
        }
      >
        <Channels />
      </Suspense>
    </>
  );
}

async function Channels() {
  const [channels, segments] = await Promise.all([
    load<ChannelsResponse>("v1/channels/compare"),
    load<SegmentsResponse>("v1/segments"),
  ]);
  if (!channels.ok) return <ErrorState title="No pudimos cargar la comparación" message={channels.message} />;
  return (
    <EfficiencyBubbles
      channel={channels.data.channel}
      campaigns={channels.data.campaigns}
      segments={segments.ok ? segments.data.segments : []}
      segmentsError={segments.ok ? null : segments.message}
    />
  );
}
