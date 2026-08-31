import { useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { DiscoverHomeFeed } from "@/components/platform/discover/DiscoverHomeFeed";
import {
  DiscoverFeedSkeleton,
  DiscoverHeader,
  DiscoverOfflineBanner,
  DiscoverSearchBar,
} from "@/components/platform/discover/DiscoverShared";
import { useDiscoverFeed } from "@/hooks/useDiscoverExperience";
import { useOnlineStatus } from "@/hooks/useNutritionPlan";
import { type DiscoverContentItem } from "@/lib/platform/discover-content";

export const Route = createFileRoute("/_platform/app/discover/")({
  head: () => ({ meta: [{ title: "اكتشف | MAAKFIT" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const online = useOnlineStatus();
  const { feed, loading } = useDiscoverFeed();

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
      <div className="discover-home-page">
        <DiscoverHeader />
        {!online ? <DiscoverOfflineBanner /> : null}
        <Link to="/app/discover/search" className="block">
          <DiscoverSearchBar value="" onChange={() => undefined} />
        </Link>
        <DiscoverHomeFeed feed={feed} onShare={shareTip} />
      </div>
    </PlatformStack>
  );
}
