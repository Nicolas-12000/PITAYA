import { PageHeaderSkeleton } from "@/components/states/PageHeaderSkeleton";

import { ModelsSkeleton } from "./_components/ModelsSkeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <ModelsSkeleton />
    </>
  );
}
