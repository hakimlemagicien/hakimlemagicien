import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HomeDashboardSkeleton } from "@/components/platform/home/HomeDashboardSkeleton";
import { HomeMemberResults } from "@/components/platform/home/HomeMemberResults";
import { HomePersonalNutritionCard } from "@/components/platform/home/HomePersonalNutritionCard";
import { HomeStickyUpgradeFooter } from "@/components/platform/home/HomeStickyUpgradeFooter";
import {
  HomeDailySnapshot,
  HomeDiscover,
  HomeHeader,
  HomeHeroCard,
  HomeOfflineBanner,
  HomePersonalProgramCard,
  HomeSectionError,
  HomeStreakAchievementRow,
  HomeTodaysMission,
} from "@/components/platform/home/HomeSections";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import {
  buildDailySnapshot,
  buildDiscoverPreviewItems,
  buildHeroState,
  buildLastAchievement,
  buildStreakWeek,
  buildTodaysMission,
  resolveClientFirstName,
  shouldShowActivateCta,
} from "@/lib/platform/home-hub";
import { readHomeGoalContext, resolveHeroGoalImage } from "@/lib/platform/hero-goal-images";

export const Route = createFileRoute("/_platform/app/")({
  head: () => ({ meta: [{ title: "الرئيسية | Hakim Platform" }] }),
  component: PlatformHomePage,
});

function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return online;
}

function PlatformHomePage() {
  const { displayName, tier, is_paid, features, avatarUrl, loading, error, refreshMembership } =
    useMembership();
  const { snapshot: activity } = usePlatformActivity();
  const count = activity.activityStreak;
  const hakimPoints = activity.hakimPoints;
  const isOnline = useOnlineStatus();

  const { gender, goalId, goal } = readHomeGoalContext("تنشيف");
  const clientName = resolveClientFirstName(displayName);

  const dashboard = useMemo(() => {
    if (loading) return null;
    return {
      hero: buildHeroState({
        displayName,
        goal,
        streak: count,
        hakimPoints,
        heroImage: resolveHeroGoalImage({ goal, gender, goalId }),
        activity,
      }),
      snapshot: buildDailySnapshot({ features, activity }),
      mission: features.workout_program ? buildTodaysMission({ features, activity }) : null,
      week: buildStreakWeek(count),
      achievement: buildLastAchievement(activity),
      discover: buildDiscoverPreviewItems(goal),
    };
  }, [loading, displayName, goal, goalId, gender, features, count, hakimPoints, activity]);

  if (loading) {
    return (
      <PlatformStack>
        <HomeDashboardSkeleton />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack>
      {!isOnline ? <HomeOfflineBanner /> : null}

      {error ? (
        <HomeSectionError message="تعذّر تحميل بيانات العضوية." onRetry={() => void refreshMembership()} />
      ) : null}

      {dashboard ? (
        <>
          <HomeHeader name={clientName} avatarUrl={avatarUrl} tier={tier} />
          <HomeHeroCard hero={dashboard.hero} />
          <HomeDailySnapshot items={dashboard.snapshot} />
          {dashboard.discover.length > 0 ? <HomeDiscover items={dashboard.discover} /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomePersonalProgramCard /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomeMemberResults /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomePersonalNutritionCard /> : null}
          {dashboard.mission ? <HomeTodaysMission mission={dashboard.mission} /> : null}
          {!shouldShowActivateCta(tier, is_paid) ? (
            <HomeStreakAchievementRow
              streak={count}
              week={dashboard.week}
              achievement={dashboard.achievement}
            />
          ) : null}
        </>
      ) : null}

      {shouldShowActivateCta(tier, is_paid) ? <HomeStickyUpgradeFooter /> : null}
    </PlatformStack>
  );
}
