import { supabase } from "@/integrations/supabase/client";
import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import { trainingStrategyInputFromProfileRow } from "@/lib/platform/strategy-matrix/profile-source";
import type { TrainingStrategyInput } from "@/lib/platform/strategy-matrix/types";

async function fetchClientTrainingLevel(userId: string): Promise<ClientTrainingLevel | null> {
  const { data, error } = await supabase
    .from("client_training_levels")
    .select("training_level")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[client-training-strategy-input] level fetch failed", error.message);
    return null;
  }
  const level = data?.training_level;
  if (level === "BEGINNER" || level === "INTERMEDIATE" || level === "UNASSESSED") return level;
  return null;
}

/** Client-side strategy input — mirrors admin load path without coach overview. */
export async function loadClientTrainingStrategyInput(userId: string): Promise<TrainingStrategyInput | null> {
  const { data, error } = await supabase
    .from("training_profiles")
    .select("goal, training_type, location_preference, answers")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const assessedTrainingLevel = await fetchClientTrainingLevel(userId);

  return trainingStrategyInputFromProfileRow({
    userId,
    goal: data.goal ?? null,
    trainingType: data.training_type ?? null,
    locationPreference: data.location_preference ?? null,
    answers: (data.answers ?? {}) as Record<string, unknown>,
    assessedTrainingLevel,
  });
}
