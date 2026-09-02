import type {
  ClientGoalId,
  ClientNutritionProfile,
  NutritionGoalProfile,
  NutritionObjective,
} from "./types";

const DIRECT_MAP: Record<
  ClientGoalId,
  { nutrition_objective: NutritionObjective; suitable_goals: string[] }
> = {
  FAT_LOSS: { nutrition_objective: "FAT_LOSS", suitable_goals: ["fat_loss"] },
  MUSCLE_GAIN: { nutrition_objective: "MUSCLE_GAIN", suitable_goals: ["muscle_gain"] },
  BODY_RECOMPOSITION: {
    nutrition_objective: "BODY_RECOMPOSITION",
    suitable_goals: ["body_recomposition", "maintenance"],
  },
  GLUTE_GROWTH: {
    nutrition_objective: "MUSCLE_GAIN",
    suitable_goals: ["muscle_gain"],
  },
  WAIST_DEFINITION: {
    nutrition_objective: "FAT_LOSS",
    suitable_goals: ["fat_loss", "maintenance"],
  },
  UPPER_BODY_DEFINITION: {
    nutrition_objective: "BODY_RECOMPOSITION",
    suitable_goals: ["muscle_gain", "maintenance"],
  },
  FEMININE_BALANCED_BODY: {
    nutrition_objective: "BODY_RECOMPOSITION",
    suitable_goals: ["maintenance", "body_recomposition"],
  },
  STRENGTH_PERFORMANCE: {
    nutrition_objective: "PERFORMANCE_MAINTENANCE",
    suitable_goals: ["maintenance", "muscle_gain"],
  },
  FITNESS_ENDURANCE: {
    nutrition_objective: "PERFORMANCE_MAINTENANCE",
    suitable_goals: ["maintenance", "fat_loss"],
  },
  MOBILITY_RECOVERY: {
    nutrition_objective: "MAINTENANCE",
    suitable_goals: ["maintenance"],
  },
  POSTURE_BACK_HEALTH: {
    nutrition_objective: "MAINTENANCE",
    suitable_goals: ["maintenance"],
  },
  GENERAL_HEALTH_FITNESS: {
    nutrition_objective: "MAINTENANCE",
    suitable_goals: ["maintenance", "fat_loss"],
  },
};

const PROFILE_DEPENDENT_GOALS: ClientGoalId[] = [
  "WAIST_DEFINITION",
  "UPPER_BODY_DEFINITION",
  "FEMININE_BALANCED_BODY",
];

export function mapQuizGoalToClientGoalId(goalId: string | null | undefined): ClientGoalId | null {
  const key = goalId?.trim().toLowerCase() ?? "";
  const map: Record<string, ClientGoalId> = {
    fat: "FAT_LOSS",
    muscle: "MUSCLE_GAIN",
    glutes: "GLUTE_GROWTH",
    waist: "WAIST_DEFINITION",
    body: "FEMININE_BALANCED_BODY",
    tone: "UPPER_BODY_DEFINITION",
    fitness: "FITNESS_ENDURANCE",
    athletic: "GENERAL_HEALTH_FITNESS",
    shape: "BODY_RECOMPOSITION",
    gain: "MUSCLE_GAIN",
    fat_loss: "FAT_LOSS",
    muscle_gain: "MUSCLE_GAIN",
  };
  return map[key] ?? null;
}

function resolveProfileDependentObjective(
  clientGoal: ClientGoalId,
  profile: ClientNutritionProfile,
): NutritionObjective | null {
  if (!profile.body_fat_category) return null;

  if (clientGoal === "WAIST_DEFINITION") {
    if (profile.body_fat_category === "high") return "FAT_LOSS";
    return "BODY_RECOMPOSITION";
  }

  if (clientGoal === "UPPER_BODY_DEFINITION") {
    if (profile.lean_mass_focus === true) return "MUSCLE_GAIN";
    if (profile.body_fat_category === "high") return "FAT_LOSS";
    if (profile.recomposition_signal === true) return "BODY_RECOMPOSITION";
    return "BODY_RECOMPOSITION";
  }

  if (clientGoal === "FEMININE_BALANCED_BODY") {
    if (profile.recomposition_signal === true) return "BODY_RECOMPOSITION";
    if (profile.lean_mass_focus === true) return "MUSCLE_GAIN";
    if (profile.body_fat_category === "high") return "FAT_LOSS";
    return "BODY_RECOMPOSITION";
  }

  return null;
}

export function resolveNutritionGoalProfile(input: {
  clientGoal: ClientGoalId;
  profile: ClientNutritionProfile;
}):
  | NutritionGoalProfile
  | { code: "NUTRITION_PROFILE_RESOLUTION_REQUIRED"; missing: string[] } {
  const base = DIRECT_MAP[input.clientGoal];
  if (!base) {
    return { code: "NUTRITION_PROFILE_RESOLUTION_REQUIRED", missing: ["client_goal"] };
  }

  let nutrition_objective = base.nutrition_objective;

  if (PROFILE_DEPENDENT_GOALS.includes(input.clientGoal)) {
    const resolved = resolveProfileDependentObjective(input.clientGoal, input.profile);
    if (!resolved) {
      const missing: string[] = [];
      if (!input.profile.body_fat_category) missing.push("body_fat_category");
      if (input.clientGoal === "UPPER_BODY_DEFINITION" && input.profile.lean_mass_focus == null) {
        missing.push("lean_mass_focus");
      }
      if (
        (input.clientGoal === "UPPER_BODY_DEFINITION" ||
          input.clientGoal === "FEMININE_BALANCED_BODY") &&
        input.profile.recomposition_signal == null
      ) {
        missing.push("recomposition_signal");
      }
      return { code: "NUTRITION_PROFILE_RESOLUTION_REQUIRED", missing };
    }
    nutrition_objective = resolved;
  }

  return {
    client_goal: input.clientGoal,
    nutrition_objective,
    goal_context: input.clientGoal,
    suitable_goals_filter: base.suitable_goals,
  };
}

export function allClientGoals(): ClientGoalId[] {
  return Object.keys(DIRECT_MAP) as ClientGoalId[];
}
