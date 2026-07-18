import { useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { DiscoverFeedSections } from "@/components/platform/discover/DiscoverSections";
import {
  DiscoverFeedSkeleton,
  DiscoverHeader,
  DiscoverOfflineBanner,
  DiscoverSearchBar,
} from "@/components/platform/discover/DiscoverShared";
import {
  useDiscoverFeed,
  useDiscoverInteractions,
} from "@/hooks/useDiscoverExperience";
import { useOnlineStatus } from "@/hooks/useNutritionPlan";
import { DISCOVER_CATEGORIES, type DiscoverContentItem } from "@/lib/platform/discover-content";

export const Route = createFileRoute("/_platform/app/discover")({
  head: () => ({ meta: [{ title: "اكتشف | Hakim Platform" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const online = useOnlineStatus();
  const { feed, loading, refresh, isRefreshing } = useDiscoverFeed();
  const { savedIds, toggleSave } = useDiscoverInteractions();

  const shareTip = useCallback(async (item: DiscoverContentItem) => {
    const payload = {
      title: item.title,
      text: item.shortDescription,
      url: `${window.location.origin}/app/discover/${item.slug}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch {
        /* user cancelled */
      }
    }
  }, []);

  if (loading) {
    return (
      <PlatformStack>
        <DiscoverFeedSkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack>
      <div className="space-y-4">
        <DiscoverHeader />

        <div className="flex items-center justify-end gap-2 px-0.5">
          <Link to="/app/discover/saved" className="text-[11px] font-bold text-primary">
            المحفوظات
          </Link>
          <button
            type="button"
            aria-label="تحديث المحتوى"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground"
          >
            <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            تحديث
          </button>
        </div>

        {!online ? <DiscoverOfflineBanner /> : null}

        <Link to="/app/discover/search" className="block">
          <DiscoverSearchBar value="" onChange={() => undefined} />
        </Link>

        <DiscoverFeedSections
          feed={feed}
          categories={DISCOVER_CATEGORIES.filter((c) => c.status === "active")}
          savedIds={savedIds}
          onToggleSave={toggleSave}
          onShareTip={shareTip}
        />
      </div>
    </PlatformStack>
  );
}
