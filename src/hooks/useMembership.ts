import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FREE_MEMBERSHIP_STATE,
  MEMBERSHIP_QUERY_KEY,
  fetchMembershipState,
  type MembershipState,
} from "@/lib/platform/membership";

const DEFAULT_STATE: MembershipState = FREE_MEMBERSHIP_STATE;

export function useMembership() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: MEMBERSHIP_QUERY_KEY,
    queryFn: fetchMembershipState,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    // Keep membership fresh without manual page refresh.
    refetchInterval: 20_000,
    // Never blank the platform while membership loads / refreshes.
    placeholderData: DEFAULT_STATE,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      // Skip noisy init event; first useQuery fetch already covers it.
      if (event === "INITIAL_SESSION") return;
      void queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const state = query.data ?? DEFAULT_STATE;

  return {
    ...state,
    // With placeholderData, isLoading can stay true without blocking UI.
    // Only expose "initial bootstrap" loading when we have no resolved data yet.
    loading: query.isLoading && !query.isFetched,
    error: query.error instanceof Error ? query.error.message : null,
    refreshMembership: async () => {
      await queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEY });
      await query.refetch();
    },
  };
}
