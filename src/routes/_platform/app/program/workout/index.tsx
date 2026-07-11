import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  Circle,
  Clock3,
  Crown,
  Dumbbell,
  Flame,
  Star,
  Target,
} from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { WorkoutMotivationCta } from "@/components/platform/workout/WorkoutMotivationCta";
import { ExerciseThumbnail } from "@/components/platform/exercises/ExerciseThumbnail";
import { PreviewGate } from "@/components/platform/shared/PreviewGate";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useMembership } from "@/hooks/useMembership";
import { TODAY_WORKOUT_BRIEF } from "@/lib/platform/today-workout";
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

type WeekDayStatus = "done" | "today" | "upcoming" | "scheduled";

type WeekDay = {
  id: string;
  shortName: string;
  dayName: string;
  dateLabel: string;
  targetMuscle: string;
  status: WeekDayStatus;
};

const WEEKLY_SCHEDULE: WeekDay[] = [
  {
    id: "sun",
    shortName: "الأحد",
    dayName: "الأحد",
    dateLabel: "2",
    targetMuscle: "راحة",
    status: "upcoming",
  },
  {
    id: "mon",
    shortName: "الإثنين",
    dayName: "الإثنين",
    dateLabel: "3",
    targetMuscle: "صدر",
    status: "scheduled",
  },
  {
    id: "tue",
    shortName: "الثلاثاء",
    dayName: "الثلاثاء",
    dateLabel: "4",
    targetMuscle: "رجل",
    status: "upcoming",
  },
  {
    id: "wed",
    shortName: "الأربعاء",
    dayName: "الأربعاء",
    dateLabel: "5",
    targetMuscle: "أكتاف",
    status: "upcoming",
  },
  {
    id: "thu",
    shortName: "الخميس",
    dayName: "الخميس",
    dateLabel: "6",
    targetMuscle: "ظهر",
    status: "upcoming",
  },
  {
    id: "fri",
    shortName: "الجمعة",
    dayName: "الجمعة",
    dateLabel: "7",
    targetMuscle: "بايسبس",
    status: "upcoming",
  },
  {
    id: "sat",
    shortName: "السبت",
    dayName: "السبت",
    dateLabel: "8",
    targetMuscle: "راحة",
    status: "upcoming",
  },
];

const TODAY_WORKOUT_BRIEF_UI = {
  linkedDayId: TODAY_WORKOUT_BRIEF.linkedDayId,
  dateLabel: TODAY_WORKOUT_BRIEF.dateLabel,
  muscleTitle: TODAY_WORKOUT_BRIEF.muscleTitle,
  anatomyImage: muscleAnatomyChestBicepsImg,
  stats: {
    exercises: TODAY_WORKOUT_BRIEF.points,
    minutes: TODAY_WORKOUT_BRIEF.durationMin,
    calories: TODAY_WORKOUT_BRIEF.calories,
    points: TODAY_WORKOUT_BRIEF.points,
  },
};

function getDayConnectorRight(index: number, total: number) {
  return `${((index + 0.5) / total) * 100}%`;
}

type SessionExerciseStatus = "active" | "done" | "pending";

type SessionExerciseView = WorkoutSessionExercise & {
  status: SessionExerciseStatus;
  completedSets: number;
};

