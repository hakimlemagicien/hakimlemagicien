import { fetchAdminClientTrainingProfile } from "@/lib/platform/strategy-matrix/admin-profile";
import {
  buildStrategyAssignmentPayload,
  isFailClosed,
  mapQuizGoalToClientGoalId,
  nutritionProfileFromQuizAnswers,
  parseClientQuizAnswers,
  type AllergyState,
} from "@/lib/platform/nutrition-strategy";
import { generateAdminStrategyNutrition, type AdminNutritionAssignment } from "@/lib/admin/admin-client-nutrition-api";

/** Build + persist a ready-made Strategy V1 nutrition plan for a client. */
export async function assignReadyMadeStrategyNutrition(input: {
  clientId: string;
  overviewGoal: string | null;
  startsOn: string;
  replace: boolean;
  allergy: AllergyState;
}): Promise<AdminNutritionAssignment> {
  const profileRow = await fetchAdminClientTrainingProfile(input.clientId);
  const quiz = parseClientQuizAnswers(profileRow?.answers ?? {}, profileRow?.goal ?? input.overviewGoal);
  const nutritionProfile = nutritionProfileFromQuizAnswers(quiz);
  if (!nutritionProfile) {
    throw new Error("nutrition_profile_incomplete");
  }

  const clientGoal =
    mapQuizGoalToClientGoalId(input.overviewGoal) ??
    mapQuizGoalToClientGoalId(profileRow?.goal) ??
    mapQuizGoalToClientGoalId(quiz.goalId);
  if (!clientGoal) {
    throw new Error("nutrition_goal_unmapped");
  }

  const payload = buildStrategyAssignmentPayload({
    client_goal: clientGoal,
    profile: nutritionProfile,
    day_context: { day_type: "TRAINING_DAY", training_time: "EVENING", session_time: "18:00" },
    allergies: input.allergy,
    name_ar: "خطة تغذية Strategy V1",
  });

  if (isFailClosed(payload)) {
    throw new Error(payload.code);
  }

  return generateAdminStrategyNutrition({
    clientId: input.clientId,
    payload: payload as unknown as Record<string, unknown>,
    startsOn: input.startsOn,
    replace: input.replace,
  });
}
