import { ExercisePlayerView } from "@/components/platform/workout/ExercisePlayerView";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { useWorkoutPlayer } from "@/hooks/useWorkoutPlayer";
import { useWorkoutDaySession } from "@/hooks/useTodayWorkout";
import { useMembership } from "@/hooks/useMembership";
import {
  getWeekdayIdFromDate,
  isFreeUnlockedExerciseIndex,
  type WeekdayId,
} from "@/lib/platform/weekly-workout-schedule";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  head: () => ({ meta: [{ title: "تمرين الحصة | Hakim Platform" }] }),
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
  const { features } = useMembership();
  const { openUpgrade } = useUpgradeFlow();
  const hasWorkoutProgram = features.workout_program;
  const freePreview = !hasWorkoutProgram;
  const { exerciseId, index = 0, day = getWeekdayIdFromDate() } = Route.useSearch();
  const sessionQuery = useWorkoutDaySession(day, hasWorkoutProgram);

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

  if (freePreview && (freeDayFullyLocked || !isFreeUnlockedExerciseIndex(index))) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Lock className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div>
          <p className="text-sm font-black text-foreground">
            {freeDayFullyLocked ? "تمارين هذا اليوم مقفلة" : "هذا التمرين مقفل"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {freeDayFullyLocked
              ? "يمكنك معاينة شكل البرنامج — التمرين المجاني متاح في يوم اليوم فقط."
              : "التمرين الأول للصدر متاح للمعاينة. فعّل برنامجك لفتح كل تمارين الأسبوع."}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            openUpgrade("فعّل برنامجك الآن لفتح كل تمارين الأسبوع — معاينة الصدر متاحة مجاناً.")
          }
          className="rounded-xl cta-gradient px-5 py-2.5 text-xs font-black text-white shadow-cta"
        >
          ترقية الآن
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

  const player = useWorkoutPlayer(exercises, meta, initialIndex);

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
