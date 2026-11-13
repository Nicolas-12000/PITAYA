import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, ChartSkeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Busy className="grid gap-6 xl:grid-cols-2">
        <ChartSkeleton height={220} />
        <ChartSkeleton height={220} className="border-dashed border-series-4" />
      </Busy>
    </>
  );
}
