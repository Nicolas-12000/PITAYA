import type { Metadata } from "next";
import { Suspense } from "react";

import { ObservationalNote } from "@/components/notices/notices";
import { Busy, ChartSkeleton, KpiSkeleton, Skeleton } from "@/components/states/Skeleton";
import { ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { loadPost } from "@/lib/api/server";
import type { AbTestResponse } from "@/lib/api/types";

import { AbExplorer } from "./_components/AbExplorer";

export const metadata: Metadata = { title: "Pruebas A/B" };

export default function AbPage() {
  return (
    <>
      <PageHeader
        title="Pruebas A/B entre campañas"
        description="Pruebas de dos proporciones con corrección de Holm, posteriores Beta-Binomial y bootstrap del CPA, calculados por el backend."
        eyebrow={<ObservationalNote />}
      />
      <Suspense fallback={<AbSkeleton />}>
        <Ab />
      </Suspense>
    </>
  );
}

function AbSkeleton() {
  return (
    <Busy>
      <Skeleton className="mb-6 h-9 w-72 rounded-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>
      <ChartSkeleton height={220} className="mt-6" />
    </Busy>
  );
}

async function Ab() {
  const res = await loadPost<AbTestResponse>("v1/ab-test", {});
  if (!res.ok) return <ErrorState title="No pudimos calcular las pruebas" message={res.message} />;
  return <AbExplorer data={res.data} />;
}
