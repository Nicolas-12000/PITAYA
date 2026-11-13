"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Tooltip } from "radix-ui";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 2, retryDelay: (n) => 800 * 2 ** n, staleTime: 60_000, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <Tooltip.Provider delayDuration={250}>
          {children}
          <Toaster
            position="bottom-right"
            duration={4000}
            toastOptions={{
              className: "!bg-surface-3 !border-hairline-strong !text-ink !rounded-md !text-[13px]",
            }}
          />
        </Tooltip.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
