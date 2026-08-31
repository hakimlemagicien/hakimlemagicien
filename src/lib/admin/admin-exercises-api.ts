import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";

export type AdminExerciseListItem = {
  id: string;
  external_id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  equipment: string | null;
  difficulty: string | null;
  exercise_type: string;
  primary_muscle: string | null;
  is_active: boolean;
  video_status: string;
  instructions_status: string;
  thumbnail_path: string | null;
  muscle_group_name_ar: string | null;
  updated_at: string;
  v2_metadata_status: string;
};

export type AdminExerciseDetail = AdminExerciseListItem & {
  muscle_group_id: string;
  secondary_muscles: string[];
  coach_notes: string | null;
  duration_seconds: number;
  youtube_url: string | null;
  video_path: string | null;
  instructions_video_path: string | null;
  sort_order: number;
  muscle_group?: { id: string; code: string; name_ar: string; name_en: string };
  primary_muscle_canonical: string | null;
  secondary_muscles_canonical: string[];
  primary_movement_role: string | null;
  secondary_movement_roles: string[];
  substitution_group: string | null;
  mechanics: string | null;
  loading_type: string | null;
  required_equipment: string[];
  equipment_state: string;
  location_compatibility: string[];
  is_bodyweight: boolean | null;
  is_unilateral: boolean | null;
  execution_sides: string | null;
  supports_timed_prescription: boolean | null;
  prescription_mode: string | null;
  conditioning_class: string | null;
  complexity: string | null;
  beginner_eligible: boolean | null;
};

export type AdminExerciseFilters = {
  query?: string;
  muscle?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
  type?: string | null;
  active?: boolean | null;
  offset?: number;
};

export type AdminExerciseFilterOptions = {
  muscles: Array<{ id: string; code: string; name_ar: string; name_en: string }>;
  equipment: string[];
};

function mapList(row: Record<string, unknown>): AdminExerciseListItem {
  return {
    id: String(row.id),
    external_id: String(row.external_id),
    slug: String(row.slug),
    name_ar: String(row.name_ar),
    name_en: String(row.name_en),
    equipment: (row.equipment as string | null) ?? null,
    difficulty: (row.difficulty as string | null) ?? null,
    exercise_type: String(row.exercise_type ?? "strength"),
    primary_muscle: (row.primary_muscle as string | null) ?? null,
    is_active: Boolean(row.is_active),
    video_status: String(row.video_status ?? "placeholder"),
    instructions_status: String(row.instructions_status ?? "placeholder"),
    thumbnail_path: (row.thumbnail_path as string | null) ?? null,
    muscle_group_name_ar: (row.muscle_group_name_ar as string | null) ?? null,
    updated_at: String(row.updated_at),
    v2_metadata_status: String(row.v2_metadata_status ?? "UNREVIEWED"),
  };
}

export async function fetchExerciseFilterOptions(): Promise<AdminExerciseFilterOptions> {
  const { data, error } = await supabase.rpc("admin_exercise_filter_options");
  if (error) throw error;
  const payload = (data ?? {}) as AdminExerciseFilterOptions;
  return {
    muscles: payload.muscles ?? [],
    equipment: payload.equipment ?? [],
  };
}

