import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";

export type AdminProgramListItem = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  goal: string | null;
  level: string | null;
  duration_weeks: number;
  days_per_week: number;
  version: number;
  is_published: boolean;
  archived_at: string | null;
  assignment_count: number;
  updated_at: string;
};

export type AdminProgramExercise = {
  id?: string;
  exercise_id: string;
  sort_order: number;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  reps_label: string | null;
  rest_seconds: number;
  suggested_weight_kg: number | null;
  notes_ar: string | null;
  exercise_name_ar?: string;
  exercise_name_en?: string;
  exercise_external_id?: string;
};

export type AdminProgramDay = {
  id?: string;
  day_number: number;
  day_type: string;
  title_ar: string;
  muscle_focus: string | null;
  estimated_minutes: number | null;
  estimated_calories: number | null;
  exercises: AdminProgramExercise[];
};

export type AdminProgramWeek = {
  id?: string;
  week_number: number;
  title_ar: string | null;
  notes_ar: string | null;
  days: AdminProgramDay[];
};

export type AdminProgramDetail = AdminProgramListItem & {
  description_ar: string | null;
  versioning_complete: boolean;
  weeks: AdminProgramWeek[];
};

function mapList(row: Record<string, unknown>): AdminProgramListItem {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name_ar: String(row.name_ar),
    name_en: (row.name_en as string | null) ?? null,
    goal: (row.goal as string | null) ?? null,
    level: (row.level as string | null) ?? null,
    duration_weeks: Number(row.duration_weeks ?? 12),
    days_per_week: Number(row.days_per_week ?? 4),
    version: Number(row.version ?? 1),
    is_published: Boolean(row.is_published),
    archived_at: (row.archived_at as string | null) ?? null,
    assignment_count: Number(row.assignment_count ?? 0),
    updated_at: String(row.updated_at),
  };
}

export async function listAdminProgramTemplates(opts: {
  query?: string;
  goal?: string | null;
  level?: string | null;
  status?: string | null;
  offset?: number;
}) {
  const { data, error } = await supabase.rpc("admin_list_program_templates", {
    p_query: opts.query?.trim() || null,
    p_goal: opts.goal || null,
    p_level: opts.level || null,
    p_status: opts.status || null,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(opts.offset ?? 0, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapList);
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}

export async function getAdminProgramTemplate(id: string): Promise<AdminProgramDetail> {
  const { data, error } = await supabase.rpc("admin_get_program_template", { p_id: id });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return {
    ...mapList(row),
    description_ar: (row.description_ar as string | null) ?? "",
    versioning_complete: false,
    weeks: ((row.weeks as AdminProgramWeek[]) ?? []).map((week) => ({
      ...week,
      days: (week.days ?? []).map((day) => ({
        ...day,
        exercises: day.exercises ?? [],
      })),
    })),
  };
}

export async function saveAdminProgramTemplate(
  payload: Record<string, unknown>,
  expectedUpdatedAt: string | null,
): Promise<AdminProgramDetail> {
  const { data, error } = await supabase.rpc("admin_save_program_template", {
    p_payload: payload,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return getAdminProgramTemplate(String((data as { id: string }).id));
}

export async function publishAdminProgramTemplate(id: string): Promise<AdminProgramDetail> {
  const { error } = await supabase.rpc("admin_publish_program_template", { p_id: id });
  if (error) throw error;
  return getAdminProgramTemplate(id);
}

export async function archiveAdminProgramTemplate(id: string): Promise<AdminProgramDetail> {
  const { error } = await supabase.rpc("admin_archive_program_template", { p_id: id });
  if (error) throw error;
  return getAdminProgramTemplate(id);
}

export function emptyProgramExercise(exercise?: {
  id: string;
  name_ar: string;
  name_en: string;
  external_id: string;
}): AdminProgramExercise {
  return {
    exercise_id: exercise?.id ?? "",
    sort_order: 0,
    sets: 3,
    reps_min: 8,
    reps_max: 12,
    reps_label: "",
    rest_seconds: 60,
    suggested_weight_kg: null,
    notes_ar: "",
    exercise_name_ar: exercise?.name_ar,
    exercise_name_en: exercise?.name_en,
    exercise_external_id: exercise?.external_id,
  };
}

export function emptyProgramDay(dayNumber = 1): AdminProgramDay {
  return {
    day_number: dayNumber,
    day_type: "workout",
    title_ar: `اليوم ${dayNumber}`,
    muscle_focus: "",
    estimated_minutes: 45,
    estimated_calories: null,
    exercises: [],
  };
}

export function emptyProgramWeek(weekNumber = 1): AdminProgramWeek {
  return {
    week_number: weekNumber,
    title_ar: `الأسبوع ${weekNumber}`,
    notes_ar: "",
    days: [emptyProgramDay(1)],
  };
}

export function emptyProgramDraft(): AdminProgramDetail {
  return {
    id: "",
    slug: "",
    name_ar: "",
    name_en: "",
    goal: "fitness",
    level: "beginner",
    duration_weeks: 12,
    days_per_week: 4,
    version: 1,
    is_published: false,
    archived_at: null,
    assignment_count: 0,
    updated_at: "",
    description_ar: "",
    versioning_complete: false,
    weeks: [emptyProgramWeek(1)],
  };
}
