/**
 * Exercise Library V2 read API.
 * Candidate filters only — no ranking, prescription, or goal scores.
 * Workout runtime continues to use the lean fetchExercisesByExternalIds payload.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  type ExerciseV2Metadata,
  type V2CandidateFilters,
  filterV2Candidates,
  isV2EligibleExercise,
} from "@/lib/platform/exercise-library-v2";

const database = supabase as unknown as SupabaseClient;

const V2_SELECT = `
  external_id,
  name_en,
  name_ar,
  is_active,
  video_status,
  primary_muscle_canonical,
  secondary_muscles_canonical,
  muscle_contributions,
  primary_movement_role,
  secondary_movement_roles,
  substitution_group,
  mechanics,
  loading_type,
  required_equipment,
  equipment_state,
  location_compatibility,
  is_bodyweight,
  is_unilateral,
  execution_sides,
  supports_timed_prescription,
  prescription_mode,
  conditioning_class,
  complexity,
  beginner_eligible,
  v2_metadata_status
`;

type ExerciseV2Row = {
  external_id: string;
  name_en: string;
  name_ar: string;
  is_active: boolean;
  video_status: string;
  primary_muscle_canonical: string | null;
  secondary_muscles_canonical: string[] | null;
  muscle_contributions: ExerciseV2Metadata["muscle_contributions"] | null;
  primary_movement_role: string | null;
  secondary_movement_roles: string[] | null;
  substitution_group: string | null;
  mechanics: ExerciseV2Metadata["mechanics"];
  loading_type: ExerciseV2Metadata["loading_type"];
  required_equipment: string[] | null;
  equipment_state: ExerciseV2Metadata["equipment_state"];
  location_compatibility: ExerciseV2Metadata["location_compatibility"] | null;
  is_bodyweight: boolean | null;
  is_unilateral: boolean | null;
  execution_sides: ExerciseV2Metadata["execution_sides"];
  supports_timed_prescription: boolean | null;
  prescription_mode: ExerciseV2Metadata["prescription_mode"];
  conditioning_class: ExerciseV2Metadata["conditioning_class"];
  complexity: ExerciseV2Metadata["complexity"];
  beginner_eligible: boolean | null;
  v2_metadata_status: ExerciseV2Metadata["metadata_status"];
};

export function mapExerciseV2Row(row: ExerciseV2Row): ExerciseV2Metadata {
  return {
    external_id: row.external_id,
    name_en: row.name_en,
    name_ar: row.name_ar,
    primary_muscles: row.primary_muscle_canonical ? [row.primary_muscle_canonical] : [],
    secondary_muscles: row.secondary_muscles_canonical ?? [],
    muscle_contributions: row.muscle_contributions ?? [],
    primary_movement_role: row.primary_movement_role,
    secondary_movement_roles: row.secondary_movement_roles ?? [],
    substitution_group: row.substitution_group,
    mechanics: row.mechanics,
    loading_type: row.loading_type,
    required_equipment: row.required_equipment ?? [],
    equipment_state: row.equipment_state ?? "UNKNOWN",
    location_compatibility: row.location_compatibility ?? [],
    is_bodyweight: row.is_bodyweight,
    is_unilateral: row.is_unilateral,
    execution_sides: row.execution_sides,
    supports_timed_prescription: row.supports_timed_prescription,
    prescription_mode: row.prescription_mode,
    conditioning_class: row.conditioning_class,
    complexity: row.complexity,
    beginner_eligible: row.beginner_eligible,
    metadata_status: row.v2_metadata_status ?? "UNREVIEWED",
    media_status: row.video_status,
  };
}

export async function listV2ExerciseCandidates(
  filters: V2CandidateFilters = {},
): Promise<ExerciseV2Metadata[]> {
  const { data, error } = await database
    .from("exercises")
    .select(V2_SELECT)
    .eq("is_active", true)
    .eq("v2_metadata_status", "APPROVED");

  if (error) throw error;
  const mapped = ((data ?? []) as unknown as ExerciseV2Row[]).map(mapExerciseV2Row);
  return filterV2Candidates(mapped, filters);
}

/** Targeted current-session metadata. Does not load the full catalog. */
export async function fetchExercisesV2ByExternalIds(externalIds: string[]): Promise<ExerciseV2Metadata[]> {
  const ids = [...new Set(externalIds.filter(Boolean))];
  if (!ids.length) return [];
  const { data, error } = await database.from("exercises").select(V2_SELECT).in("external_id", ids);
  if (error) throw error;
  return ((data ?? []) as unknown as ExerciseV2Row[]).map(mapExerciseV2Row);
}

export function isRowV2Eligible(row: ExerciseV2Row): boolean {
  return isV2EligibleExercise({
    is_active: row.is_active,
    external_id: row.external_id,
    metadata_status: row.v2_metadata_status,
    primary_muscle: row.primary_muscle_canonical,
    primary_movement_role: row.primary_movement_role,
    equipment_state: row.equipment_state ?? "UNKNOWN",
    required_equipment: row.required_equipment ?? [],
    mechanics: row.mechanics,
    is_bodyweight: row.is_bodyweight,
    is_unilateral: row.is_unilateral,
    prescription_mode: row.prescription_mode,
    supports_timed_prescription: row.supports_timed_prescription,
  });
}