export async function listAdminExercises(filters: AdminExerciseFilters = {}) {
  const { data, error } = await supabase.rpc("admin_list_exercises", {
    p_query: filters.query?.trim() || null,
    p_muscle: filters.muscle || null,
    p_equipment: filters.equipment || null,
    p_difficulty: filters.difficulty || null,
    p_type: filters.type || null,
    p_active: filters.active ?? null,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(filters.offset ?? 0, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapList);
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}

export async function getAdminExercise(id: string): Promise<AdminExerciseDetail> {
  const { data, error } = await supabase.rpc("admin_get_exercise", { p_id: id });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  const muscle = row.muscle_group as AdminExerciseDetail["muscle_group"];
  return {
    ...mapList(row),
    muscle_group_id: String(row.muscle_group_id),
    secondary_muscles: (row.secondary_muscles as string[]) ?? [],
    coach_notes: (row.coach_notes as string | null) ?? null,
    duration_seconds: Number(row.duration_seconds ?? 30),
    youtube_url: (row.youtube_url as string | null) ?? null,
    video_path: (row.video_path as string | null) ?? null,
    instructions_video_path: (row.instructions_video_path as string | null) ?? null,
    sort_order: Number(row.sort_order ?? 0),
    muscle_group: muscle,
    primary_muscle_canonical: (row.primary_muscle_canonical as string | null) ?? null,
    secondary_muscles_canonical: (row.secondary_muscles_canonical as string[]) ?? [],
    primary_movement_role: (row.primary_movement_role as string | null) ?? null,
    secondary_movement_roles: (row.secondary_movement_roles as string[]) ?? [],
    substitution_group: (row.substitution_group as string | null) ?? null,
    mechanics: (row.mechanics as string | null) ?? null,
    loading_type: (row.loading_type as string | null) ?? null,
    required_equipment: (row.required_equipment as string[]) ?? [],
    equipment_state: String(row.equipment_state ?? "UNKNOWN"),
    location_compatibility: (row.location_compatibility as string[]) ?? [],
    is_bodyweight: typeof row.is_bodyweight === "boolean" ? row.is_bodyweight : null,
    is_unilateral: typeof row.is_unilateral === "boolean" ? row.is_unilateral : null,
    execution_sides: (row.execution_sides as string | null) ?? null,
    supports_timed_prescription:
      typeof row.supports_timed_prescription === "boolean" ? row.supports_timed_prescription : null,
    prescription_mode: (row.prescription_mode as string | null) ?? null,
    conditioning_class: (row.conditioning_class as string | null) ?? null,
    complexity: (row.complexity as string | null) ?? null,
    beginner_eligible: typeof row.beginner_eligible === "boolean" ? row.beginner_eligible : null,
  };
}

export async function saveAdminExercise(
  payload: Record<string, unknown>,
  expectedUpdatedAt: string | null,
): Promise<AdminExerciseDetail> {
  const { data, error } = await supabase.rpc("admin_save_exercise", {
    p_payload: payload,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return getAdminExercise(String((data as { id: string }).id));
}

export async function setAdminExerciseActive(id: string, active: boolean): Promise<AdminExerciseDetail> {
  const { error } = await supabase.rpc("admin_set_exercise_active", { p_id: id, p_active: active });
  if (error) throw error;
  return getAdminExercise(id);
}

export function emptyExerciseDraft(muscleGroupId = ""): Omit<AdminExerciseDetail, "updated_at"> & { updated_at: string | null } {
  return {
    id: "",
    external_id: "",
    slug: "",
    name_ar: "",
    name_en: "",
    equipment: "",
    difficulty: "beginner",
    exercise_type: "strength",
    primary_muscle: "",
    is_active: false,
    video_status: "placeholder",
    instructions_status: "placeholder",
    thumbnail_path: null,
    muscle_group_name_ar: null,
    updated_at: null,
    muscle_group_id: muscleGroupId,
    secondary_muscles: [],
    coach_notes: "",
    duration_seconds: 30,
    youtube_url: "",
    video_path: "",
    instructions_video_path: "",
    sort_order: 0,
    v2_metadata_status: "UNREVIEWED",
    primary_muscle_canonical: "",
    secondary_muscles_canonical: [],
    primary_movement_role: "",
    secondary_movement_roles: [],
    substitution_group: "",
    mechanics: null,
    loading_type: null,
    required_equipment: [],
    equipment_state: "UNKNOWN",
    location_compatibility: [],
    is_bodyweight: null,
    is_unilateral: null,
    execution_sides: "BILATERAL",
    supports_timed_prescription: null,
    prescription_mode: "REPS",
    conditioning_class: null,
    complexity: null,
    beginner_eligible: null,
  };
}
