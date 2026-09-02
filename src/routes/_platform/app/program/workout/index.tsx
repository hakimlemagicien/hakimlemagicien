import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutationState } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  Dumbbell,
  Lock,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { PlatformHeaderActions } from "@/components/platform/shared/PlatformHeaderActions";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { WorkoutMotivationCta } from "@/components/platform/workout/WorkoutMotivationCta";
import { WorkoutCalendarOverlay } from "@/components/platform/workout/WorkoutCalendarOverlay";
import {
  ExerciseLockedCard,
  ExerciseUnlockedStatusIcon,
} from "@/components/platform/workout/ExerciseLockedCard";
import { ExerciseThumbnail } from "@/components/platform/exercises/ExerciseThumbnail";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWorkoutDaySession } from "@/hooks/useTodayWorkout";
import { useMembership } from "@/hooks/useMembership";
import {
  isExerciseUnlockedByEntitlements,
  isTrainingPreviewMode,
} from "@/lib/platform/entitlements";
import { usePlatformActivity } from "@/hooks/usePlatformActivity";
import { useAssignedTrainingRuntime } from "@/hooks/useAssignedTrainingRuntime";
import { useProgramContinuity } from "@/hooks/useProgramContinuity";
import { useFreeTrainingStrategyPreview } from "@/hooks/useFreeTrainingStrategyPreview";
import { PAID_TRAINING_AUTO_ASSIGN_KEY } from "@/hooks/usePaidTrainingAutoAssign";
import type { PaidTrainingAutoAssignResult } from "@/lib/platform/paid-training-auto-assign";
import { TRAINING_PRODUCT_COPY } from "@/lib/platform/training-product-copy";
import {
  buildWeeklySchedule,
  formatWorkoutDayLabel,
  getWeekdayIdFromDate,
  resolveWeekdayPlan,
  type WeekDayEntry,
  type WeekdayId,
} from "@/lib/platform/weekly-workout-schedule";
import { getExerciseStageListThumb } from "@/lib/platform/exercise-stage-media";
import {
  formatExerciseVolume,
  type WorkoutSessionExercise,
} from "@/lib/platform/workout-session";
import { loadWorkoutProgress, peekStoredWorkoutSession, isStoredWorkoutInterrupted } from "@/lib/platform/workout-progress-storage";
import { workoutFitsGoalCopy } from "@/lib/platform/home-hub";
import { resolveClientGoalLabel } from "@/lib/platform/profile-experience";
import { PROFILE_TRAINING_KEY } from "@/hooks/useProfileExperience";
import { fetchMyTrainingProfile } from "@/lib/platform/profile-api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { readQuizProgress } from "@/lib/quiz-progress-storage";
import { readHomeGoalContext } from "@/lib/platform/hero-goal-images";
import {
  resolveWorkoutGoalHeroPhotos,
  type WorkoutGoalHeroPhoto,
} from "@/lib/platform/workout-goal-hero-images";
import { SessionAnatomyVisual } from "@/components/platform/workout/SessionAnatomyVisual";
import {
  resolveSessionAnatomyImageSrc,
  resolveSessionPresentation,
} from "@/lib/platform/session-muscle-presentation";

function WorkoutRouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-2 py-16 text-center">
      <h1 className="text-xl font-black text-foreground">تعذر فتح الصفحة</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error.message || "حدث خطأ أثناء تحميل التمارين. حاول مرة أخرى."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}