function buildSessionExerciseViews(
  exercises: WorkoutSessionExercise[],
): SessionExerciseView[] {
  const stored = loadWorkoutProgress(exercises.length);
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

function WeekDayButton({
  entry,
  isLinkedToWorkout = false,
}: {
  entry: WeekDay;
  isLinkedToWorkout?: boolean;
}) {
  const isActive = entry.status === "scheduled";

  return (
    <button
      type="button"
      className={cn(
        "relative flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl p-1 transition active:scale-[0.98]",
        isActive || isLinkedToWorkout
          ? "z-10 border border-primary bg-card shadow-[0_0_0_1px_rgba(249,115,22,0.14),0_8px_18px_-10px_rgba(249,115,22,0.35)]"
          : "border border-transparent bg-muted/45",
        isLinkedToWorkout &&
          "after:pointer-events-none after:absolute after:left-1/2 after:top-[calc(100%+1px)] after:h-2.5 after:w-px after:-translate-x-1/2 after:bg-gradient-to-b after:from-primary after:to-primary/25",
      )}
    >
      <p
        className={cn(
          "w-full truncate text-center font-bold leading-none",
          workoutType.cardLabel,
          isActive || isLinkedToWorkout ? "text-primary" : "text-muted-foreground",
        )}
      >
        {entry.shortName}
      </p>
      <p
        className={cn(
          workoutType.cardNumber,
          isActive || isLinkedToWorkout ? "text-primary" : "text-foreground",
        )}
      >
        {entry.dateLabel}
      </p>
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
  connectorRight,
  brief,
}: {
  connectorRight?: string;
  brief: typeof TODAY_WORKOUT_BRIEF_UI;
}) {
  const { dateLabel, muscleTitle, anatomyImage, stats } = brief;
  const isLinked = Boolean(connectorRight);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-card",
        isLinked
          ? "border-primary/30 shadow-[0_10px_28px_-14px_rgba(249,115,22,0.24)]"
          : "border-border/60 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.18)]",
      )}
    >
      {isLinked ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-px z-10 h-[3px] w-12 -translate-x-1/2 rounded-full bg-primary/85 shadow-[0_0_10px_rgba(249,115,22,0.45)]"
            style={{ right: connectorRight }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent"
          />
        </>
      ) : null}
      <div className="flex items-stretch" dir="rtl">
        <div className="flex w-[40%] max-w-[140px] shrink-0 items-center justify-center self-stretch overflow-hidden border-s border-border/45 bg-gradient-to-b from-muted/20 to-transparent px-1 py-1">
          <img
            src={anatomyImage}
            alt="تشريح عضلي للصدر مع البايسابس"
            className="h-full w-full origin-center scale-[1.32] object-contain object-center"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-3 text-right">
          <p className="-translate-y-px text-[10px] font-medium leading-none text-muted-foreground">
            تمرين اليوم • {dateLabel}
          </p>

          <div className="flex flex-1 flex-col items-end justify-center gap-1.5 py-1 translate-x-[50px]">
            <h3 className="text-[17px] font-black leading-[1.12] tracking-tight text-foreground">
              {muscleTitle}
            </h3>
            <span className="inline-flex rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[8px] font-bold leading-none text-[#2E7D32]">
              المجموعة العضلية المستهدفة
            </span>
          </div>

          <div
            className="grid origin-bottom scale-[1.10] grid-cols-4 divide-x divide-border/55 border-t border-border/50 pt-2"
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
              icon={Flame}
              value={String(stats.calories)}
              label="سعر حراري"
              iconClassName="text-primary"
            />
            <TodayWorkoutStatCell
              icon={Star}
              value={String(stats.points)}
              label="نقطة"
              iconClassName="fill-amber-400 text-amber-500"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function SessionExerciseStatusBadge({
  index,
  exercise,
  featured = false,
}: {
  index: number;
  exercise: SessionExerciseView;
  featured?: boolean;
}) {
  if (exercise.status === "active") {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#22C55E] text-[11px] font-black text-white shadow-[0_4px_12px_-4px_rgba(34,197,94,0.55)]">
          {index}
        </span>
        {featured ? (
          <>
            <p className="text-[7px] font-bold leading-none text-muted-foreground">
              {exercise.completedSets}/{exercise.sets} مجموعات
            </p>
            <Check className="h-3.5 w-3.5 text-[#22C55E]" strokeWidth={3} />
          </>
        ) : null}
      </div>
    );
  }

  if (exercise.status === "done") {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[#22C55E] text-[11px] font-black text-[#22C55E]">
        {index}
      </span>
    );
  }

  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border/80 text-[11px] font-black text-muted-foreground">
      {index}
    </span>
  );
}

