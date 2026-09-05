import { ExercisePlayerView } from "@/components/platform/workout/ExercisePlayerView";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWorkoutPlayer } from "@/hooks/useWorkoutPlayer";
import { useWorkoutDaySession } from "@/hooks/useTodayWorkout";
import { useMembership } from "@/hooks/useMembership";
import {
  isExerciseUnlockedByEntitlements,
  isTrainingPreviewMode,
} from "@/lib/platform/entitlements";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import { useFreeTrainingStrategyPreview } from "@/hooks/useFreeTrainingStrategyPreview";
import { PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import { runtimeToWeekdayPlans } from "@/lib/platform/assigned-program-api";
import { toProgressionRecoveryHold } from "@/lib/platform/continuity";
import {
  getWeekdayIdFromDate,
  resolveWeekdayPlan,
  type WeekdayId,
} from "@/lib/platform/weekly-workout-schedule";
import { canAccessExerciseLibrary } from "@/lib/platform/exercise-library-access";
import { TRAINING_PRODUCT_COPY } from "@/lib/platform/training-product-copy";
import { ProgramPreparationHoldCard } from "@/components/platform/workout/ProgramPreparationHoldCard";
import { useProgramPreparationHold } from "@/hooks/useProgramPreparationHold";
import { isLocalProgramHoldPreview } from "@/lib/platform/program-preparation-hold";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Lock } from "lucide-react";

type ExercisePlayerSearch = {
  exerciseId?: string;
  index?: number;
  day?: WeekdayId;
};

const WEEKDAY_IDS: WeekdayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseDayId(value: unknown): WeekdayId {
  if (typeof value === "string" && WEEKDAY_IDS.includes(value as WeekdayId)) {
    return value as WeekdayId;
  }
  return getWeekdayIdFromDate();
}

export const Route = createFileRoute("/_platform/app/program/workout/exercise")({
  head: () => ({ meta: [{ title: "تمرين الحصة | MAAKFIT" }] }),
  validateSearch: (search: Record<string, unknown>): ExercisePlayerSearch => ({
    exerciseId: typeof search.exerciseId === "string" ? search.exerciseId : undefined,
    index:
      typeof search.index === "number"
        ? search.index
        : typeof search.index === "string"
          ? Number.parseInt(search.index, 10) || 0
          : 0,
    day: parseDayId(search.day),
  }),
  component: ExercisePlayerPage,
});

