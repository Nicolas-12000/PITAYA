import { Busy, Skeleton, TableSkeleton } from "@/components/states/Skeleton";

export function CampaignsSkeleton({ bare = false }: { bare?: boolean }) {
  return (
    <Busy>
      {bare ? null : (
        <div className="mb-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-4 w-[28rem] max-w-full" />
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      <TableSkeleton cols={8} />
    </Busy>
  );
}
