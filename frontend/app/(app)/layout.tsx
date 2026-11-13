import { Suspense } from "react";

import { DemoModeBanner, RunBadge, RunBadgeSkeleton } from "@/components/app/RunBadge";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-on-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          runBadge={
            <Suspense fallback={<RunBadgeSkeleton />}>
              <RunBadge />
            </Suspense>
          }
        />
        <Suspense fallback={null}>
          <DemoModeBanner />
        </Suspense>
        <main id="contenido" className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-16 md:px-6 md:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