function SessionExerciseFeaturedRow({
  index,
  exercise,
  orderIndex,
}: {
  index: number;
  exercise: SessionExerciseView;
  orderIndex: number;
}) {
  const volume = formatExerciseVolume(exercise);

  return (
    <Link
      to="/app/program/workout/exercise"
      search={{ exerciseId: exercise.id, index: orderIndex }}
      className="flex items-center gap-2.5 border-b border-border/50 px-3 py-3 transition active:bg-muted/25"
      dir="rtl"
    >
      <SessionExerciseStatusBadge index={index} exercise={exercise} featured />

      <div className="h-[54px] w-[78px] shrink-0 overflow-hidden rounded-xl border border-border/45 bg-muted">
        <ExerciseThumbnail
          signedUrl={exercise.thumbnailUrl}
          mediaPath={exercise.videoPath}
          alt={exercise.name}
          className="h-full w-full"
        />
      </div>

      <div className="min-w-0 flex-1 text-right">
        <p className="text-[12px] font-black leading-snug text-foreground">
          {index}. {exercise.name}
        </p>
        <p className="mt-0.5 text-[9px] font-medium leading-snug text-muted-foreground">
          {exercise.sets} مجموعات × {volume}
        </p>
        <p className="mt-0.5 text-[9px] font-bold leading-snug text-primary">
          راحة {exercise.restLabel}
        </p>
      </div>

      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/70" />
    </Link>
  );
}

function SessionExerciseRow({
  index,
  exercise,
  orderIndex,
}: {
  index: number;
  exercise: SessionExerciseView;
  orderIndex: number;
}) {
  const volume = formatExerciseVolume(exercise);

  return (
    <Link
      to="/app/program/workout/exercise"
      search={{ exerciseId: exercise.id, index: orderIndex }}
      className="flex items-center gap-2.5 border-b border-border/50 px-3 py-2.5 last:border-b-0 transition active:bg-muted/25"
      dir="rtl"
    >
      <SessionExerciseStatusBadge index={index} exercise={exercise} />

      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-border/45 bg-muted">
        <ExerciseThumbnail
          signedUrl={exercise.thumbnailUrl}
          mediaPath={exercise.videoPath}
          alt={exercise.name}
          className="h-full w-full"
        />
      </div>

      <div className="min-w-0 flex-1 text-right">
        <p className="text-[11px] font-black leading-snug text-foreground">
          {index}. {exercise.name}
        </p>
        <p className="mt-0.5 text-[8px] font-medium leading-snug text-muted-foreground">
          {exercise.sets} مجموعات × {volume}
        </p>
      </div>

      {exercise.status === "done" ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#22C55E] text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-border" strokeWidth={1.6} />
      )}
    </Link>
  );
}

const WORKOUT_PREVIEW_EXERCISE_COUNT = 4;

