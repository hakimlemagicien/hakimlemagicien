import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Crown,
  Dumbbell,
  Lock,
  Star,
  Target,
} from "lucide-react";
import { PlatformHeaderActions } from "@/components/platform/shared/PlatformHeaderActions";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { WorkoutMotivationCta } from "@/components/platform/workout/WorkoutMotivationCta";
import { ExerciseThumbnail } from "@/components/platform/exercises/ExerciseThumbnail";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWorkoutDaySession } from "@/hooks/useTodayWorkout";
import { useMembership } from "@/hooks/useMembership";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import {
  buildWeeklySchedule,
  formatWorkoutDayLabel,
  getWeekdayIdFromDate,
  isFreeUnlockedExerciseIndex,
  resolveWeekdayPlan,
  type WeekDayEntry,
  type WeekdayId,
} from "@/lib/platform/weekly-workout-schedule";
import {
  formatExerciseVolume,
  type WorkoutSessionExercise,
} from "@/lib/platform/workout-session";
import { loadWorkoutProgress } from "@/lib/platform/workout-progress-storage";
import { cn } from "@/lib/utils";
import muscleAnatomyChestBicepsImg from "@/assets/muscle-anatomy-chest-biceps.png";
import workoutGoalHeroTrainerImg from "@/assets/workout-goal-hero-trainer.png";

export const Route = createFileRoute("/_platform/app/program/workout/")({
  head: () => ({ meta: [{ title: "تمرين اليوم | Hakim Platform" }] }),
  component: WorkoutDayPage,
});

type SessionExerciseStatus = "active" | "done" | "pending";

type SessionExerciseView = WorkoutSessionExercise & {
  status: SessionExerciseStatus;
  completedSets: number;
};

function buildSessionExerciseViews(
  exercises: WorkoutSessionExercise[],
  applyStoredProgress: boolean,
): SessionExerciseView[] {
  const stored = applyStoredProgress ? loadWorkoutProgress(exercises.length) : null;
  return exercises.map((exercise, index) => {
    const saved = stored?.[index];
    return {
      ...exercise,
      completedSets: saved?.completedSets ?? 0,
      status: saved?.status ?? (index === 0 ? "active" : "pending"),
    };
  });
}

const WORKOUT_CARD_BLEED =
  "-mx-[var(--platform-gutter)] w-[calc(100%+2*var(--platform-gutter))]";

/** Visual gap ~11px between sections: stack gap (16px) minus 5px pull step. */
const WORKOUT_SECTION_PULL = {
  hero: "-translate-y-[20px]",
  step1: "-translate-y-[25px]",
} as const;

const workoutType = {
  cardTitle: "text-[10px] font-black leading-none text-foreground",
  cardAction: "text-[8px] font-bold leading-none text-primary",
  cardLabel: "text-[8px] font-bold leading-none text-muted-foreground",
  cardMeta: "text-[8px] leading-none text-muted-foreground",
  cardBody: "text-[8px] leading-snug text-muted-foreground",
  cardValue: "text-[10px] font-black leading-none text-foreground",
  cardNumber: "text-sm font-black leading-none text-foreground",
};

function WorkoutLockedPreviewOverlay({
  active,
  onUnlockClick,
  message = "محتوى مقفل — فعّل برنامجك",
  intensity = "medium",
}: {
  active: boolean;
  onUnlockClick: () => void;
  message?: string;
  intensity?: "light" | "medium" | "strong";
}) {
  if (!active) return null;

  return (
    <button
      type="button"
      onClick={onUnlockClick}
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] transition active:scale-[0.995]",
        intensity === "strong" && "bg-white/62 backdrop-blur-[2px]",
        intensity === "medium" && "bg-white/48 backdrop-blur-[1px]",
        intensity === "light" && "bg-white/28",
      )}
      aria-label={message}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/12 shadow-[0_8px_20px_-10px_rgba(249,115,22,0.45)] ring-1 ring-primary/30">
        <Lock className="h-4 w-4 text-primary" strokeWidth={2.3} />
      </span>
      <span className="rounded-full border border-border/60 bg-card/95 px-3 py-1 text-[9px] font-black text-foreground shadow-sm">
        {message}
      </span>
    </button>
  );
}

