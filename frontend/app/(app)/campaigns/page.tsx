import type { Metadata } from "next";
import { Suspense } from "react";

import { ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { KpisResponse, SegmentsResponse } from "@/lib/api/types";

import { SegmentExplorer } from "./_components/SegmentExplorer";
import { CampaignsSkeleton } from "./_components/CampaignsSkeleton";

export const metadata: Metadata = { title: "Campañas y segmentos" };

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campañas y segmentos"
        description="Cada fila es un segmento: campaña × edad × género × interés. Filtra, ordena y abre una fila para compararla con el promedio global."
      />
      <Suspense fallback={<CampaignsSkeleton bare />}>
        <Explorer />
      </Suspense>
    </>
  );
}

async function Explorer() {
  const [segments, kpis] = await Promise.all([load<SegmentsResponse>("v1/segments"), load<KpisResponse>("v1/kpis")]);
  if (!segments.ok) return <ErrorState title="No pudimos cargar los segmentos" message={segments.message} />;
  return <SegmentExplorer segments={segments.data.segments} global={kpis.ok ? kpis.data.kpis : null} />;
}
