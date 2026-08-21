import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HomeDashboardSkeleton } from "@/components/platform/home/HomeDashboardSkeleton";
import { HomeStickyUpgradeFooter } from "@/components/platform/home/HomeStickyUpgradeFooter";
import {
  HomeCoachTip,
  HomeDailySnapshot,
  HomeDiscover,
  HomeHeader,
  HomeHeroCard,
  HomeNextSession,
  HomeOfflineBanner,
  HomePersonalProgramCard,
  HomeSectionError,
  HomeSocialProof,
} from "@/components/platform/home/HomeSections";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import {
  buildDailySnapshot,
  buildDiscoverPreviewItems,
  buildHeroState,
  buildMessageOfDay,
  buildNextSession,
  resolveClientFirstName,
  shouldShowActivateCta,
} from "@/lib/platform/home-hub";
import { readHomeGoalContext, resolveHeroGoalImage } from "@/lib/platform/hero-goal-images";
import { getWeekdayIdFromDate } from "@/lib/platform/weekly-workout-schedule";

export const Route = createFileRoute("/_platform/app/")({
  head: () => ({ meta: [{ title: "الرئيسية | MAAKFIT" }] }),
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
  const runtimeQuery = useAssignedTrainingRuntime(Boolean(features?.workout_program) && !loading);
  const continuity = useProgramContinuity(runtimeQuery.data, Boolean(features?.workout_program) && !loading);
  const assignedPlans = continuity.assignedPlans;
  const assignedPlan = assignedPlans?.[continuity.todayId ?? getWeekdayIdFromDate()] ?? null;
  const assignmentReason = !features?.workout_program
    ? undefined
    : runtimeQuery.isError
      ? "error"
      : runtimeQuery.data?.reason;

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
        features,
        activity,
      }),
      snapshot: buildDailySnapshot({ features, activity }),
      coach: buildMessageOfDay({ displayName, streak: count, goal, activity }),
      session: buildNextSession({
        features,
        activity,
        assignedPlan,
        assignmentReason: runtimeQuery.isLoading ? undefined : assignmentReason,
        workoutCta: continuity.decision?.action === "RESUME_SESSION" ? "استكمل التمرين" : undefined,
      }),
      discover: buildDiscoverPreviewItems(goal),
    };
  }, [
    loading,
    displayName,
    goal,
    goalId,
    gender,
    features,
    count,
    hakimPoints,
    activity,
    assignedPlan,
    assignmentReason,
    runtimeQuery.isLoading,
    continuity.decision?.action,
  ]);

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
          <HomeNextSession session={dashboard.session} />
          <HomeCoachTip message={dashboard.coach} />
          {dashboard.discover.length > 0 ? <HomeDiscover items={dashboard.discover} /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomeSocialProof /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomePersonalProgramCard /> : null}
        </>
      ) : null}

      {shouldShowActivateCta(tier, is_paid) ? <HomeStickyUpgradeFooter /> : null}
    </PlatformStack>
  );
}