export const Route = createFileRoute("/_platform/app/program/workout/")({
  head: () => ({ meta: [{ title: "تمرين اليوم | MAAKFIT" }] }),
  component: WorkoutDayPage,
  errorComponent: WorkoutRouteError,
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
  const externalIds = exercises.map((item) => item.external_id);
  const stored = applyStoredProgress ? loadWorkoutProgress(exercises.length, externalIds) : null;
  return exercises.map((exercise, index) => {
    const saved = stored?.[index];
    return {
      ...exercise,
      completedSets: saved?.completedSets ?? 0,
      status: saved?.status ?? (index === 0 ? "active" : "pending"),
    };
  });
}

const SELECTED_DAY_KEY = "hakim:workout-selected-day:v1";

function readStoredSelectedDay(fallback: WeekdayId): WeekdayId {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(SELECTED_DAY_KEY);
    if (
      raw === "sat" ||
      raw === "sun" ||
      raw === "mon" ||
      raw === "tue" ||
      raw === "wed" ||
      raw === "thu" ||
      raw === "fri"
    ) {
      return raw;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function writeStoredSelectedDay(dayId: WeekdayId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SELECTED_DAY_KEY, dayId);
  } catch {
    // ignore
  }
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
  valueClassName = "text-foreground",
  labelClassName = "text-muted-foreground",
}: {
  icon: typeof Clock3;
  value: string;
  label: string;
  iconClassName: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center px-0 py-1 text-center">
      <Icon className={cn("h-3.5 w-3.5", iconClassName)} strokeWidth={2.1} />
      <p className={cn("mt-1 text-[12px] font-black leading-none", valueClassName)}>{value}</p>
      <p className={cn("mt-1 text-[8px] font-medium leading-none", labelClassName)}>{label}</p>
    </div>
  );
}

const GOAL_STACK_SLOTS = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 10, y: 8, rotate: 6.5, scale: 0.95 },
  { x: 18, y: 15, rotate: 12, scale: 0.9 },
] as const;