function SessionExercisesSection({ exercises }: { exercises: SessionExerciseView[] }) {
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
  const [featured, ...rest] = previewExercises;
  const hasMoreExercises = exercises.length > WORKOUT_PREVIEW_EXERCISE_COUNT;

  return (
    <div className="space-y-2.5 border-t border-border/45 pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cn("inline-flex items-center gap-1.5", workoutType.cardTitle)}>
          <Dumbbell className="h-3.5 w-3.5 text-primary" />
          تمارين الحصة
        </h2>
        {hasMoreExercises ? (
          <Link
            to="/app/program/workout/exercise"
            search={{ exerciseId: featured.id, index: 0 }}
            className={cn("inline-flex items-center gap-0.5", workoutType.cardAction)}
          >
            عرض الكل
            <ChevronLeft className="h-3 w-3" />
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_8px_24px_-14px_rgba(15,23,42,0.14)]">
        <SessionExerciseFeaturedRow index={1} exercise={featured} orderIndex={0} />
        {rest.map((exercise, exerciseIndex) => (
          <SessionExerciseRow
            key={exercise.id}
            index={exerciseIndex + 2}
            exercise={exercise}
            orderIndex={exerciseIndex + 1}
          />
        ))}
      </div>

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
  const previewOnly = !features.workout_program;
  const showPremiumBadge = !is_paid;
  const sessionQuery = useTodayWorkout();
  const sessionExercises = sessionQuery.data?.exercises ?? [];
  const sessionViews = buildSessionExerciseViews(sessionExercises);
  const workoutBrief = {
    ...TODAY_WORKOUT_BRIEF_UI,
    stats: {
      exercises: sessionExercises.length,
      minutes: TODAY_WORKOUT_BRIEF.durationMin,
      calories: TODAY_WORKOUT_BRIEF.calories,
      points: TODAY_WORKOUT_BRIEF.points,
    },
  };
  const linkedDayIndex = WEEKLY_SCHEDULE.findIndex(
    (entry) => entry.id === workoutBrief.linkedDayId,
  );
  const linkedDayConnectorRight =
    linkedDayIndex >= 0 ? getDayConnectorRight(linkedDayIndex, WEEKLY_SCHEDULE.length) : undefined;

  return (
    <PreviewGate
      active={previewOnly}
      reason="هذه معاينة لشكل شاشة التمرين. فعّل برنامجك الآن لبدء التمرين فعلياً."
    >
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
          <button
            type="button"
            aria-label="الإشعارات"
            className="relative grid h-10 w-10 shrink-0 -translate-x-[14px] -translate-y-[7px] place-items-center text-foreground"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
              3
            </span>
          </button>
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
                  <p className="shrink-0 text-[15px] font-black leading-none text-[#1F2937]">28%</p>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                    <div className="h-full w-[28%] rounded-full bg-[#F97316]" />
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
            <h2 className={cn("inline-flex items-center gap-1.5", workoutType.cardTitle)}>
              <CalendarRange className="h-3.5 w-3.5 text-primary" />
              هذا الأسبوع
            </h2>
            <button type="button" className={cn("inline-flex items-center gap-0.5", workoutType.cardAction)}>
              عرض التقويم
              <ChevronLeft className="h-3 w-3" />
            </button>
          </div>
          <div className="relative grid grid-cols-7 gap-1.5">
            {WEEKLY_SCHEDULE.map((entry) => (
              <WeekDayButton
                key={entry.id}
                entry={entry}
                isLinkedToWorkout={entry.id === workoutBrief.linkedDayId}
              />
            ))}
          </div>

          {linkedDayConnectorRight ? (
            <div aria-hidden className="relative -mt-0.5 h-3 overflow-visible">
              <div
                className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-gradient-to-b from-primary via-primary/50 to-primary/15"
                style={{ right: linkedDayConnectorRight }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 w-7 -translate-x-1/2 bg-gradient-to-b from-primary/18 via-primary/6 to-transparent"
                style={{ right: linkedDayConnectorRight }}
              />
            </div>
          ) : (
            <div className="h-1" />
          )}

          <TodayWorkoutBriefCard connectorRight={linkedDayConnectorRight} brief={workoutBrief} />

          {sessionQuery.isLoading ? (
            <p className="border-t border-border/45 pt-3.5 text-center text-[10px] font-bold text-muted-foreground">
              جاري تحميل تمارين الحصة…
            </p>
          ) : sessionQuery.isError ? (
            <p className="border-t border-border/45 pt-3.5 text-center text-[10px] font-bold text-destructive">
              تعذّر تحميل تمارين اليوم. حاول مرة أخرى.
            </p>
          ) : (
            <SessionExercisesSection exercises={sessionViews} />
          )}

          <WorkoutMotivationCta points={workoutBrief.stats.points} />
        </section>
      </PlatformStack>
    </PreviewGate>
  );
}