function WeekDayButton({
  entry,
  isSelected,
  onSelect,
}: {
  entry: WeekDayEntry;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const kindLabel = entry.isRestDay ? "راحة" : "تمرين";

  return (
    <button
      type="button"
      data-preview-safe
      aria-pressed={isSelected}
      aria-label={`${entry.dayName} ${entry.dateLabel}`}
      onClick={onSelect}
      className="relative z-[1] flex w-full flex-col items-center gap-1.5 pt-0.5 transition active:scale-[0.98]"
    >
      <p className="h-[10px] w-full truncate text-center text-[9px] font-bold leading-none text-muted-foreground">
        {entry.shortName}
      </p>
      <span className="relative z-[1] grid h-9 w-9 place-items-center">
        <span
          className={cn(
            "grid place-items-center rounded-full font-black leading-none",
            isSelected
              ? "h-9 w-9 bg-primary text-[13px] text-white shadow-[0_4px_10px_-4px_rgba(249,115,22,0.7)]"
              : "h-8 w-8 border-[1.5px] border-primary bg-card text-[12px] text-foreground",
          )}
        >
          {entry.dateLabel}
        </span>
      </span>
      <p
        className={cn(
          "text-[8px] font-bold leading-none",
          isSelected ? "text-primary" : "text-foreground",
        )}
      >
        {kindLabel}
      </p>
      <span className="grid h-1.5 place-items-center">
        {isSelected ? (
          <span
            aria-hidden
            className="h-0 w-0 border-x-[4px] border-b-[5px] border-x-transparent border-b-primary"
          />
        ) : null}
      </span>
    </button>
  );
}

function TodayWorkoutStatCell({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
  iconClassName: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-0 py-0.5 text-center">
      <Icon className={cn("h-3 w-3", iconClassName)} strokeWidth={2.1} />
      <p className="mt-0.5 text-[11px] font-black leading-none text-foreground">{value}</p>
      <p className="mt-0.5 text-[7px] font-medium leading-none text-muted-foreground">{label}</p>
    </div>
  );
}

function TodayWorkoutBriefCard({
  dateLabel,
  muscleTitle,
  isRestDay,
  stats,
  lockedPreview = false,
  lockedPreviewIntensity = "medium",
  onLockedClick,
}: {
  dateLabel: string;
  muscleTitle: string;
  isRestDay: boolean;
  stats?: { exercises: number; minutes: number; points: number };
  lockedPreview?: boolean;
  lockedPreviewIntensity?: "light" | "medium" | "strong";
  onLockedClick?: () => void;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)]",
        lockedPreview && lockedPreviewIntensity !== "light" && "opacity-95",
      )}
    >
      <div className="flex items-stretch" dir="rtl">
        <div className="flex w-[40%] max-w-[140px] shrink-0 items-center justify-center self-stretch overflow-hidden border-s border-border/45 bg-gradient-to-b from-muted/20 to-transparent px-1 py-1">
          <img
            src={muscleAnatomyChestBicepsImg}
            alt={isRestDay ? "يوم راحة" : "تشريح عضلي للمجموعة المستهدفة"}
            className={cn(
              "h-full w-full origin-center object-contain object-center",
              isRestDay ? "scale-[1.1] opacity-70" : "scale-[1.32]",
            )}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-3 text-right">
          <p className="-translate-y-px text-[10px] font-medium leading-none text-muted-foreground">
            {isRestDay ? "يوم راحة" : "تمرين اليوم"} • {dateLabel}
          </p>

          <div className="flex flex-1 flex-col items-end justify-center gap-1.5 py-1 translate-x-[50px]">
            <h3 className="text-[17px] font-black leading-[1.12] tracking-tight text-foreground">
              {muscleTitle}
            </h3>
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold leading-none",
                isRestDay ? "bg-muted text-muted-foreground" : "bg-[#E8F5E9] text-[#2E7D32]",
              )}
            >
              {isRestDay ? "استشفاء ومرونة" : "المجموعة العضلية المستهدفة"}
            </span>
          </div>

          {!isRestDay && stats ? (
            <div
              className="grid origin-bottom scale-[1.10] grid-cols-3 divide-x divide-border/55 border-t border-border/50 pt-2"
              dir="rtl"
            >
              <TodayWorkoutStatCell
                icon={Dumbbell}
                value={String(stats.exercises)}
                label="تمارين"
                iconClassName="text-primary"
              />
              <TodayWorkoutStatCell
                icon={Clock3}
                value={String(stats.minutes)}
                label="دقيقة"
                iconClassName="text-success"
              />
              <TodayWorkoutStatCell
                icon={Star}
                value={String(stats.points)}
                label="نقطة"
                iconClassName="fill-amber-400 text-amber-500"
              />
            </div>
          ) : (
            <p className="border-t border-border/50 pt-2 text-[8px] leading-snug text-muted-foreground">
              مشي خفيف أو تمدد كافٍ — عد غداً للتمرين.
            </p>
          )}
        </div>
      </div>

      {lockedPreview && onLockedClick ? (
        <WorkoutLockedPreviewOverlay
          active
          intensity={lockedPreviewIntensity}
          message={
            lockedPreviewIntensity === "light"
              ? "معاينة — فعّل برنامجك للوصول الكامل"
              : "محتوى مقفل — فعّل برنامجك"
          }
          onUnlockClick={onLockedClick}
        />
      ) : null}
    </article>
  );
}