function GoalHeroPhotoStack({
  active,
  photos,
}: {
  active: number;
  photos: WorkoutGoalHeroPhoto[];
}) {
  const reduceMotion = useReducedMotion();
  const stack = photos.length >= 3 ? photos.slice(0, 3) : photos;

  return (
    <div className="workout-goal-stack">
      {stack.map((photo, index) => {
        const slot = (index - active + stack.length) % stack.length;
        const pos = GOAL_STACK_SLOTS[slot]!;
        const isFront = slot === 0;

        return (
          <motion.div
            key={`${photo.src}-${index}`}
            className="workout-goal-stack__card"
            aria-hidden={!isFront}
            initial={false}
            animate={{
              x: pos.x,
              y: pos.y,
              rotate: pos.rotate,
              scale: pos.scale,
              zIndex: 3 - slot,
            }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 340, damping: 32, mass: 0.72 }
            }
            style={{ zIndex: 3 - slot }}
          >
            <img
              src={photo.src}
              alt={isFront ? photo.alt : ""}
              width={240}
              height={320}
              decoding="async"
              fetchPriority={isFront ? "high" : "low"}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function WorkoutGoalHero({
  overallProgress,
  goalLabel,
  photos,
}: {
  overallProgress: number;
  goalLabel: string;
  photos: WorkoutGoalHeroPhoto[];
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const photoCount = Math.max(photos.length, 1);

  useEffect(() => {
    setActivePhoto(0);
  }, [photos]);

  useEffect(() => {
    if (photoCount <= 1) return;
    const id = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % photoCount);
    }, 3000);
    return () => window.clearInterval(id);
  }, [photoCount]);

  return (
    <section
      className={cn("workout-goal-hero", WORKOUT_SECTION_PULL.hero)}
      style={{ height: "196px" }}
    >
      <div aria-hidden className="workout-goal-hero__fog">
        {photos.map((photo, index) => (
          <img
            key={photo.src}
            src={photo.src}
            alt=""
            className={index === activePhoto ? "is-active" : undefined}
          />
        ))}
      </div>
      <div aria-hidden className="workout-goal-hero__veil" />
      <div className="workout-goal-hero__body">
        <div className="workout-goal-hero__media">
          <GoalHeroPhotoStack active={activePhoto} photos={photos} />
        </div>

        <div className="workout-goal-hero__copy" dir="rtl">
          <div className="text-right">
            <p className="workout-goal-hero__eyebrow">
              <Target className="h-3.5 w-3.5" strokeWidth={2.4} />
              هدفك
            </p>
            <h2 className="workout-goal-hero__title">{goalLabel}</h2>
            <p className="workout-goal-hero__desc">
              برنامجك مصمم خصيصاً لك بناءً على بياناتك وسيتم تحديثه كل أسبوع.
            </p>
          </div>

          <div className="workout-goal-hero__progress" dir="rtl">
            <p className="workout-goal-hero__progress-label">التقدم العام</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="workout-goal-hero__progress-value">{overallProgress}%</p>
              <div className="workout-goal-hero__track" dir="rtl">
                <div
                  className="workout-goal-hero__fill"
                  style={{ width: `${Math.min(Math.max(overallProgress, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TodayWorkoutBriefCard({
  dateLabel,
  muscleTitle,
  isRestDay,
  anatomyVisualKey,
  anatomyImageSrc,
  stats,
  dayId,
  startExerciseId,
  startIndex = 0,
  lockedPreview = false,
  lockedPreviewIntensity = "medium",
  onLockedClick,
  ctaLabel,
  notice,
  why,
}: {
  dateLabel: string;
  muscleTitle: string;
  isRestDay: boolean;
  anatomyVisualKey: ReturnType<typeof resolveSessionPresentation>["visualKey"];
  anatomyImageSrc?: string | null;
  stats?: { exercises: number; minutes: number; points: number };
  dayId: WeekdayId;
  startExerciseId?: string;
  startIndex?: number;
  lockedPreview?: boolean;
  lockedPreviewIntensity?: "light" | "medium" | "strong";
  onLockedClick?: () => void;
  ctaLabel?: string;
  notice?: string;
  why?: string;
}) {
  const fullyLocked = lockedPreview && lockedPreviewIntensity === "strong";
  const startClassName =
    "workout-start-cta relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary text-sm font-black text-primary-foreground transition-transform duration-[120ms] active:scale-[0.97]";

  const startLabel = (
    <>
      <span
        aria-hidden
        className="workout-start-cta__streak pointer-events-none absolute inset-y-[-30%] left-0 w-[38%] bg-gradient-to-r from-transparent via-yellow-200/90 to-transparent"
      />
      <Zap className="workout-start-cta__zap relative h-4 w-4 fill-current" strokeWidth={2.4} />
      <span className="relative">{ctaLabel ?? "ابدأ تمرين"}</span>
    </>
  );

  return (
    <div className="space-y-2.5">
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)]",
        lockedPreview && lockedPreviewIntensity !== "light" && "opacity-95",
      )}
    >
      <div className="flex min-h-[148px] items-stretch" dir="rtl">
        <div className="relative w-[46%] min-w-[150px] shrink-0 self-stretch overflow-hidden bg-card">
          <SessionAnatomyVisual
            visualKey={anatomyVisualKey}
            imageSrc={anatomyImageSrc}
            isRestDay={isRestDay}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 end-0 w-[22%] bg-gradient-to-r from-card to-transparent"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center justify-between px-4 py-[27px] text-center">
          <p className="text-[11px] font-medium leading-none text-muted-foreground">
            {isRestDay ? "يوم راحة" : "تمرين اليوم"} • {dateLabel}
          </p>

          <div className="flex flex-col items-center justify-center gap-2 py-2">
            <h3 className="text-[19px] font-black leading-[1.15] tracking-tight text-foreground">
              {muscleTitle}
            </h3>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold leading-none",
                isRestDay ? "bg-muted text-muted-foreground" : "bg-[#E8F5E9] text-[#2E7D32]",
              )}
            >
              {isRestDay ? "استشفاء ومرونة" : "المجموعة العضلية المستهدفة"}
            </span>
          </div>

          {!isRestDay && stats ? (
            <div
              className="grid w-full grid-cols-3 divide-x divide-border/55 border-t border-border/50 pt-2.5"
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
            <p className="border-t border-border/50 pt-2.5 text-[10px] leading-snug text-muted-foreground">
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
              ? TRAINING_PRODUCT_COPY.lockedOverlayLight
              : TRAINING_PRODUCT_COPY.lockedOverlayStrong
          }
          onUnlockClick={onLockedClick}
        />
      ) : null}
    </article>

      {isRestDay ? null : fullyLocked ? (
        <button type="button" onClick={onLockedClick} className={startClassName}>
          {startLabel}
        </button>
      ) : (
        <Link
          to="/app/program/workout/exercise"
          search={{ exerciseId: startExerciseId, index: startIndex, day: dayId }}
          className={startClassName}
        >
          {startLabel}
        </Link>
      )}
      {why && !isRestDay ? (
        <p className="rounded-2xl border border-border/50 bg-muted/30 px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-muted-foreground">
          {why}
        </p>
      ) : null}
      {notice ? (
        <p className="text-center text-[11px] font-medium leading-relaxed text-muted-foreground">{notice}</p>
      ) : null}
    </div>
  );
}

function SessionExercisePathRow({
  index,
  exercise,
  orderIndex,
  dayId,
  freePreview,
  freeDayFullyLocked,
  entitlements,
  isLast,
  onLockedClick,
}: {
  index: number;
  exercise: SessionExerciseView;
  orderIndex: number;
  dayId: WeekdayId;
  freePreview: boolean;
  freeDayFullyLocked: boolean;
  entitlements: ReturnType<typeof useMembership>["entitlements"];
  isLast: boolean;
  onLockedClick: () => void;
}) {
  const volume = formatExerciseVolume(exercise);
  const isUnlocked =
    !freePreview ||
    (!freeDayFullyLocked &&
      isExerciseUnlockedByEntitlements(entitlements, orderIndex, { isToday: true }));
  const isDone = exercise.status === "done";
  const isActive = exercise.status === "active";
  const stillThumb = getExerciseStageListThumb(exercise.external_id);
  const thumbClass = cn(
    "h-full w-full object-cover object-center",
    !isUnlocked && "opacity-45 saturate-50",
  );

  const thumbnail = stillThumb ? (
    <OptimizedImage
      src={stillThumb}
      alt=""
      width={176}
      height={176}
      sizes="88px"
      objectFit="cover"
      className={cn("h-full w-full", !isUnlocked && "opacity-45 saturate-50")}
      fallback={
        <ExerciseThumbnail
          signedUrl={exercise.thumbnailUrl}
          status={exercise.videoStatus}
          mediaPath={exercise.videoPath}
          alt={exercise.name}
          className={thumbClass}
        />
      }
    />
  ) : (
    <ExerciseThumbnail
      signedUrl={exercise.thumbnailUrl}
      status={exercise.videoStatus}
      mediaPath={exercise.videoPath}
      alt={exercise.name}
      className={thumbClass}
    />
  );

  if (!isUnlocked) {
    return (
      <ExerciseLockedCard
        index={index}
        name={exercise.name}
        sets={exercise.sets}
        volume={volume}
        restLabel={exercise.restLabel}
        thumbnail={thumbnail}
        isLast={isLast}
        isActive={isActive}
        isDone={isDone}
        onUnlock={onLockedClick}
      />
    );
  }

  const body = (
    <>
      <span className="relative z-[1] grid w-7 shrink-0 place-items-center">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-black",
            isDone || isActive
              ? "bg-primary text-white shadow-[0_4px_10px_-4px_rgba(249,115,22,0.55)]"
              : "border-[1.5px] border-primary bg-card text-primary",
          )}
        >
          {index}
        </span>
      </span>

      <div
        className={cn(
          "relative aspect-square shrink-0 overflow-hidden rounded-md border bg-card",
          isActive
            ? "workout-exercise-thumb--current size-[88px] border-primary/70"
            : "size-[74px] border-border/60",
        )}
      >
        {thumbnail}
      </div>

      <div className="min-w-0 flex-1 text-right">
        <p
          className={cn(
            "font-black leading-snug text-foreground",
            isActive ? "text-[13px]" : "text-[12px]",
          )}
        >
          {index}. {exercise.name}
        </p>
        {isActive ? (
          <p className="mt-0.5 text-[10px] font-black text-primary">التمرين الحالي</p>
        ) : null}
        <p className="mt-0.5 text-[10px] font-medium leading-snug text-muted-foreground">
          {exercise.sets} مجموعات × {volume}
        </p>
        <p className="mt-0.5 text-[10px] font-bold leading-snug text-primary">
          راحة {exercise.restLabel}
        </p>
      </div>

      <ExerciseUnlockedStatusIcon isDone={isDone} />
    </>
  );

  const rowClass = cn(
    "workout-exercise-row flex w-full items-center gap-2.5 px-3 py-3 text-right transition active:bg-muted/25",
    !isLast && "border-b border-border/40",
    isActive && "workout-exercise-row--current relative z-[1] py-3.5",
  );

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

function SessionExercisesSection({
  exercises,
  dayId,
  freePreview,
  freeDayFullyLocked,
  entitlements,
  onLockedClick,
}: {
  exercises: SessionExerciseView[];
  dayId: WeekdayId;
  freePreview: boolean;
  freeDayFullyLocked: boolean;
  entitlements: ReturnType<typeof useMembership>["entitlements"];
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

  const activeIndex = exercises.findIndex((item) => item.status !== "done");
  const allDone = activeIndex === -1;
  const currentStep = allDone ? exercises.length : Math.max(activeIndex + 1, 1);
  const progressPct = allDone
    ? 100
    : ((currentStep - 0.5) / exercises.length) * 100;

  return (
    <div className="space-y-2.5 border-t border-border/45 pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cn("inline-flex items-center gap-1.5", workoutType.cardTitle)}>
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          تمارين الحصة
        </h2>
        {freePreview ? (
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

        {exercises.map((exercise, exerciseIndex) => (
          <SessionExercisePathRow
            key={exercise.id}
            index={exerciseIndex + 1}
            exercise={exercise}
            orderIndex={exerciseIndex}
            dayId={dayId}
            freePreview={freePreview}
            freeDayFullyLocked={freeDayFullyLocked}
            entitlements={entitlements}
            isLast={exerciseIndex === exercises.length - 1}
            onLockedClick={onLockedClick}
          />
        ))}

        {freePreview ? (
          <WorkoutLockedPreviewOverlay
            active={freeDayFullyLocked}
            intensity="strong"
            message="معاينة مقفلة — اشترك لفتح برنامجك"
            onUnlockClick={onLockedClick}
          />
        ) : null}
      </div>

      {freePreview ? (
        <p className="text-[9px] font-medium leading-snug text-muted-foreground">
          {freeDayFullyLocked
            ? TRAINING_PRODUCT_COPY.freePreviewOtherDay
            : TRAINING_PRODUCT_COPY.freePreviewFooter(exercises.length)}
        </p>
      ) : null}
    </div>
  );
}

function WorkoutDayPage() {
  const { features, entitlements } = useMembership();
  const { openUpgradeWithContext } = useUpgradeFlow();
  const { userId, snapshot } = usePlatformActivity();
  const hasWorkoutProgram = Boolean(features?.workout_program);
  const freePreview = isTrainingPreviewMode(entitlements);
  const todayId = getWeekdayIdFromDate();
  const [selectedDayId, setSelectedDayId] = useState<WeekdayId>(() => readStoredSelectedDay(todayId));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isSelectedToday = selectedDayId === todayId;
  const freeDayFullyLocked = freePreview && !isSelectedToday;
  const lockedReason = freeDayFullyLocked
    ? TRAINING_PRODUCT_COPY.freePreviewOtherDay
    : TRAINING_PRODUCT_COPY.upgradeSheetTraining;
  const openTrainingUpgrade = () =>
    openUpgradeWithContext(
      "TRAINING",
      freeDayFullyLocked ? lockedReason : TRAINING_PRODUCT_COPY.upgradeSheetTraining,
    );

  const trainingQuery = useQuery({
    queryKey: PROFILE_TRAINING_KEY,
    queryFn: fetchMyTrainingProfile,
    staleTime: 30_000,
  });
  const goalLabel = resolveClientGoalLabel(
    trainingQuery.data?.answers.goalId,
    readQuizProgress()?.goalId,
    trainingQuery.data?.goal,
  );
  const { gender, goalId } = readHomeGoalContext({
    gender: trainingQuery.data?.answers.gender,
    goalId: trainingQuery.data?.answers.goalId ?? trainingQuery.data?.goal,
    goalText: trainingQuery.data?.goal,
  });
  const goalHeroPhotos = useMemo(
    () => resolveWorkoutGoalHeroPhotos({ gender, goalId, goalLabel }),
    [gender, goalId, goalLabel],
  );

  const runtimeQuery = useAssignedTrainingRuntime(hasWorkoutProgram);
  const paidAutoAssignMutation = useMutationState({
    filters: { mutationKey: PAID_TRAINING_AUTO_ASSIGN_KEY },
    select: (mutation) => ({
      status: mutation.state.status,
      data: mutation.state.data as PaidTrainingAutoAssignResult | undefined,
    }),
  });
  const paidAutoAssignLatest = paidAutoAssignMutation[paidAutoAssignMutation.length - 1];
  const paidAutoAssignRunning = paidAutoAssignLatest?.status === "pending";
  const paidAutoAssignResult = paidAutoAssignLatest?.data;
  const continuity = useProgramContinuity(runtimeQuery.data, hasWorkoutProgram);
  const assignedPlans =
    hasWorkoutProgram && runtimeQuery.isSuccess && runtimeQuery.data?.reason === "ok"
      ? continuity.assignedPlans
      : null;

  const freeStrategyPreviewQuery = useFreeTrainingStrategyPreview({
    enabled: freePreview && !hasWorkoutProgram,
    userId,
    training: trainingQuery.data,
  });
  const freeStrategyPreviewPlans = freeStrategyPreviewQuery.data ?? null;
  const previewPlans = hasWorkoutProgram ? assignedPlans : freeStrategyPreviewPlans;

  useEffect(() => {
    writeStoredSelectedDay(selectedDayId);
  }, [selectedDayId]);

  const weeklySchedule = useMemo(
    () =>
      buildWeeklySchedule({
        userId,
        freeMember: freePreview,
        assignedPlans: previewPlans ?? undefined,
      }),
    [userId, freePreview, previewPlans, snapshot.activityStreak, snapshot.hakimPoints, snapshot.workoutDone],
  );

  const selectedEntry =
    weeklySchedule.find((entry) => entry.id === selectedDayId) ?? weeklySchedule[0]!;
  const selectedPlan = previewPlans
    ? previewPlans[selectedDayId] ?? resolveWeekdayPlan(selectedDayId, true, previewPlans)
    : resolveWeekdayPlan(selectedDayId, hasWorkoutProgram);
  const sessionQuery = useWorkoutDaySession(
    (freePreview || previewPlans) && !selectedPlan.isRestDay ? selectedPlan : null,
  );
  const sessionExercises = sessionQuery.data?.exercises ?? [];
  const todayKey = continuity.todayKey;
  const applyStoredProgress = selectedEntry.dateKey === todayKey;
  const sessionViews = buildSessionExerciseViews(sessionExercises, applyStoredProgress);
  const workoutStats = {
    exercises: sessionExercises.length,
    minutes: selectedPlan.durationMin,
    points: selectedPlan.points,
  };
  const selectedDayLabel = formatWorkoutDayLabel(selectedEntry.calendarDate, selectedEntry.dayName);
  const overallProgress = snapshot.overallProgressPct;
  const runtimeReason = runtimeQuery.data?.reason;
  const programName = runtimeQuery.data?.assignment?.name_ar;
  const runtimeOk =
    hasWorkoutProgram && runtimeQuery.isSuccess && runtimeReason === "ok";
  const showFreeStrategyPreview =
    freePreview && !hasWorkoutProgram && Boolean(freeStrategyPreviewPlans);
  const showFreePreviewIncompleteProfile =
    freePreview &&
    !hasWorkoutProgram &&
    trainingQuery.isFetched &&
    !trainingQuery.data &&
    !freeStrategyPreviewQuery.isLoading;
  const showFreePreviewError =
    freePreview &&
    !hasWorkoutProgram &&
    !showFreePreviewIncompleteProfile &&
    !freeStrategyPreviewQuery.isLoading &&
    (freeStrategyPreviewQuery.isError ||
      (freeStrategyPreviewQuery.isFetched && !freeStrategyPreviewPlans));
  const showWeeklySchedule = showFreeStrategyPreview || runtimeOk;
  const showFreePreviewLoading =
    freePreview && !hasWorkoutProgram && freeStrategyPreviewQuery.isLoading;
  const showPaidAutoAssignLoading =
    hasWorkoutProgram &&
    !runtimeOk &&
    (paidAutoAssignRunning || runtimeQuery.isLoading);
  const showPaidReviewPending =
    hasWorkoutProgram &&
    !runtimeOk &&
    !showPaidAutoAssignLoading &&
    paidAutoAssignResult?.status === "review_required";
  const showPaidProfileBlocked =
    hasWorkoutProgram &&
    !runtimeOk &&
    !showPaidAutoAssignLoading &&
    paidAutoAssignResult?.status === "blocked" &&
    paidAutoAssignResult.reasonCode === "MISSING_PROFILE_DATA";
  const showRuntimeLoading = hasWorkoutProgram && runtimeQuery.isLoading;
  const showRuntimeError =
    hasWorkoutProgram && runtimeQuery.isError && !runtimeQuery.isFetching;
  const showRuntimeBlocked =
    hasWorkoutProgram && runtimeQuery.isSuccess && runtimeReason !== "ok";
  const interrupted =
    applyStoredProgress && isStoredWorkoutInterrupted(peekStoredWorkoutSession());
  const resumeNotice =
    interrupted || continuity.decision?.action === "RESUME_SESSION"
      ? "جلسة سابقة غير مكتملة — يمكنك الاستكمال من حيث توقفت."
      : undefined;
  const sessionPresentation = useMemo(
    () =>
      resolveSessionPresentation({
        plan: selectedPlan,
        exerciseMuscles: sessionExercises.map((exercise) => ({
          external_id: exercise.external_id,
          muscle: exercise.muscle,
        })),
      }),
    [selectedPlan, sessionExercises],
  );
  const sessionTitle = sessionPresentation.displayNameAr || selectedPlan.muscleTitle;
  const anatomyImageSrc = resolveSessionAnatomyImageSrc(
    sessionPresentation,
    sessionExercises.map((exercise) => exercise.external_id),
  );
  const whyCopy =
    !selectedPlan.isRestDay && goalLabel !== "غير محدد"
      ? workoutFitsGoalCopy(goalLabel, sessionTitle)
      : undefined;

  return (
    <PlatformStack>
        <header className="relative z-30 flex h-11 items-center justify-between px-0.5">
          <button
            type="button"
            aria-label="التقويم"
            onClick={(event) => {
              event.stopPropagation();
              setCalendarOpen(true);
            }}
            className="relative z-30 grid h-11 w-11 shrink-0 place-items-center text-foreground"
          >
            <CalendarDays className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-base font-black tracking-tight text-foreground">التمارين برنامجك</h1>
          <PlatformHeaderActions />
        </header>

        <WorkoutGoalHero
          overallProgress={overallProgress}
          goalLabel={goalLabel}
          photos={goalHeroPhotos}
        />

        {showRuntimeLoading ? (
          <section className="platform-card space-y-3 rounded-3xl p-4">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          </section>
        ) : null}

        {showRuntimeError ? (
          <section className="platform-card space-y-3 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">تعذر تحميل البرنامج.</p>
            <p className="text-xs text-muted-foreground">
              تحقق من اتصالك ثم أعد المحاولة. لا نعرض جدولاً افتراضياً مكان برنامجك.
            </p>
            <button
              type="button"
              className="text-[11px] font-black text-primary"
              onClick={() => void runtimeQuery.refetch()}
            >
              إعادة المحاولة
            </button>
          </section>
        ) : null}

        {showRuntimeBlocked ? (
          <section className="platform-card space-y-2 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">
              {runtimeReason === "scheduled"
                ? "برنامجك مجدول ولم يبدأ بعد"
                : runtimeReason === "ended"
                  ? "انتهت مدة البرنامج الحالي"
                  : runtimeReason === "legacy_incomplete"
                    ? "هذا التعيين يحتاج مراجعة من المدرب"
                    : "لا برنامج تدريبي معيَّن"}
            </p>
            <p className="text-xs text-muted-foreground">
              {programName ? `${programName} — ` : ""}
              {runtimeReason === "no_program"
                ? "سيظهر تمرينك هنا بعد أن يعيّن المدرب برنامجاً."
                : "لا تُعرض تمارين جاهزة مكان البرنامج المعيَّن."}
            </p>
          </section>
        ) : null}

        {showFreePreviewLoading ? (
          <section className="platform-card space-y-2 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.freePreviewLoadingTitle}</p>
            <p className="text-xs text-muted-foreground">{TRAINING_PRODUCT_COPY.freePreviewLoadingBody}</p>
          </section>
        ) : null}

        {showFreePreviewIncompleteProfile ? (
          <section className="platform-card space-y-3 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.completeProfileTitle}</p>
            <p className="text-xs text-muted-foreground">{TRAINING_PRODUCT_COPY.completeProfileBody}</p>
            <Link
              to="/app/profile"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground"
            >
              {TRAINING_PRODUCT_COPY.completeProfileCta}
            </Link>
          </section>
        ) : null}

        {showFreePreviewError ? (
          <section className="platform-card space-y-2 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.previewErrorTitle}</p>
            <p className="text-xs text-muted-foreground">{TRAINING_PRODUCT_COPY.previewErrorBody}</p>
            <button
              type="button"
              className="text-[11px] font-black text-primary"
              onClick={() => void freeStrategyPreviewQuery.refetch()}
            >
              {TRAINING_PRODUCT_COPY.previewRetry}
            </button>
          </section>
        ) : null}

        {showPaidAutoAssignLoading ? (
          <section className="platform-card space-y-2 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.paidAutoAssignLoading}</p>
          </section>
        ) : null}

        {showPaidReviewPending ? (
          <section className="platform-card space-y-2 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.paidReviewPendingTitle}</p>
            <p className="text-xs text-muted-foreground">{TRAINING_PRODUCT_COPY.paidReviewPendingBody}</p>
          </section>
        ) : null}

        {showPaidProfileBlocked ? (
          <section className="platform-card space-y-3 rounded-3xl p-4 text-center">
            <p className="text-sm font-black text-foreground">{TRAINING_PRODUCT_COPY.completeProfileTitle}</p>
            <p className="text-xs text-muted-foreground">{TRAINING_PRODUCT_COPY.completeProfileBody}</p>
            <Link
              to="/app/profile"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground"
            >
              {TRAINING_PRODUCT_COPY.completeProfileCta}
            </Link>
          </section>
        ) : null}

        {showWeeklySchedule ? (
        <>
        <section
          className={cn(
            "platform-card space-y-3.5 rounded-3xl p-4",
            WORKOUT_SECTION_PULL.step1,
            WORKOUT_CARD_BLEED,
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-black text-foreground">هذا الأسبوع</h2>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setCalendarOpen(true);
              }}
              className="relative z-10 inline-flex items-center gap-0.5 text-[11px] font-bold text-primary"
            >
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
            muscleTitle={sessionTitle}
            isRestDay={selectedPlan.isRestDay}
            anatomyVisualKey={sessionPresentation.visualKey}
            anatomyImageSrc={anatomyImageSrc}
            stats={selectedPlan.isRestDay ? undefined : workoutStats}
            dayId={selectedDayId}
            startExerciseId={sessionViews.find((item) => item.status === "active")?.id ?? sessionViews[0]?.id}
            startIndex={Math.max(
              sessionViews.findIndex((item) => item.status === "active"),
              0,
            )}
            lockedPreview={freePreview && !selectedPlan.isRestDay}
            lockedPreviewIntensity={freeDayFullyLocked ? "strong" : "light"}
            onLockedClick={openTrainingUpgrade}
            ctaLabel={
              isSelectedToday &&
              (interrupted || continuity.decision?.action === "RESUME_SESSION")
                ? "استكمل التمرين"
                : undefined
            }
            why={whyCopy}
            notice={
              resumeNotice ??
              (isSelectedToday &&
              continuity.decision &&
              ["RESCHEDULE_SESSION", "DEFER_SESSION", "ADVANCE_AFTER_PARTIAL", "ENTER_RECONDITIONING", "SCHEDULE_REVIEW_REQUIRED"].includes(
                continuity.decision.action,
              )
                ? continuity.decision.client_explanation
                : undefined)
            }
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
            <div className="space-y-2 border-t border-border/45 pt-3.5 text-center">
              <p className="text-[10px] font-bold text-destructive">
                تعذّر تحميل تمارين اليوم. حاول مرة أخرى.
              </p>
              <button
                type="button"
                onClick={() => void sessionQuery.refetch()}
                className="text-[11px] font-black text-primary"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <SessionExercisesSection
              exercises={sessionViews}
              dayId={selectedDayId}
              freePreview={freePreview}
              freeDayFullyLocked={freeDayFullyLocked}
              entitlements={entitlements}
              onLockedClick={openTrainingUpgrade}
            />
          )}

          {!selectedPlan.isRestDay ? (
            <WorkoutMotivationCta
              points={workoutStats.points}
              dayId={selectedDayId}
              freePreview={freePreview}
              freeTrialAvailable={freePreview && isSelectedToday}
              onLockedClick={openTrainingUpgrade}
            />
          ) : null}
        </section>
        </>
        ) : null}
        <WorkoutCalendarOverlay
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          selectedDayId={selectedDayId}
          weeklySchedule={weeklySchedule}
          hasWorkoutProgram={hasWorkoutProgram}
          assignedPlans={hasWorkoutProgram ? assignedPlans : undefined}
          onSelectDay={setSelectedDayId}
        />
      </PlatformStack>
  );
}
