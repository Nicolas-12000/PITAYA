import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Busy className="grid gap-4 md:grid-cols-3">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </Busy>
      <ChartSkeleton height={220} className="mt-6" />
    </>
  );
}