function SessionExercisePathRow({
  index,
  exercise,
  orderIndex,
  dayId,
  freePreview,
  freeDayFullyLocked,
  isLast,
  onLockedClick,
}: {
  index: number;
  exercise: SessionExerciseView;
  orderIndex: number;
  dayId: WeekdayId;
  freePreview: boolean;
  freeDayFullyLocked: boolean;
  isLast: boolean;
  onLockedClick: () => void;
}) {
  const volume = formatExerciseVolume(exercise);
  const isUnlocked =
    !freePreview || (!freeDayFullyLocked && isFreeUnlockedExerciseIndex(orderIndex));
  const isDone = exercise.status === "done";
  const isActive = exercise.status === "active";

  const body = (
    <>
      <span className="relative z-[1] grid w-7 shrink-0 place-items-center">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-black",
            isDone || isActive
              ? "bg-primary text-white shadow-[0_4px_10px_-4px_rgba(249,115,22,0.55)]"
              : "border-[1.5px] border-primary bg-card text-primary",
            isActive && "scale-110",
          )}
        >
          {index}
        </span>
      </span>

      <div
        className={cn(
          "relative aspect-square shrink-0 overflow-hidden rounded-md border bg-card",
          isActive
            ? "size-[88px] border-success/70 ring-2 ring-success/35"
            : "size-[74px] border-border/60",
        )}
      >
        <ExerciseThumbnail
          signedUrl={exercise.thumbnailUrl}
          status={exercise.videoStatus}
          mediaPath={exercise.videoPath}
          alt={exercise.name}
          className={cn("h-full w-full object-cover", !isUnlocked && "opacity-45 saturate-50")}
        />
        {!isUnlocked ? (
          <span className="absolute inset-0 grid place-items-center bg-black/35">
            <Lock className="h-4 w-4 text-white drop-shadow-sm" strokeWidth={2.4} />
          </span>
        ) : null}
      </div>

      <div className={cn("min-w-0 flex-1 text-right", !isUnlocked && "opacity-70")}>
        <p
          className={cn(
            "font-black leading-snug text-foreground",
            isActive ? "text-[13px]" : "text-[12px]",
          )}
        >
          {index}. {exercise.name}
        </p>
        {isActive ? (
          <p className="mt-0.5 text-[10px] font-black text-success">التمرين التالي</p>
        ) : null}
        <p className="mt-0.5 text-[10px] font-medium leading-snug text-muted-foreground">
          {exercise.sets} مجموعات × {volume}
        </p>
        <p className="mt-0.5 text-[10px] font-bold leading-snug text-primary">
          راحة {exercise.restLabel}
        </p>
      </div>

      {!isUnlocked ? (
        <Lock className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
      ) : isDone ? (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success text-white">
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-primary bg-card" />
      )}
    </>
  );

  const rowClass = cn(
    "flex w-full items-center gap-2.5 px-3 py-3 text-right transition",
    !isLast && "border-b border-border/40",
    isUnlocked && "active:bg-muted/25",
    isActive && "relative z-[1] py-3.5",
  );

  if (!isUnlocked) {
    return (
      <button type="button" onClick={onLockedClick} className={rowClass} dir="rtl">
        {body}
      </button>
    );
  }

  return (
    <Link
      to="/app/program/workout/exercise"
      search={{ exerciseId: exercise.id, index: orderIndex, day: dayId }}
      className={rowClass}
      dir="rtl"
    >
      {body}
    </Link>
  );
}

