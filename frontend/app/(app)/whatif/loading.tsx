import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Busy className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <KpiSkeleton className="h-[520px]" />
        <ChartSkeleton height={320} />
      </Busy>
    </>
  );
}
