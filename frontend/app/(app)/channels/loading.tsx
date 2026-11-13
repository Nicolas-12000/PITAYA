import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, ChartSkeleton, Skeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Skeleton className="mb-6 h-12 w-full rounded-lg" />
      <Busy className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <ChartSkeleton height={380} />
        <Skeleton className="h-[460px] rounded-lg" />
      </Busy>
    </>
  );
}
