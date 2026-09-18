import { supabase } from "@/integrations/supabase/client";

export type NutritionTemplateStatus = "draft" | "published" | "archived";
export type NutritionTemplateBucket = "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE";
export type NutritionTemplateMode = "calculated" | "curated";

export type NutritionTemplateSlot = {
  slot_key: string;
  label_ar: string;
  allowed_types: string[];
  conservative?: boolean;
};

export type NutritionTemplateRecord = {
  id: string;
  template_key: string;
  name_ar: string;
  description_ar: string | null;
  version: number;
  parent_version_id: string | null;
  strategy_bucket: NutritionTemplateBucket;
  mapped_goals: string[];
  gender_scope: "all" | "male" | "female";
  selection_mode: NutritionTemplateMode;
  cycle_days: 7;
  meals_per_day: 6;
  slot_structure: NutritionTemplateSlot[];
  selection_rules: Record<string, unknown>;
  curated_plan: Array<Record<string, unknown>>;
  notes: string | null;
  status: NutritionTemplateStatus;
  is_active: boolean;
  is_default: boolean;
  updated_at: string;
  published_at: string | null;
  assigned_clients: number;
};

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const rpc = supabase as unknown as RpcClient;

function row(value: unknown): NutritionTemplateRecord {
  return value as NutritionTemplateRecord;
}

export async function listNutritionTemplates(): Promise<NutritionTemplateRecord[]> {
  const { data, error } = await rpc.rpc("admin_list_nutrition_templates");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown[]).map(row);
}

export async function getNutritionTemplate(id: string): Promise<NutritionTemplateRecord> {
  const { data, error } = await rpc.rpc("admin_get_nutrition_template", { p_id: id });
  if (error) throw new Error(error.message);
  return row(data);
}

export async function saveNutritionTemplate(payload: Record<string, unknown>) {
  const { data, error } = await rpc.rpc("admin_save_nutrition_template", { p_payload: payload });
  if (error) throw new Error(error.message);
  return row(data);
}

export async function publishNutritionTemplate(id: string) {
  const { data, error } = await rpc.rpc("admin_publish_nutrition_template", { p_id: id });
  if (error) throw new Error(error.message);
  return row(data);
}

export async function createNutritionTemplateVersion(id: string) {
  const { data, error } = await rpc.rpc("admin_create_nutrition_template_version", {
    p_source_id: id,
  });
  if (error) throw new Error(error.message);
  return row(data);
}

export async function duplicateNutritionTemplate(id: string, templateKey: string, nameAr: string) {
  const { data, error } = await rpc.rpc("admin_duplicate_nutrition_template", {
    p_source_id: id,
    p_template_key: templateKey,
    p_name_ar: nameAr,
  });
  if (error) throw new Error(error.message);
  return row(data);
}

export async function archiveNutritionTemplate(id: string) {
  const { data, error } = await rpc.rpc("admin_archive_nutrition_template", { p_id: id });
  if (error) throw new Error(error.message);
  return row(data);
}

export async function setDefaultNutritionTemplate(id: string) {
  const { data, error } = await rpc.rpc("admin_set_default_nutrition_template", { p_id: id });
  if (error) throw new Error(error.message);
  return row(data);
}