const WORKOUT_PREVIEW_EXERCISE_COUNT = 4;

function SessionExercisesSection({
  exercises,
  dayId,
  freePreview,
  freeDayFullyLocked,
  onLockedClick,
}: {
  exercises: SessionExerciseView[];
  dayId: WeekdayId;
  freePreview: boolean;
  freeDayFullyLocked: boolean;
  onLockedClick: () => void;
}) {
  if (exercises.length === 0) {
    return (
      <div className="space-y-2.5 border-t border-border/45 pt-3.5">
        <h2 className={cn("inline-flex items-center gap-1.5", workoutType.cardTitle)}>
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          تمارين الحصة
        </h2>
        <p className="text-[10px] font-medium text-muted-foreground">
          لا توجد تمارين متاحة في حصة اليوم حالياً.
        </p>
      </div>
    );
  }

  const previewExercises = exercises.slice(0, WORKOUT_PREVIEW_EXERCISE_COUNT);
  const firstExercise = previewExercises[0]!;
  const hasMoreExercises = exercises.length > WORKOUT_PREVIEW_EXERCISE_COUNT;
  const activeIndex = previewExercises.findIndex((item) => item.status !== "done");
  const allDone = activeIndex === -1;
  const currentStep = allDone ? previewExercises.length : Math.max(activeIndex + 1, 1);
  const progressPct = allDone
    ? 100
    : ((currentStep - 0.5) / previewExercises.length) * 100;

  return (
    <div className="space-y-2.5 border-t border-border/45 pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cn("inline-flex items-center gap-1.5", workoutType.cardTitle)}>
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          تمارين الحصة
        </h2>
        {hasMoreExercises && !freePreview ? (
          <Link
            to="/app/program/workout/exercise"
            search={{ exerciseId: firstExercise.id, index: 0, day: dayId }}
            className={cn("inline-flex items-center gap-0.5", workoutType.cardAction)}
          >
            عرض الكل
            <ChevronLeft className="h-3 w-3" />
          </Link>
        ) : freePreview ? (
          <button
            type="button"
            onClick={onLockedClick}
            className={cn("inline-flex items-center gap-0.5", workoutType.cardAction)}
          >
            <Lock className="h-3 w-3" />
            فتح الكل
          </button>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_8px_24px_-14px_rgba(15,23,42,0.14)]">
        <div
          aria-hidden
          className="pointer-events-none absolute top-5 bottom-5 z-0 w-0.5 rounded-full bg-primary/20"
          style={{ insetInlineStart: "25px" }}
        >
          <div
            className="w-full rounded-full bg-primary transition-[height] duration-500 ease-out"
            style={{ height: `${progressPct}%` }}
          />
        </div>

        {previewExercises.map((exercise, exerciseIndex) => (
          <SessionExercisePathRow
            key={exercise.id}
            index={exerciseIndex + 1}
            exercise={exercise}
            orderIndex={exerciseIndex}
            dayId={dayId}
            freePreview={freePreview}
            freeDayFullyLocked={freeDayFullyLocked}
            isLast={exerciseIndex === previewExercises.length - 1}
            onLockedClick={onLockedClick}
          />
        ))}

        {freePreview ? (
          <WorkoutLockedPreviewOverlay
            active={freeDayFullyLocked}
            intensity="strong"
            message="معاينة مقفلة — فعّل برنامجك"
            onUnlockClick={onLockedClick}
          />
        ) : null}
      </div>

      {freePreview ? (
        <p className="text-[9px] font-medium leading-snug text-muted-foreground">
          {freeDayFullyLocked
            ? "🔒 محتوى هذا اليوم للمعاينة فقط — انتقل ليوم اليوم لتجربة التمرين المجاني أو فعّل برنامجك."
            : "🔓 التمرين الأول للصدر متاح اليوم — باقي التمارين مقفلة حتى تفعّل برنامجك."}
        </p>
      ) : null}

      {hasMoreExercises ? (
        <p className="text-center text-[10px] font-medium text-muted-foreground">
          +{exercises.length - WORKOUT_PREVIEW_EXERCISE_COUNT} تمارين إضافية داخل حصة التمرين
        </p>
      ) : null}
    </div>
  );
}

function WorkoutDayPage() {
  const { features, is_paid } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const { userId, snapshot } = usePlatformActivity();
  const hasWorkoutProgram = features.workout_program;
  const freePreview = !hasWorkoutProgram;
  const showPremiumBadge = !is_paid;
  const todayId = getWeekdayIdFromDate();
  const [selectedDayId, setSelectedDayId] = useState<WeekdayId>(todayId);
  const isSelectedToday = selectedDayId === todayId;
  const freeDayFullyLocked = freePreview && !isSelectedToday;
  const lockedReason = freeDayFullyLocked
    ? "فعّل برنامجك الآن لفتح تمارين كل أيام الأسبوع — يمكنك معاينة شكل البرنامج فقط."
    : "فعّل برنامجك الآن لفتح كل تمارين الأسبوع — التمرين الأول للصدر متاح للمعاينة.";

  const weeklySchedule = useMemo(
    () => buildWeeklySchedule({ userId, freeMember: freePreview }),
    [userId, freePreview, snapshot.activityStreak, snapshot.hakimPoints, snapshot.workoutDone],
  );

  const selectedEntry =
    weeklySchedule.find((entry) => entry.id === selectedDayId) ?? weeklySchedule[0]!;
  const selectedPlan = resolveWeekdayPlan(selectedDayId, hasWorkoutProgram);
  const sessionQuery = useWorkoutDaySession(selectedDayId, hasWorkoutProgram);
  const sessionExercises = sessionQuery.data?.exercises ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const applyStoredProgress = selectedEntry.dateKey === todayKey;
  const sessionViews = buildSessionExerciseViews(sessionExercises, applyStoredProgress);
  const workoutStats = {
    exercises: sessionExercises.length,
    minutes: selectedPlan.durationMin,
    points: selectedPlan.points,
  };
  const selectedDayLabel = formatWorkoutDayLabel(selectedEntry.calendarDate, selectedEntry.dayName);
  const overallProgress = snapshot.overallProgressPct;

  return (
    <PlatformStack>
        <header className="flex h-[44px] items-center justify-between px-1 py-1">
          <button
            type="button"
            aria-label="التقويم"
            className="grid h-9 w-9 shrink-0 translate-x-[10px] -translate-y-[10px] place-items-center rounded-2xl border border-border/70 bg-card text-foreground shadow-sm"
          >
            <CalendarDays className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-black tracking-tight text-foreground">التمارين برنامجك</h1>
          <PlatformHeaderActions
            className="-translate-x-[14px] -translate-y-[7px]"
            actionClassName="relative grid h-10 w-10 place-items-center text-foreground"
          />
        </header>

        <section
          className={cn(
            WORKOUT_CARD_BLEED,
            "relative shrink-0 overflow-hidden rounded-[28px] border border-amber-200/45 bg-card shadow-[0_16px_44px_-18px_rgba(180,120,40,0.38),0_10px_28px_-14px_rgba(15,23,42,0.2)]",
            WORKOUT_SECTION_PULL.hero,
          )}
          style={{ height: "196px" }}
        >
          <div className="relative flex h-full bg-white" dir="ltr">
            <div className="relative z-20 flex w-1/2 min-w-0 flex-col justify-between bg-white px-3.5 py-3.5" dir="rtl">
              <div className="min-h-0 text-right">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F97316]">
                  <Target className="h-3.5 w-3.5 text-[#F97316]" strokeWidth={2.4} />
                  هدفك
                </p>
                <h2 className="mt-1 text-[17px] font-black leading-[1.15] tracking-tight text-[#1F2937]">
                  خسارة الدهون
                </h2>
                <p className="text-[17px] font-black leading-[1.15] tracking-tight text-[#1F2937]">
                  وبناء جسم متناسق
                </p>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-[#6B7280]">
                  برنامجك مصمم خصيصاً لك بناءً على بياناتك وسيتم تحديثه كل أسبوع.
                </p>
              </div>

              <div className="mt-2 shrink-0 text-right" dir="ltr">
                <p className="text-[10px] font-semibold text-[#1F2937]">التقدم العام</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="shrink-0 text-[15px] font-black leading-none text-[#1F2937]">
                    {overallProgress}%
                  </p>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div
                      className="h-full rounded-full bg-[#F97316]"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative min-h-0 w-1/2 overflow-hidden">
              <img
                src={workoutGoalHeroTrainerImg}
                alt="مدرب لياقة بدنية"
                className="absolute inset-0 h-full w-full object-cover object-[center_15%]"
              />

              <svg
                aria-hidden
                className="pointer-events-none absolute -left-px top-0 z-10 h-full w-[74px]"
                viewBox="0 0 74 196"
                preserveAspectRatio="none"
              >
                <path
                  d="M74 0 C 30 18 18 72 30 112 C 40 144 58 170 74 196 H 0 V 0 H74 Z"
                  fill="#ffffff"
                />
              </svg>

              {showPremiumBadge ? (
                <div className="absolute bottom-2.5 right-2.5 z-20 overflow-hidden rounded-2xl border border-[#E8D4A8]/70 bg-white/58 px-2.5 py-1.5 shadow-[0_10px_26px_-10px_rgba(184,146,74,0.38),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,120,0.32)_0%,transparent_62%)]"
                  />
                  <span
                    aria-hidden
                    className="vip-glass-shine pointer-events-none absolute inset-y-[-28%] left-0 w-[52%] bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  />
                  <div className="relative z-[1] flex flex-col items-start">
                    <p className="self-end text-[8px] font-semibold leading-none text-[#B8924A]">الباقة</p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-black leading-none text-[#1F2937]">
                      <Crown className="h-3.5 w-3.5 text-[#D4AF37]" fill="currentColor" />
                      Premium
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section
          className={cn(
            "platform-card space-y-3.5 rounded-3xl p-4",
            WORKOUT_SECTION_PULL.step1,
            WORKOUT_CARD_BLEED,
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-black text-foreground">هذا الأسبوع</h2>
            <button type="button" className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary">
              عرض التقويم
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative grid grid-cols-7 gap-1.5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 z-0 h-px bg-primary"
              style={{ top: "36px" }}
            />
            {weeklySchedule.map((entry) => (
              <WeekDayButton
                key={entry.id}
                entry={entry}
                isSelected={entry.id === selectedDayId}
                onSelect={() => setSelectedDayId(entry.id)}
              />
            ))}
          </div>

          <TodayWorkoutBriefCard
            dateLabel={selectedDayLabel}
            muscleTitle={selectedPlan.muscleTitle}
            isRestDay={selectedPlan.isRestDay}
            stats={selectedPlan.isRestDay ? undefined : workoutStats}
            lockedPreview={freePreview && !selectedPlan.isRestDay}
            lockedPreviewIntensity={freeDayFullyLocked ? "strong" : "light"}
            onLockedClick={() => openUpgrade(lockedReason)}
          />

          {selectedPlan.isRestDay ? (
            <p className="border-t border-border/45 pt-3.5 text-center text-[10px] font-medium text-muted-foreground">
              لا توجد تمارين في هذا اليوم — اختر يوم تدريب لمعاينة الحصة.
            </p>
          ) : sessionQuery.isLoading ? (
            <p className="border-t border-border/45 pt-3.5 text-center text-[10px] font-bold text-muted-foreground">
              جاري تحميل تمارين الحصة…
            </p>
          ) : sessionQuery.isError ? (
            <p className="border-t border-border/45 pt-3.5 text-center text-[10px] font-bold text-destructive">
              تعذّر تحميل تمارين اليوم. حاول مرة أخرى.
            </p>
          ) : (
            <SessionExercisesSection
              exercises={sessionViews}
              dayId={selectedDayId}
              freePreview={freePreview}
              freeDayFullyLocked={freeDayFullyLocked}
              onLockedClick={() => openUpgrade(lockedReason)}
            />
          )}

          {!selectedPlan.isRestDay ? (
            <WorkoutMotivationCta
              points={workoutStats.points}
              dayId={selectedDayId}
              freePreview={freePreview}
              freeTrialAvailable={freePreview && isSelectedToday}
              onLockedClick={() => openUpgrade(lockedReason)}
            />
          ) : null}
        </section>
      </PlatformStack>
  );
}
