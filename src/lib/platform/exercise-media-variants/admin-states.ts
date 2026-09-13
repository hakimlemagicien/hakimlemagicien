import { supabase } from "@/integrations/supabase/client";
import type { ExerciseVariantStateInput } from "./completeness";
import { GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS } from "./glute-required-set";

/** Load metadata.media_variants states for Glute Admin readiness counters. Read only. */
export async function fetchGluteFemaleMediaVariantStates(): Promise<ExerciseVariantStateInput[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("external_id, metadata")
    .in("external_id", [...GLUTE_FEMALE_MEDIA_REQUIRED_EXTERNAL_IDS]);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    externalId: row.external_id as string,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  }));
}
