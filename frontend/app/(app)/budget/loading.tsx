import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Busy className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <KpiSkeleton className="h-[420px]" />
        <ChartSkeleton height={340} />
      </Busy>
    </>
  );
}
