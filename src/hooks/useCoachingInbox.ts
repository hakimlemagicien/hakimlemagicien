import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCoachingUnreadCount,
  fetchMyCoachingNotifications,
  watchCoachingUpdates,
} from "@/lib/platform/coaching-messaging-api";

export const COACHING_UNREAD_QUERY_KEY = ["coaching", "unread-count"] as const;
export const COACHING_NOTIFICATIONS_QUERY_KEY = ["coaching", "notifications"] as const;

let inboxWatchBound = false;

function bindInboxWatch(queryClient: ReturnType<typeof useQueryClient>) {
  if (inboxWatchBound) return;
  inboxWatchBound = true;
  watchCoachingUpdates(() => {
    void queryClient.invalidateQueries({ queryKey: COACHING_UNREAD_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: COACHING_NOTIFICATIONS_QUERY_KEY });
  }, 60_000);
}

export function useCoachingInbox({ loadItems = false } = {}) {
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: COACHING_UNREAD_QUERY_KEY,
    queryFn: async () => {
      try {
        return await fetchCoachingUnreadCount();
      } catch {
        return 0;
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const itemsQuery = useQuery({
    queryKey: COACHING_NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      try {
        const items = await fetchMyCoachingNotifications();
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    },
    enabled: loadItems,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    bindInboxWatch(queryClient);
  }, [queryClient]);

  return {
    count: countQuery.data ?? 0,
    items: itemsQuery.data ?? [],
    refresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: COACHING_UNREAD_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: COACHING_NOTIFICATIONS_QUERY_KEY }),
      ]);
    },
  };
}
