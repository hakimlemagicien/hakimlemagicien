import { supabase } from "@/integrations/supabase/client";
import type { ClientTrainingLevel } from "@/lib/platform/training-v2-contracts";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { trainingStrategyInputFromProfileRow } from "./profile-source";
import type { TrainingStrategyInput } from "./types";

export async function fetchAdminClientTrainingProfile(userId: string): Promise<{
  goal: string | null;
  training_type: string | null;
  location_preference: string | null;
  answers: Record<string, unknown>;
} | null> {
  const { data, error } = await supabase
    .from("training_profiles")
    .select("goal, training_type, location_preference, answers")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    goal: data.goal,
    training_type: data.training_type,
    location_preference: data.location_preference,
    answers: (data.answers ?? {}) as Record<string, unknown>,
  };
}

export async function fetchAdminClientTrainingLevel(
  userId: string,
): Promise<ClientTrainingLevel | null> {
  const { data, error } = await supabase
    .from("client_training_levels")
    .select("training_level")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.warn("[strategy-matrix] fetchAdminClientTrainingLevel failed", error.message);
    return null;
  }
  const level = data?.training_level;
  if (level === "BEGINNER" || level === "INTERMEDIATE" || level === "UNASSESSED") {
    return level;
  }
  return null;
}

/** Loads authoritative server-side client context for admin program generation. */
export async function loadAdminClientTrainingStrategyInput(
  clientId: string,
  overview: Pick<AdminClientOverview, "goal" | "training_type">,
): Promise<TrainingStrategyInput> {
  const [profile, assessedTrainingLevel] = await Promise.all([
    fetchAdminClientTrainingProfile(clientId),
    fetchAdminClientTrainingLevel(clientId),
  ]);

  if (profile) {
    return trainingStrategyInputFromProfileRow({
      userId: clientId,
      goal: profile.goal ?? overview.goal,
      trainingType: profile.training_type ?? overview.training_type,
      locationPreference: profile.location_preference,
      answers: profile.answers,
      assessedTrainingLevel,
    });
  }

  return trainingStrategyInputFromProfileRow({
    userId: clientId,
    goal: overview.goal,
    trainingType: overview.training_type,
    assessedTrainingLevel,
  });
}
