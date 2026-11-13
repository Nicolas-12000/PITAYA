import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { Busy, KpiSkeleton, Skeleton } from "@/components/states/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <Busy>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="mt-6 h-[360px] rounded-xl" />
      </Busy>
    </>
  );
}
