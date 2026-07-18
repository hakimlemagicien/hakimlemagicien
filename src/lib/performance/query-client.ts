import { QueryClient } from "@tanstack/react-query";

/** Shared React Query defaults — essential data first, secondary refetch deferred. */
export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
