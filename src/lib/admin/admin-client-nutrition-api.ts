import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LIBRARY_PAGE_SIZE, clampAdminLibraryLimit } from "./admin-libraries";

export type AdminNutritionSlot = {
  id: string;
  slot_key: string;
  slot_label: string;
  time_label: string;
  hour: number;
  minute: number;
  sort_order: number;
  source_meal_id: string | null;
  source_external_id: string;
  name_ar: string;
  name_en: string | null;
  meal_type: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: number | null;
  serving_unit: string | null;
  servings: number;
  allergens: string[];
  notes_ar: string | null;
};

export type AdminNutritionAssignment = {
  id: string;
  client_id: string;
  status: string;
  name_ar: string | null;
  starts_on: string | null;
  assigned_at: string;
  assigned_by: string | null;
  ended_at: string | null;
  watch_allergens: string[];
  notes_ar: string | null;
  updated_at: string;
  snapshot_complete: boolean;
  allergen_conflict: boolean;
  library_allergen_review: boolean;
  planned_calories: number;
  planned_protein_g: number;
  planned_carbs_g: number;
  planned_fat_g: number;
  slots: AdminNutritionSlot[];
};

export type AdminNutritionSummary = {
  id: string;
  status: string;
  name_ar: string | null;
  starts_on: string | null;
  assigned_at: string;
  ended_at: string | null;
  snapshot_complete: boolean;
  allergen_conflict: boolean;
};

export type AdminNutritionLogRow = {
  id: string;
  slot_key: string;
  source_external_id: string;
  session_date: string;
  status: string;
  assignment_id: string | null;
  created_at: string;
};

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapSlot(row: Record<string, unknown>): AdminNutritionSlot {
  return {
    id: String(row.id),
    slot_key: String(row.slot_key),
    slot_label: String(row.slot_label),
    time_label: String(row.time_label),
    hour: num(row.hour),
    minute: num(row.minute),
    sort_order: num(row.sort_order),
    source_meal_id: (row.source_meal_id as string | null) ?? null,
    source_external_id: String(row.source_external_id),
    name_ar: String(row.name_ar),
    name_en: (row.name_en as string | null) ?? null,
    meal_type: (row.meal_type as string | null) ?? null,
    calories: num(row.calories),
    protein_g: num(row.protein_g),
    carbs_g: num(row.carbs_g),
    fat_g: num(row.fat_g),
    serving_size: row.serving_size == null ? null : num(row.serving_size),
    serving_unit: (row.serving_unit as string | null) ?? null,
    servings: num(row.servings) || 1,
    allergens: (row.allergens as string[]) ?? [],
    notes_ar: (row.notes_ar as string | null) ?? null,
  };
}

function mapDetail(row: Record<string, unknown>): AdminNutritionAssignment {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    status: String(row.status),
    name_ar: (row.name_ar as string | null) ?? null,
    starts_on: (row.starts_on as string | null) ?? null,
    assigned_at: String(row.assigned_at),
    assigned_by: (row.assigned_by as string | null) ?? null,
    ended_at: (row.ended_at as string | null) ?? null,
    watch_allergens: (row.watch_allergens as string[]) ?? [],
    notes_ar: (row.notes_ar as string | null) ?? null,
    updated_at: String(row.updated_at),
    snapshot_complete: Boolean(row.snapshot_complete),
    allergen_conflict: Boolean(row.allergen_conflict),
    library_allergen_review: Boolean(row.library_allergen_review),
    planned_calories: num(row.planned_calories),
    planned_protein_g: num(row.planned_protein_g),
    planned_carbs_g: num(row.planned_carbs_g),
    planned_fat_g: num(row.planned_fat_g),
    slots: ((row.slots as Record<string, unknown>[]) ?? []).map(mapSlot),
  };
}

export async function assignAdminClientNutrition(input: {
  clientId: string;
  nameAr: string;
  startsOn: string;
  replace: boolean;
  watchAllergens: string[];
  slots: Array<{ slot_key: string; meal_id: string; servings: number; notes_ar?: string }>;
}): Promise<AdminNutritionAssignment> {
  const { data, error } = await supabase.rpc("admin_assign_client_nutrition", {
    p_client_id: input.clientId,
    p_payload: {
      name_ar: input.nameAr,
      watch_allergens: input.watchAllergens,
      slots: input.slots,
    },
    p_starts_on: input.startsOn,
    p_replace: input.replace,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function getAdminClientNutritionAssignment(id: string): Promise<AdminNutritionAssignment> {
  const { data, error } = await supabase.rpc("admin_get_client_nutrition_assignment", {
    p_assignment_id: id,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function listAdminClientNutritionAssignments(clientId: string, offset = 0) {
  const { data, error } = await supabase.rpc("admin_list_client_nutrition_assignments", {
    p_client_id: clientId,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(offset, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    status: String(row.status),
    name_ar: (row.name_ar as string | null) ?? null,
    starts_on: (row.starts_on as string | null) ?? null,
    assigned_at: String(row.assigned_at),
    ended_at: (row.ended_at as string | null) ?? null,
    snapshot_complete: Boolean(row.snapshot_complete),
    allergen_conflict: Boolean(row.allergen_conflict),
  })) satisfies AdminNutritionSummary[];
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}

export async function endAdminClientNutrition(id: string, status: "completed" | "cancelled") {
  const { data, error } = await supabase.rpc("admin_end_client_nutrition", {
    p_assignment_id: id,
    p_status: status,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function saveAdminClientNutritionSlots(
  assignmentId: string,
  payload: Record<string, unknown>,
  expectedUpdatedAt: string | null,
) {
  const { data, error } = await supabase.rpc("admin_save_client_nutrition_slots", {
    p_assignment_id: assignmentId,
    p_payload: payload,
    p_expected_updated_at: expectedUpdatedAt,
  });
  if (error) throw error;
  return mapDetail(data as Record<string, unknown>);
}

export async function listAdminClientNutritionLogs(clientId: string, offset = 0) {
  const { data, error } = await supabase.rpc("admin_list_client_nutrition_logs", {
    p_client_id: clientId,
    p_limit: clampAdminLibraryLimit(ADMIN_LIBRARY_PAGE_SIZE),
    p_offset: Math.max(offset, 0),
  });
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    slot_key: String(row.slot_key),
    source_external_id: String(row.source_external_id),
    session_date: String(row.session_date),
    status: String(row.status),
    assignment_id: (row.assignment_id as string | null) ?? null,
    created_at: String(row.created_at),
  })) satisfies AdminNutritionLogRow[];
  return {
    rows,
    totalCount: Number((data as Array<{ total_count?: number }> | null)?.[0]?.total_count ?? rows.length),
  };
}
