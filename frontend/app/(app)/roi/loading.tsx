import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";
import { TableSkeleton } from "@/components/states/Skeleton";

import { RoiSkeleton } from "./_components/RoiSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <RoiSkeleton />
      <TableSkeleton rows={3} cols={6} className="mt-6" />
    </>
  );
}
