import type { Metadata } from "next";
import { Suspense } from "react";

import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { ModelsResponse, SegmentsResponse } from "@/lib/api/types";

import { WhatIfForm } from "./_components/WhatIfForm";

export const metadata: Metadata = { title: "What-if" };

export default function WhatIfPage() {
  return (
    <>
      <PageHeader
        title="What-if: ¿convertirá este anuncio?"
        description="Describe un anuncio y los modelos entrenados estiman la probabilidad de que logre al menos una conversión aprobada."
      />
      <Suspense
        fallback={
          <Busy className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <KpiSkeleton className="h-[520px]" />
            <ChartSkeleton height={320} />
          </Busy>
        }
      >
        <WhatIf />
      </Suspense>
    </>
  );
}

async function WhatIf() {
  const [segments, models] = await Promise.all([load<SegmentsResponse>("v1/segments"), load<ModelsResponse>("v1/models")]);
  if (!segments.ok) return <ErrorState title="No pudimos cargar las opciones del formulario" message={segments.message} />;
  const segs = segments.data.segments;
  const uniq = <T,>(xs: T[]) => [...new Set(xs)];
  const manifest = models.ok && models.data.status === "ok" ? models.data.manifest : null;
  return (
    <WhatIfForm
      options={{
        campaign: uniq(segs.map((s) => s.xyz_campaign_id)).sort((a, b) => a - b),
        age: uniq(segs.map((s) => s.age)).sort(),
        gender: uniq(segs.map((s) => s.gender)).sort(),
        interest: uniq(segs.map((s) => s.interest)).sort((a, b) => a - b),
      }}
      models={manifest ? manifest.models.map((m) => m.kind) : ["random_forest"]}
      trainedScenario={manifest?.feature_scenario ?? null}
    />
  );
}
