import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { HomeDashboardSkeleton } from "@/components/platform/home/HomeDashboardSkeleton";
import { HomeStickyUpgradeFooter } from "@/components/platform/home/HomeStickyUpgradeFooter";
import {
  HomeDiscover,
  HomeHeader,
  HomeOfflineBanner,
  HomePersonalProgramCard,
  HomeSectionError,
  HomeSocialProof,
} from "@/components/platform/home/HomeSections";
import { HomeTodayCard } from "@/components/platform/home/HomeTodayCard";
import { useWaterOptional } from "@/components/platform/water/WaterContext";
import { buildTodayPlan } from "@/lib/platform/home-today";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useAssignedNutritionRuntime } from "@/hooks/useAssignedNutritionRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import { PROFILE_DETAILS_KEY, PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import { fetchMyProfileDetails, fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import {
  buildDiscoverPreviewItems,
  buildNextSession,
  resolveClientFirstName,
  shouldShowActivateCta,
} from "@/lib/platform/home-hub";
import { resolveClientPresentationIdentity } from "@/lib/platform/client-presentation-identity";
import { getWeekdayIdFromDate } from "@/lib/platform/weekly-workout-schedule";
import { isMealSlotUnlockedByEntitlements } from "@/lib/platform/entitlements";
import { hydrateDiscoverFromSupabase } from "@/lib/platform/discover-content-api";
import {
  listHomeDiscoverPreview,
  resolveHomeDiscoverPreview,
  setDiscoverViewerGender,
} from "@/lib/platform/discover-content";

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
  const { displayName, tier, is_paid, features, entitlements, avatarUrl, loading, error, refreshMembership } =
    useMembership();
  const { snapshot: activity } = usePlatformActivity();
  const isOnline = useOnlineStatus();
  const runtimeQuery = useAssignedTrainingRuntime(Boolean(features?.workout_program) && !loading);
  const nutritionRuntimeQuery = useAssignedNutritionRuntime(!loading);
  const continuity = useProgramContinuity(runtimeQuery.data, Boolean(features?.workout_program) && !loading);
  const assignedPlans = continuity.assignedPlans;
  const assignedPlan = assignedPlans?.[continuity.todayId ?? getWeekdayIdFromDate()] ?? null;
  const assignmentReason = !features?.workout_program
    ? undefined
    : runtimeQuery.isError
      ? "error"
      : runtimeQuery.data?.reason;

  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    staleTime: 30_000,
  });
  const profileQuery = useQuery({
    queryKey: PROFILE_DETAILS_KEY,
    queryFn: fetchMyProfileDetails,
    staleTime: 30_000,
  });
  const identityPending = trainingQuery.isPending || profileQuery.isPending;
  const identity = useMemo(
    () =>
      identityPending
        ? null
        : resolveClientPresentationIdentity({
            gender: trainingQuery.data?.answers.gender,
            goalId: trainingQuery.data?.answers.goalId ?? null,
            goalText: trainingQuery.data?.goal ?? profileQuery.data?.goal ?? null,
            goalSources: [trainingQuery.data?.goal, profileQuery.data?.goal],
          }),
    [
      identityPending,
      trainingQuery.data?.answers.gender,
      trainingQuery.data?.answers.goalId,
      trainingQuery.data?.goal,
      profileQuery.data?.goal,
    ],
  );
  const slot = identity?.slot ?? null;
  const gender = slot?.gender;
  const goal = slot?.goal ?? "fitness";
  const clientName = resolveClientFirstName(displayName);
  const viewerGender = gender === "male" || gender === "female" ? gender : null;
  const nextNutritionMeal = useMemo(() => {
    const runtime = nutritionRuntimeQuery.data;
    if (!runtime || runtime.reason !== "ok" || runtime.slots.length === 0) return null;
    const requestedIndex = entitlements.nutrition.fullDay
      ? Math.min(activity.mealsDone, runtime.slots.length - 1)
      : 0;
    const slot = runtime.slots[requestedIndex];
    if (!slot) return null;
    const todayKey = new Date().toISOString().slice(0, 10);
    if (!isMealSlotUnlockedByEntitlements(entitlements, {
      slotId: slot.id,
      slotIndex: requestedIndex,
      dateKey: todayKey,
      todayKey,
    })) return null;
    return { name: slot.name_ar, calories: slot.calories * slot.servings, slotLabel: slot.slot_label };
  }, [activity.mealsDone, entitlements, nutritionRuntimeQuery.data]);

  useEffect(() => {
    setDiscoverViewerGender(viewerGender);
  }, [viewerGender]);

  const discoverQuery = useQuery({
    queryKey: ["home", "discover-preview", viewerGender],
    queryFn: async () => {
      await hydrateDiscoverFromSupabase();
      return listHomeDiscoverPreview(viewerGender);
    },
    staleTime: 30_000,
  });

  const dashboard = useMemo(() => {
    if (loading) return null;
    return {
      session: buildNextSession({
        features,
        activity,
        assignedPlan,
        assignmentReason: runtimeQuery.isLoading ? undefined : assignmentReason,
        workoutCta: continuity.resumeHasProgress ? "استكمل التمرين" : undefined,
        nutritionState: nutritionRuntimeQuery.isLoading
          ? "loading"
          : nutritionRuntimeQuery.isError
            ? "error"
            : nutritionRuntimeQuery.data?.reason === "ok"
              ? "ready"
              : "missing",
        nextNutritionMeal,
      }),
      discover: resolveHomeDiscoverPreview(discoverQuery.data ?? [], buildDiscoverPreviewItems(goal)),
    };
  }, [
    loading,
    goal,
    features,
    activity,
    assignedPlan,
    assignmentReason,
    runtimeQuery.isLoading,
    continuity.decision?.action,
    nutritionRuntimeQuery.isLoading,
    nutritionRuntimeQuery.isError,
    nutritionRuntimeQuery.data?.reason,
    nextNutritionMeal,
    discoverQuery.data,
  ]);

  const water = useWaterOptional();
  const waterTotalMl = water?.state.totalMl ?? activity.waterMl;
  const waterGoalMl = water?.state.goalMl ?? activity.waterGoalMl;
  const todayPlan = useMemo(() => {
    if (!dashboard) return null;
    return buildTodayPlan({
      firstName: clientName,
      gender: identity?.gender ?? trainingQuery.data?.answers.gender ?? null,
      goalLabel: identity?.goalLabel,
      activity,
      session: dashboard.session,
      water: { totalMl: waterTotalMl, goalMl: waterGoalMl },
      nextMealName: nextNutritionMeal?.name ?? null,
    });
  }, [
    dashboard,
    clientName,
    identity?.gender,
    identity?.goalLabel,
    trainingQuery.data?.answers.gender,
    activity,
    waterTotalMl,
    waterGoalMl,
    nextNutritionMeal?.name,
  ]);

  if (loading || identityPending) {
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
          {todayPlan ? <HomeTodayCard plan={todayPlan} glassMl={activity.waterGlassMl} /> : null}
          {dashboard.discover.length > 0 ? <HomeDiscover items={dashboard.discover} /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomeSocialProof /> : null}
          {shouldShowActivateCta(tier, is_paid) ? <HomePersonalProgramCard /> : null}
        </>
      ) : null}

      {shouldShowActivateCta(tier, is_paid) ? <HomeStickyUpgradeFooter /> : null}
    </PlatformStack>
  );
}
