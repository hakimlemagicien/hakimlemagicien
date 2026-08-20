import { supabase } from "@/integrations/supabase/client";
import type { EffortLevel } from "@/lib/platform/workout-session";

export type WorkoutSetLogInput = {
  exerciseId: string;
  exerciseExternalId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  effort: EffortLevel;
  notes: string;
  skipped: boolean;
  sessionDate?: string;
  assignmentId?: string | null;
  assignmentExerciseId?: string | null;
};

export async function upsertWorkoutSetLog(input: WorkoutSetLogInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const sessionDate = input.sessionDate ?? new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("workout_set_logs").upsert(
    {
      user_id: user.id,
      exercise_id: input.exerciseId,
      exercise_external_id: input.exerciseExternalId,
      session_date: sessionDate,
      set_number: input.setNumber,
      weight_kg: input.weightKg,
      reps: input.reps,
      effort: input.effort,
      notes: input.notes.trim() || null,
      skipped: input.skipped,
      assignment_id: input.assignmentId || null,
      assignment_exercise_id: input.assignmentExerciseId || null,
    },
    {
      onConflict: "user_id,session_date,exercise_external_id,set_number",
    },
  );

  if (error) {
    console.warn("[workout-set-logs] failed to sync set log", error.message);
  }
}
