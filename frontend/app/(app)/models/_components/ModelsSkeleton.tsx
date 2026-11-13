import { Busy, ChartSkeleton, KpiSkeleton, Skeleton, TableSkeleton } from "@/components/states/Skeleton";

export function ModelsSkeleton() {
  return (
    <Busy>
      <div className="mb-6 flex flex-wrap gap-3">
        <Skeleton className="h-9 w-64 rounded-full" />
        <Skeleton className="h-9 w-48 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartSkeleton height={260} />
        <ChartSkeleton height={260} />
      </div>
      <TableSkeleton rows={5} cols={7} className="mt-6" />
    </Busy>
  );
}
