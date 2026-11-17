import { Busy, ChartSkeleton, KpiSkeleton } from "@/components/states/Skeleton";

export function RoiSkeleton() {
  return (
    <Busy className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <KpiSkeleton className="h-90" />
      <ChartSkeleton height={300} />
    </Busy>
  );
}
