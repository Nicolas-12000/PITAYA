import { Busy, Skeleton } from "./Skeleton";

export function PageHeaderSkeleton() {
  return (
    <Busy className="mb-6 md:mb-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-[32rem] max-w-full" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
    </Busy>
  );
}