function ExercisePlayerPage() {
  const { features, entitlements, is_paid } = useMembership();
  const { openUpgradeWithContext } = useUpgradeFlow();
  const { userId } = usePlatformActivity();
  const hasWorkoutProgram = features.workout_program;
  const freePreview = isTrainingPreviewMode(entitlements);
  const { exerciseId, index = 0, day = getWeekdayIdFromDate() } = Route.useSearch();
  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    staleTime: 30_000,
  });
  const runtimeQuery = useAssignedTrainingRuntime(hasWorkoutProgram);
  const assignedOk = hasWorkoutProgram && runtimeQuery.data?.reason === "ok";
  const { hold, loading: holdLoading } = useProgramPreparationHold({
    coachAssigned: assignedOk,
  });
  const freeStrategyPreviewQuery = useFreeTrainingStrategyPreview({
    enabled: freePreview && !hasWorkoutProgram && !hold.active,
    userId,
    training: trainingQuery.data ?? undefined,
  });
  const continuity = useProgramContinuity(runtimeQuery.data, hasWorkoutProgram);
  const runtimeFailed =
    hasWorkoutProgram &&
    !runtimeQuery.isLoading &&
    (runtimeQuery.isError || (runtimeQuery.isFetched && runtimeQuery.data?.reason !== "ok"));
  const sessionPilot = canAccessExerciseLibrary() && runtimeFailed;
  const assignedPlans =
    assignedOk
      ? day === continuity.todayId
        ? continuity.assignedPlans
        : runtimeToWeekdayPlans(runtimeQuery.data)
      : null;
  const previewPlans = hasWorkoutProgram ? assignedPlans : freeStrategyPreviewQuery.data ?? null;
  const plan = previewPlans
    ? previewPlans[day] ?? resolveWeekdayPlan(day, true, previewPlans)
    : resolveWeekdayPlan(day, hasWorkoutProgram && !sessionPilot);
  const sessionQuery = useWorkoutDaySession(
    !hold.active && (freePreview || previewPlans || sessionPilot) && !plan.isRestDay ? plan : null,
  );

  const exercises = sessionQuery.data?.exercises ?? [];
  const meta = sessionQuery.data?.meta ?? {
    points: 0,
    durationMin: 0,
    calories: 0,
    streakDays: 0,
    totalExercises: 0,
  };

  const todayId = getWeekdayIdFromDate();
  const freeDayFullyLocked = freePreview && day !== todayId;
  const prescribedExerciseCount = plan.prescriptions?.length ?? 0;

  if (holdLoading || hold.active) {
    return (
      <div className="px-0 py-2">
        {holdLoading && !hold.active ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground">{TRAINING_PRODUCT_COPY.holdTitle}</p>
          </div>
        ) : (
          <ProgramPreparationHoldCard
            hold={hold}
            showUpgrade={!is_paid || isLocalProgramHoldPreview()}
            onUpgrade={() =>
              openUpgradeWithContext("TRAINING", TRAINING_PRODUCT_COPY.holdUpgradeTitle)
            }
          />
        )}
      </div>
    );
  }

  if (hasWorkoutProgram && runtimeQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground">جاري تحميل البرنامج…</p>
      </div>
    );
  }

  if (runtimeFailed && !sessionPilot) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-black text-foreground">
          {runtimeQuery.isError
            ? "تعذر تحميل البرنامج."
            : runtimeQuery.data?.reason === "no_program"
              ? TRAINING_PRODUCT_COPY.strategySetupTitle
              : "البرنامج غير متاح لهذه الحصة"}
        </p>
        <p className="text-xs text-muted-foreground">
          {runtimeQuery.data?.reason === "no_program"
            ? TRAINING_PRODUCT_COPY.strategySetupBody
            : "لا تُعرض تمارين افتراضية مكان برنامجك."}
        </p>
        <Link
          to="/app/program/workout"
          className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground"
        >
          {runtimeQuery.data?.reason === "no_program"
            ? TRAINING_PRODUCT_COPY.strategySetupCta
            : "العودة لتمرين اليوم"}
        </Link>
      </div>
    );
  }

  if (freePreview && !hasWorkoutProgram && freeStrategyPreviewQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground">{TRAINING_PRODUCT_COPY.freePreviewLoadingTitle}</p>
      </div>
    );
  }

  if (freePreview && (freeDayFullyLocked || !isExerciseUnlockedByEntitlements(entitlements, index, { isToday: true }))) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Lock className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-sm font-black text-foreground">أكمل حصتك التدريبية</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {freeDayFullyLocked
              ? TRAINING_PRODUCT_COPY.exerciseLockedTodayOnly
              : prescribedExerciseCount > 1
                ? TRAINING_PRODUCT_COPY.exerciseLockedOnePerDay(prescribedExerciseCount)
                : TRAINING_PRODUCT_COPY.upgradeSheetTraining}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            openUpgradeWithContext("TRAINING", "بقية التمارين مختارة حسب هدفك ومستواك.")
          }
          className="rounded-xl cta-gradient px-5 py-2.5 text-xs font-black text-white shadow-cta"
        >
          عرض الباقات
        </button>
        <Link
          to="/app/program/workout"
          className="text-xs font-bold text-primary underline-offset-2 hover:underline"
        >
          العودة لتمرين اليوم
        </Link>
      </div>
    );
  }

  const resolvedIndex = exerciseId
    ? exercises.findIndex((item) => item.id === exerciseId || item.external_id === exerciseId)
    : index;
  const initialIndex = resolvedIndex >= 0 ? resolvedIndex : 0;

  const player = useWorkoutPlayer(exercises, meta, initialIndex, {
    runtimeMode: assignedOk ? "v2" : "legacy_free",
    assignmentId: assignedOk ? exercises[0]?.assignmentId ?? null : null,
    recoveryHold: continuity.decision ? toProgressionRecoveryHold(continuity.decision) : "NORMAL",
    prescriptionState: continuity.decision?.prescription_state ?? null,
    progressionStrategy: runtimeQuery.data?.assignment?.progression_strategy ?? null,
  });

  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground">جاري تحميل حصة اليوم…</p>
      </div>
    );
  }

  if (sessionQuery.isError || exercises.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-black text-foreground">تعذّر تحميل تمارين الحصة</p>
        <p className="text-xs text-muted-foreground">تأكد من اتصالك ثم حاول مرة أخرى.</p>
        <Link
          to="/app/program/workout"
          className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground"
        >
          العودة لتمرين اليوم
        </Link>
      </div>
    );
  }

  return <ExercisePlayerView player={player} />;
}
