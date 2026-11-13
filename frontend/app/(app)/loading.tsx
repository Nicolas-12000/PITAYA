import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <KpiSkeleton key={i} className="h-[196px]" />
        ))}
      </Busy>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartSkeleton height={180} />
        <ChartSkeleton height={180} />
      </div>
    </>
  );
}
