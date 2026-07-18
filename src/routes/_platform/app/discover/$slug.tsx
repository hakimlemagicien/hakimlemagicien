import { useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import {
  DiscoverContentDetailView,
  DiscoverUnavailableState,
} from "@/components/platform/discover/DiscoverContentDetail";
import { DiscoverFeedSkeleton } from "@/components/platform/discover/DiscoverShared";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import {
  useDiscoverAccess,
  useDiscoverContent,
  useDiscoverInteractions,
} from "@/hooks/useDiscoverExperience";
import { useOnlineStatus } from "@/hooks/useNutritionPlan";
import { getRelatedDiscoverContent } from "@/lib/platform/discover-content";
import { isChallengeJoined } from "@/lib/platform/discover-storage";

export const Route = createFileRoute("/_platform/app/discover/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} | اكتشف` }] }),
  component: DiscoverContentPage,
});

function DiscoverContentPage() {
  const { slug } = Route.useParams();
  const online = useOnlineStatus();
  const { content, loading } = useDiscoverContent(slug);
  const { checkAccess } = useDiscoverAccess();
  const { openUpgrade } = useUpgradeFlow();
  const { isSaved, isLiked, toggleSave, toggleLike } = useDiscoverInteractions();

  const share = useCallback(async () => {
    if (!content) return;
    const payload = {
      title: content.title,
      text: content.shortDescription,
      url: `${window.location.origin}/app/discover/${content.slug}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
      } catch {
        /* cancelled */
      }
    }
  }, [content]);

  if (loading) {
    return (
      <PlatformStack>
        <DiscoverFeedSkeleton />
      </PlatformStack>
    );
  }

  if (!content) {
    return (
      <PlatformStack>
        <DiscoverUnavailableState reason={online ? "missing" : "offline"} />
      </PlatformStack>
    );
  }

  const access = checkAccess(content);
  const related = getRelatedDiscoverContent(content);

  return (
    <PlatformStack>
      <DiscoverContentDetailView
        content={content}
        related={related}
        saved={isSaved(content.id)}
        liked={isLiked(content.id)}
        joinedChallenge={isChallengeJoined(content.id)}
        locked={access.requiresUpgrade}
        onToggleSave={() => toggleSave(content.id)}
        onToggleLike={() => toggleLike(content.id)}
        onShare={share}
        onUpgrade={() =>
          openUpgrade("افتح محتوى Premium داخل اكتشف — تعلم واستكشف بدون قيود.")
        }
      />
    </PlatformStack>
  );
}
