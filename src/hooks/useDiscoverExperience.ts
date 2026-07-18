import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type DiscoverContentFilter,
  type DiscoverContentItem,
  type DiscoverFeed,
  buildDiscoverFeed,
  fetchDiscoverContent,
  fetchDiscoverFeed,
  getDiscoverContentById,
  searchDiscoverContentAsync,
} from "@/lib/platform/discover-content";
import {
  getDiscoverStorageSnapshot,
  subscribeDiscoverStorage,
  toggleDiscoverLike,
  toggleDiscoverSave,
} from "@/lib/platform/discover-storage";
import { isPaidMembershipTier } from "@/lib/platform/membership";
import { useMembership } from "@/hooks/useMembership";

export const DISCOVER_FEED_QUERY_KEY = ["discover", "feed"] as const;
export const discoverContentQueryKey = (slug: string) => ["discover", "content", slug] as const;
export const discoverSearchQueryKey = (query: string, filter: DiscoverContentFilter, categoryId?: string) =>
  ["discover", "search", query, filter, categoryId ?? "all"] as const;

export function useDiscoverFeed() {
  const query = useQuery({
    queryKey: DISCOVER_FEED_QUERY_KEY,
    queryFn: fetchDiscoverFeed,
    staleTime: 60_000,
    placeholderData: buildDiscoverFeed,
  });

  return {
    feed: query.data ?? buildDiscoverFeed(),
    loading: query.isLoading && !query.isFetched,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => query.refetch(),
    isRefreshing: query.isFetching && !query.isLoading,
  };
}

export function useDiscoverContent(slug: string) {
  const query = useQuery({
    queryKey: discoverContentQueryKey(slug),
    queryFn: () => fetchDiscoverContent(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });

  return {
    content: query.data ?? null,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: () => query.refetch(),
  };
}

export function useDiscoverSearch(
  query: string,
  filter: DiscoverContentFilter = "all",
  categoryId?: string,
) {
  const trimmed = query.trim();
  const enabled = trimmed.length > 0;

  const searchQuery = useQuery({
    queryKey: discoverSearchQueryKey(trimmed, filter, categoryId),
    queryFn: () => searchDiscoverContentAsync(trimmed, { filter, categoryId }),
    enabled,
    staleTime: 30_000,
  });

  return {
    results: searchQuery.data ?? [],
    loading: enabled && searchQuery.isFetching,
    error: searchQuery.error instanceof Error ? searchQuery.error.message : null,
  };
}

export function useDiscoverStorageState() {
  const [snapshot, setSnapshot] = useState(getDiscoverStorageSnapshot);

  useEffect(() => subscribeDiscoverStorage(() => setSnapshot(getDiscoverStorageSnapshot())), []);

  return snapshot;
}

export function useDiscoverAccess() {
  const { tier } = useMembership();
  const canAccessPremium = isPaidMembershipTier(tier);

  const checkAccess = useCallback(
    (item: DiscoverContentItem) => {
      if (item.accessLevel === "free") return { allowed: true, requiresUpgrade: false };
      if (canAccessPremium) return { allowed: true, requiresUpgrade: false };
      return { allowed: false, requiresUpgrade: true };
    },
    [canAccessPremium],
  );

  return { canAccessPremium, checkAccess };
}

export function useDiscoverSavedItems() {
  const { savedIds } = useDiscoverStorageState();

  return useMemo(() => {
    const items = savedIds
      .map((id) => getDiscoverContentById(id))
      .filter((item): item is DiscoverContentItem => Boolean(item));
    return items;
  }, [savedIds]);
}

export function useDiscoverInteractions() {
  const queryClient = useQueryClient();
  const { savedIds, likedIds } = useDiscoverStorageState();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: DISCOVER_FEED_QUERY_KEY });
  };

  return {
    savedIds,
    likedIds,
    isSaved: (id: string) => savedIds.includes(id),
    isLiked: (id: string) => likedIds.includes(id),
    toggleSave: (id: string) => {
      toggleDiscoverSave(id);
      invalidate();
    },
    toggleLike: (id: string) => {
      toggleDiscoverLike(id);
    },
  };
}

export type DiscoverSectionKey = keyof DiscoverFeed;

export function useDiscoverSectionErrors() {
  const [errors, setErrors] = useState<Partial<Record<DiscoverSectionKey, string>>>({});

  const setSectionError = (key: DiscoverSectionKey, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (!message) delete next[key];
      else next[key] = message;
      return next;
    });
  };

  return { errors, setSectionError };
}
