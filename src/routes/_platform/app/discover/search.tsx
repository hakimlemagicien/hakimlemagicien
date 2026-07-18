import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { DiscoverContentListItem } from "@/components/platform/discover/DiscoverCards";
import {
  DISCOVER_FILTER_LABELS,
  DiscoverEmptyState,
  DiscoverHeader,
  DiscoverSearchBar,
  useDebouncedValue,
} from "@/components/platform/discover/DiscoverShared";
import { useDiscoverSearch } from "@/hooks/useDiscoverExperience";
import {
  type DiscoverContentFilter,
  getDiscoverCategoryBySlug,
  searchDiscoverContent,
} from "@/lib/platform/discover-content";
import {
  addDiscoverSearchQuery,
  clearDiscoverSearchHistory,
  getDiscoverStorageSnapshot,
} from "@/lib/platform/discover-storage";
import { cn } from "@/lib/utils";

type SearchSearch = {
  category?: string;
};

export const Route = createFileRoute("/_platform/app/discover/search")({
  validateSearch: (search: Record<string, unknown>): SearchSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  head: () => ({ meta: [{ title: "بحث | اكتشف" }] }),
  component: DiscoverSearchPage,
});

const FILTERS: DiscoverContentFilter[] = [
  "all",
  "video",
  "article",
  "recipe",
  "success_story",
  "challenge",
  "daily_tip",
];

function DiscoverSearchPage() {
  const { category: categorySlug } = Route.useSearch();
  const category = categorySlug ? getDiscoverCategoryBySlug(categorySlug) : undefined;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DiscoverContentFilter>("all");
  const debounced = useDebouncedValue(query, 400);
  const { results, loading, error } = useDiscoverSearch(debounced, filter, category?.id);
  const history = useMemo(() => getDiscoverStorageSnapshot().searchHistory, [debounced, filter]);

  const displayResults = debounced.trim()
    ? results
    : category
      ? searchDiscoverContent("", { categoryId: category.id, filter })
      : [];

  const submitSearch = () => {
    if (query.trim()) addDiscoverSearchQuery(query);
  };

  return (
    <PlatformStack>
      <div className="space-y-4 pb-6">
        <DiscoverHeader title="البحث" backTo="/app/discover" />
        <DiscoverSearchBar
          value={query}
          onChange={setQuery}
          onSubmit={submitSearch}
          autoFocus
        />

        {category ? (
          <p className="px-0.5 text-xs font-bold text-primary">
            تصنيف: {category.name}
          </p>
        ) : null}

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-[11px] font-black",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {DISCOVER_FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {!debounced.trim() && history.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-xs font-black text-foreground">عمليات البحث الأخيرة</p>
              <button
                type="button"
                onClick={clearDiscoverSearchHistory}
                className="text-[11px] font-bold text-primary"
              >
                مسح
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <DiscoverEmptyState
            title="تعذر إكمال البحث. حاول مجدداً."
            description="تحقق من الاتصال أو جرّب كلمة أخرى."
          />
        ) : loading && debounced.trim() ? (
          <p className="px-0.5 text-xs font-bold text-muted-foreground">جاري البحث...</p>
        ) : displayResults.length ? (
          <div className="space-y-3">
            {displayResults.map((item) => (
              <DiscoverContentListItem key={item.id} item={item} />
            ))}
          </div>
        ) : debounced.trim() || category ? (
          <DiscoverEmptyState
            title="لم نجد محتوى مطابقاً لبحثك."
            description="جرّب كلمة أخرى، أزل الفلاتر، أو تصفّح التصنيفات."
          />
        ) : null}
      </div>
    </PlatformStack>
  );
}
