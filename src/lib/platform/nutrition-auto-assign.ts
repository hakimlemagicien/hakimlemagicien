import { supabase } from "@/integrations/supabase/client";
import { hydrateMealLibraryFromSupabase } from "@/lib/platform/meal-library-api";
import { getMyNutritionPreferences } from "@/lib/platform/nutrition-preferences-api";
import {
  buildStrategyAssignmentPayload,
  dayContextForTrainingMealWindow,
  isFailClosed,
  isTrainingMealWindow,
  mapQuizGoalToClientGoalId,
  nutritionProfileFromQuizAnswers,
  parseClientQuizAnswers,
  type TrainingMealWindow,
} from "@/lib/platform/nutrition-strategy";

export type NutritionAutoAssignResult =
  | { status: "assigned"; assignmentId: string | null }
  | { status: "skipped"; reason: "already_assigned" }
  | { status: "blocked"; reasonCode: string };

type AutoAssignRpcResult = {
  created?: boolean;
  assignment_id?: string | null;
  reason?: string;
};

/**
 * Creates the authenticated customer's first nutrition snapshot.
 * The RPC fixes client_id to auth.uid(), validates the slot meals again against
 * the live database, and is idempotent under a per-client transaction lock.
 */
export async function runNutritionAutoAssignment(input: {
  userId: string;
  trainingMealWindow: TrainingMealWindow | null | undefined;
}): Promise<NutritionAutoAssignResult> {
  if (!input.userId || !isTrainingMealWindow(input.trainingMealWindow)) {
    return { status: "blocked", reasonCode: "TRAINING_TIME_REQUIRED" };
  }

  const [{ data: profileRow, error: profileError }, preferences] = await Promise.all([
    supabase
      .from("training_profiles")
      .select("goal, answers")
      .eq("user_id", input.userId)
      .maybeSingle(),
    getMyNutritionPreferences(),
  ]);
  if (profileError) throw profileError;
  if (!profileRow) return { status: "blocked", reasonCode: "NUTRITION_PROFILE_INCOMPLETE" };
  if (preferences.status === "UNKNOWN") {
    return { status: "blocked", reasonCode: "ALLERGY_STATUS_REQUIRED" };
  }

  const answers = (profileRow.answers ?? {}) as Record<string, unknown>;
  const quiz = parseClientQuizAnswers(answers, profileRow.goal);
  const nutritionProfile = nutritionProfileFromQuizAnswers(quiz);
  const clientGoal =
    mapQuizGoalToClientGoalId(profileRow.goal) ?? mapQuizGoalToClientGoalId(quiz.goalId);
  if (!nutritionProfile) {
    return { status: "blocked", reasonCode: "NUTRITION_PROFILE_INCOMPLETE" };
  }
  if (!clientGoal) return { status: "blocked", reasonCode: "NUTRITION_GOAL_UNMAPPED" };

  const source = await hydrateMealLibraryFromSupabase();
  if (source !== "supabase") {
    // Assignment creation must never persist ids from an offline/stale bundle.
    return { status: "blocked", reasonCode: "LIVE_MEAL_CATALOG_REQUIRED" };
  }

  const payload = buildStrategyAssignmentPayload({
    client_goal: clientGoal,
    profile: nutritionProfile,
    day_context: dayContextForTrainingMealWindow(input.trainingMealWindow),
    allergies:
      preferences.status === "KNOWN_ALLERGIES"
        ? { status: "KNOWN_ALLERGIES", allergens: preferences.knownAllergens }
        : { status: "CONFIRMED_NONE", allergens: [] },
    restrictions: preferences.dislikedFoods,
    name_ar: "خطتك الغذائية الشخصية",
  });
  if (isFailClosed(payload)) return { status: "blocked", reasonCode: payload.code };

  // Keep the Supabase client as the method receiver. Detaching `rpc` from the
  // client loses its internal REST binding in the browser production bundle.
  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    }
  ).rpc("client_auto_assign_my_nutrition", {
    p_payload: payload as unknown as Record<string, unknown>,
  });
  if (error) throw new Error(error.message || "nutrition_auto_assign_failed");
  const result = (data ?? {}) as AutoAssignRpcResult;
  if (result.reason === "already_assigned") {
    return { status: "skipped", reason: "already_assigned" };
  }
  if (result.created === false) {
    return { status: "blocked", reasonCode: result.reason || "NUTRITION_AUTO_ASSIGN_FAILED" };
  }
  return { status: "assigned", assignmentId: result.assignment_id ?? null };
}
