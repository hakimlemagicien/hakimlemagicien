import { ExercisePlayerView } from "@/components/platform/workout/ExercisePlayerView";
import { PreviewGate } from "@/components/platform/shared/PreviewGate";
import { useWorkoutPlayer } from "@/hooks/useWorkoutPlayer";
import { useTodayWorkout } from "@/hooks/useTodayWorkout";
import { useMembership } from "@/hooks/useMembership";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";

type ExercisePlayerSearch = {
  exerciseId?: string;
  index?: number;
};

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
  }),
  component: ExercisePlayerPage,
});

function ExercisePlayerPage() {
  const { features } = useMembership();
  const previewOnly = !features.workout_program;
  const { exerciseId, index = 0 } = Route.useSearch();
  const sessionQuery = useTodayWorkout();

  const exercises = sessionQuery.data?.exercises ?? [];
  const meta = sessionQuery.data?.meta ?? {
    points: 0,
    durationMin: 0,
    calories: 0,
    streakDays: 0,
    totalExercises: 0,
  };

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

  return (
    <PreviewGate
      active={previewOnly}
      reason="هذه معاينة لتجربة التمرين. فعّل برنامجك الآن للاستفادة الكاملة."
    >
      <div data-preview-safe>
        <ExercisePlayerView player={player} />
      </div>
    </PreviewGate>
  );
}
