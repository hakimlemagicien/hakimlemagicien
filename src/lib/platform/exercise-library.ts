import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  type ExerciseMediaKind,
  type ExerciseMediaStatus,
  fetchExerciseMediaUrl,
  fetchResolvedExerciseMediaUrl,
  resolveExerciseListMediaPath,
  resolveExerciseMediaSource,
} from "@/lib/platform/exercise-media";

export {
  EXERCISE_MEDIA_BUCKET,
  SHARED_EXERCISE_PLACEHOLDER_PATH,
  SHARED_INSTRUCTIONS_PLACEHOLDER_PATH,
  buildRealExerciseVideoPath,
  buildRealInstructionsVideoPath,
  exerciseMediaQueryKey,
  fetchExerciseMediaUrl,
  fetchResolvedExerciseMediaUrl,
  resolveExerciseListMediaPath,
  resolveExerciseMediaSource,
  type ExerciseMediaKind,
  type ExerciseMediaStatus,
} from "@/lib/platform/exercise-media";

type MuscleGroupRelation = {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
};

export type ExerciseLibraryItem = {
  id: string;
  external_id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  equipment: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  primary_muscle: string | null;
  video_status: ExerciseMediaStatus;
  thumbnail_path: string | null;
  sort_order: number;
  muscle_group: MuscleGroupRelation;
};

export type ExerciseDetails = ExerciseLibraryItem & {
  exercise_type: "strength" | "cardio" | "mobility" | "warmup" | "other";
  secondary_muscles: string[];
  coach_notes: string | null;
  duration_seconds: number;
  youtube_url: string | null;
  instructions_status: ExerciseMediaStatus;
  video_path: string | null;
  instructions_video_path: string | null;
};

const database = supabase as unknown as SupabaseClient;

const exerciseLibrarySelect = `
  id,
  external_id,
  slug,
  name_en,
  name_ar,
  equipment,
  difficulty,
  primary_muscle,
  video_status,
  thumbnail_path,
  sort_order,
  muscle_group:exercise_muscle_groups!exercises_muscle_group_id_fkey (
    id,
    code,
    name_en,
    name_ar,
    sort_order
  )
`;

export async function fetchExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
  const { data, error } = await database
    .from("exercises")
    .select(exerciseLibrarySelect)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_ar", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ExerciseLibraryItem[];
}

export async function fetchExerciseDetails(exerciseId: string): Promise<ExerciseDetails> {
  const { data, error } = await database
    .from("exercises")
    .select(`
      ${exerciseLibrarySelect},
      exercise_type,
      secondary_muscles,
      coach_notes,
      duration_seconds,
      youtube_url,
      instructions_status,
      video_path,
      instructions_video_path
    `)
    .eq("id", exerciseId)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return data as unknown as ExerciseDetails;
}

export async function fetchExerciseDetailsByExternalId(
  externalId: string,
): Promise<ExerciseDetails> {
  const { data, error } = await database
    .from("exercises")
    .select(`
      ${exerciseLibrarySelect},
      exercise_type,
      secondary_muscles,
      coach_notes,
      duration_seconds,
      youtube_url,
      instructions_status,
      video_path,
      instructions_video_path
    `)
    .eq("external_id", externalId)
    .eq("is_active", true)
    .single();

  if (error) throw error;
  return data as unknown as ExerciseDetails;
}

export async function fetchExercisesByExternalIds(
  externalIds: string[],
): Promise<ExerciseDetails[]> {
  if (externalIds.length === 0) return [];

  const { data, error } = await database
    .from("exercises")
    .select(`
      ${exerciseLibrarySelect},
      exercise_type,
      secondary_muscles,
      coach_notes,
      duration_seconds,
      youtube_url,
      instructions_status,
      video_path,
      instructions_video_path
    `)
    .in("external_id", externalIds)
    .eq("is_active", true);

  if (error) throw error;

  const rows = (data ?? []) as unknown as ExerciseDetails[];
  const order = new Map(externalIds.map((id, index) => [id, index]));
  return rows.sort(
    (left, right) => (order.get(left.external_id) ?? 0) - (order.get(right.external_id) ?? 0),
  );
}

export function formatExerciseDifficulty(
  difficulty: ExerciseLibraryItem["difficulty"],
): string {
  if (difficulty === "beginner") return "مبتدئ";
  if (difficulty === "intermediate") return "متوسط";
  if (difficulty === "advanced") return "متقدم";
  return "كل المستويات";
}
