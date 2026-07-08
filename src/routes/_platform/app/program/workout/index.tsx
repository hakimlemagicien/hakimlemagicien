import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronLeft, Clock, Dumbbell, Flame } from "lucide-react";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlatformDetailHeader } from "@/components/platform/shared/PlatformDetailHeader";
import {
  WORKOUT_DAY_SEED,
  WORKOUT_EXERCISES_SEED,
  type WorkoutExerciseSeed,
} from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/app/program/workout/")({
  head: () => ({ meta: [{ title: "تمرين اليوم | Hakim Platform" }] }),
  component: WorkoutDayPage,
});

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Clock;
  value: string;
  label: string;
}) {
  return (
    <div className="platform-card flex flex-1 flex-col items-center gap-1 p-3 text-center">
      <Icon className="h-5 w-5 text-primary" />
      <p className="text-sm font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ExerciseRow({ exercise, index }: { exercise: WorkoutExerciseSeed; index: number }) {
  return (
    <Link
      to="/app/program/workout/exercise"
      className="platform-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          exercise.done ? "bg-secondary-soft text-success" : "bg-primary-soft text-primary",
        )}
      >
        {exercise.done ? <Check className="h-5 w-5" strokeWidth={3} /> : <Dumbbell className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">
          {index + 1}. {exercise.name}
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {exercise.detail} · {exercise.muscle}
        </p>
      </div>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function WorkoutDayPage() {
  const day = WORKOUT_DAY_SEED;

  return (
    <PlatformStack>
      <PlatformDetailHeader title={day.title} subtitle={day.meta} backTo="/app/program" />

      <div className="flex items-stretch gap-2">
        <StatCard icon={Dumbbell} value={`${day.exercisesCount}`} label="تمارين" />
        <StatCard icon={Clock} value={`${day.durationMin} د`} label="المدة" />
        <StatCard icon={Flame} value={`${day.calories}`} label="سعرة" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-black text-foreground">قائمة التمارين</h2>
        {WORKOUT_EXERCISES_SEED.map((exercise, index) => (
          <ExerciseRow key={exercise.id} exercise={exercise} index={index} />
        ))}
      </div>

      <Link
        to="/app/program/workout/exercise"
        className="flex h-12 shrink-0 items-center justify-center rounded-xl cta-gradient text-sm font-black text-white shadow-cta transition active:scale-[0.99]"
      >
        ابدأ التمرين
      </Link>
    </PlatformStack>
  );
}
