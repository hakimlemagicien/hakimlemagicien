import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import type { DaysPerWeek, ProgramSlot, SessionRole } from "./types";

export type SessionDemand = "HIGH" | "MODERATE" | "LOW";

export type SessionBlueprint = {
  role: SessionRole;
  title: string;
  primaryRegions: string[];
  demand: SessionDemand;
  slots: ProgramSlot[];
};

function slot(
  muscleFamily: string,
  priority: ProgramSlot["priority"],
  movementRole?: string,
): ProgramSlot {
  return { muscleFamily, priority, movementRole: movementRole ?? null };
}

const LOWER_GLUTE_PRIORITY: SessionBlueprint = {
  role: "LOWER_GLUTE_PRIORITY",
  title: "Lower · glute priority",
  primaryRegions: ["GLUTES"],
  demand: "HIGH",
  slots: [
    slot("GLUTES", "PRIMARY", "HIP_EXTENSION"),
    slot("HAMSTRINGS", "SECONDARY", "HINGE"),
    slot("GLUTES", "PRIMARY", "HIP_ABDUCTION"),
  ],
};

const LOWER_GLUTE_SUPPORT: SessionBlueprint = {
  role: "LOWER_GLUTE_SUPPORT",
  title: "Lower · glute support",
  primaryRegions: ["GLUTES"],
  demand: "MODERATE",
  slots: [
    slot("GLUTES", "PRIMARY", "HIP_EXTENSION"),
    slot("QUADRICEPS", "SECONDARY", "SQUAT"),
    slot("CORE", "MAINTENANCE", "ANTI_EXTENSION"),
  ],
};

const LOWER_POSTERIOR: SessionBlueprint = {
  role: "LOWER_POSTERIOR",
  title: "Posterior chain",
  primaryRegions: ["HAMSTRINGS", "GLUTES"],
  demand: "MODERATE",
  slots: [
    slot("HAMSTRINGS", "SECONDARY", "HINGE"),
    slot("GLUTES", "PRIMARY", "HIP_EXTENSION"),
    slot("HAMSTRINGS", "SECONDARY", "KNEE_FLEXION"),
  ],
};

const LOWER_SUPPORT: SessionBlueprint = {
  role: "LOWER_SUPPORT",
  title: "Lower support",
  primaryRegions: ["QUADRICEPS", "GLUTES"],
  demand: "MODERATE",
  slots: [
    slot("QUADRICEPS", "MAINTENANCE", "SQUAT"),
    slot("GLUTES", "MAINTENANCE", "HIP_EXTENSION"),
    slot("HAMSTRINGS", "MAINTENANCE", "HINGE"),
  ],
};

const POSTERIOR_CHAIN: SessionBlueprint = {
  role: "POSTERIOR_CHAIN",
  title: "Posterior chain",
  primaryRegions: ["HAMSTRINGS", "GLUTES", "UPPER_BACK"],
  demand: "MODERATE",
  slots: [
    slot("HAMSTRINGS", "SECONDARY", "HINGE"),
    slot("UPPER_BACK", "SECONDARY", "HORIZONTAL_PULL"),
    slot("GLUTES", "PRIMARY", "HIP_EXTENSION"),
  ],
};

const UPPER_PRIORITY: SessionBlueprint = {
  role: "UPPER_PRIORITY",
  title: "Upper priority",
  primaryRegions: ["SHOULDERS", "BICEPS", "TRICEPS", "UPPER_BACK"],
  demand: "HIGH",
  slots: [
    slot("UPPER_BACK", "PRIMARY", "HORIZONTAL_PULL"),
    slot("SHOULDERS", "PRIMARY", "VERTICAL_PUSH"),
    slot("BICEPS", "PRIMARY", "ELBOW_FLEXION"),
    slot("TRICEPS", "PRIMARY", "ELBOW_EXTENSION"),
  ],
};

const UPPER_SUPPORT: SessionBlueprint = {
  role: "UPPER_SUPPORT",
  title: "Upper support",
  primaryRegions: ["LATS", "SHOULDERS"],
  demand: "MODERATE",
  slots: [
    slot("LATS", "MAINTENANCE", "VERTICAL_PULL"),
    slot("SHOULDERS", "SECONDARY", "VERTICAL_PUSH"),
    slot("TRICEPS", "MAINTENANCE", "ELBOW_EXTENSION"),
  ],
};

const PULL_POSTERIOR: SessionBlueprint = {
  role: "PULL_POSTERIOR",
  title: "Pull · posterior",
  primaryRegions: ["UPPER_BACK", "LATS", "POSTERIOR_DELTOID"],
  demand: "HIGH",
  slots: [
    slot("UPPER_BACK", "PRIMARY", "HORIZONTAL_PULL"),
    slot("LATS", "PRIMARY", "VERTICAL_PULL"),
    slot("CORE", "SECONDARY", "ANTI_EXTENSION"),
  ],
};

const CORE_SUPPORT: SessionBlueprint = {
  role: "CORE_SUPPORT",
  title: "Core support",
  primaryRegions: ["CORE"],
  demand: "LOW",
  slots: [
    slot("CORE", "SECONDARY", "ANTI_EXTENSION"),
    slot("CORE", "SECONDARY", "ANTI_ROTATION"),
    slot("UPPER_BACK", "MAINTENANCE", "HORIZONTAL_PULL"),
  ],
};

const FULL_BODY_A: SessionBlueprint = {
  role: "FULL_BODY",
  title: "Full body A",
  primaryRegions: ["GLUTES", "UPPER_BACK"],
  demand: "HIGH",
  slots: [
    slot("GLUTES", "PRIMARY", "HIP_EXTENSION"),
    slot("CHEST", "MAINTENANCE", "HORIZONTAL_PUSH"),
    slot("UPPER_BACK", "MAINTENANCE", "HORIZONTAL_PULL"),
    slot("CORE", "MAINTENANCE", "ANTI_EXTENSION"),
  ],
};

const FULL_BODY_B: SessionBlueprint = {
  role: "FULL_BODY",
  title: "Full body B",
  primaryRegions: ["HAMSTRINGS", "LATS"],
  demand: "MODERATE",
  slots: [
    slot("HAMSTRINGS", "SECONDARY", "HINGE"),
    slot("QUADRICEPS", "SECONDARY", "SQUAT"),
    slot("LATS", "MAINTENANCE", "VERTICAL_PULL"),
    slot("BICEPS", "MAINTENANCE", "ELBOW_FLEXION"),
  ],
};

const BALANCED_A: SessionBlueprint = {
  role: "BALANCED_FULL_BODY",
  title: "Balanced full body A",
  primaryRegions: ["GLUTES", "UPPER_BACK"],
  demand: "MODERATE",
  slots: [
    slot("GLUTES", "PRIMARY", "HIP_EXTENSION"),
    slot("CHEST", "SECONDARY", "HORIZONTAL_PUSH"),
    slot("UPPER_BACK", "SECONDARY", "HORIZONTAL_PULL"),
    slot("CORE", "SECONDARY", "ANTI_EXTENSION"),
  ],
};

const BALANCED_B: SessionBlueprint = {
  role: "BALANCED_FULL_BODY",
  title: "Balanced full body B",
  primaryRegions: ["QUADRICEPS", "LATS"],
  demand: "MODERATE",
  slots: [
    slot("QUADRICEPS", "SECONDARY", "SQUAT"),
    slot("HAMSTRINGS", "SECONDARY", "HINGE"),
    slot("LATS", "SECONDARY", "VERTICAL_PULL"),
    slot("SHOULDERS", "SECONDARY", "VERTICAL_PUSH"),
  ],
};

const ARMS_FULL_A: SessionBlueprint = {
  role: "FULL_BODY",
  title: "Upper-emphasis full body",
  primaryRegions: ["GLUTES"],
  demand: "MODERATE",
  slots: [
    slot("BICEPS", "PRIMARY", "ELBOW_FLEXION"),
    slot("TRICEPS", "PRIMARY", "ELBOW_EXTENSION"),
    slot("GLUTES", "MAINTENANCE", "HIP_EXTENSION"),
    slot("UPPER_BACK", "PRIMARY", "HORIZONTAL_PULL"),
  ],
};

function clone(blueprint: SessionBlueprint): SessionBlueprint {
  return {
    ...blueprint,
    primaryRegions: [...blueprint.primaryRegions],
    slots: blueprint.slots.map((item) => ({ ...item })),
  };
}

function applyReallocation(
  days: SessionBlueprint[],
  fromRegion: string | null | undefined,
  toRegion: string | null | undefined,
): SessionBlueprint[] {
  if (!fromRegion || !toRegion) return days.map(clone);
  const from = fromRegion.toUpperCase();
  const to = toRegion.toUpperCase();
  return days.map((day) => {
    const next = clone(day);
    next.slots = next.slots.map((item) => {
      if (from.includes("QUAD") && to.includes("GLUTE") && item.movementRole === "SQUAT") {
        return slot("GLUTES", "PRIMARY", "HIP_EXTENSION");
      }
      if (from.includes("SHOULDER") && (to.includes("BICEP") || to.includes("TRICEP") || to === "ARMS")) {
        if (item.movementRole === "VERTICAL_PUSH" || item.movementRole === "SHOULDER_ABDUCTION") {
          return slot("BICEPS", "PRIMARY", "ELBOW_FLEXION");
        }
      }
      return item;
    });
    return next;
  });
}

function forGoal(goal: TrainingV2CanonicalGoal, days: DaysPerWeek): SessionBlueprint[] {
  if (goal === "GLUTE_GROWTH") {
    if (days === 2) return [FULL_BODY_A, FULL_BODY_B];
    if (days === 3) return [LOWER_GLUTE_PRIORITY, UPPER_SUPPORT, LOWER_GLUTE_SUPPORT];
    if (days === 4) return [LOWER_GLUTE_PRIORITY, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT];
    return [LOWER_GLUTE_PRIORITY, UPPER_PRIORITY, LOWER_GLUTE_SUPPORT, PULL_POSTERIOR, CORE_SUPPORT];
  }
  if (goal === "TONED_ARMS_UPPER_BODY") {
    if (days === 2) return [UPPER_PRIORITY, ARMS_FULL_A];
    if (days === 3) return [UPPER_PRIORITY, LOWER_SUPPORT, UPPER_SUPPORT];
    if (days === 4) return [UPPER_PRIORITY, LOWER_SUPPORT, UPPER_SUPPORT, PULL_POSTERIOR];
    return [UPPER_PRIORITY, LOWER_SUPPORT, UPPER_SUPPORT, PULL_POSTERIOR, CORE_SUPPORT];
  }
  if (goal === "POSTURE_TONED_BACK") {
    if (days === 2) return [PULL_POSTERIOR, BALANCED_B];
    if (days === 3) return [PULL_POSTERIOR, LOWER_SUPPORT, UPPER_SUPPORT];
    if (days === 4) return [PULL_POSTERIOR, LOWER_SUPPORT, UPPER_PRIORITY, CORE_SUPPORT];
    return [PULL_POSTERIOR, LOWER_SUPPORT, UPPER_PRIORITY, CORE_SUPPORT, POSTERIOR_CHAIN];
  }
  if (goal === "FEMININE_BALANCED_BODY") {
    if (days === 2) return [BALANCED_A, BALANCED_B];
    if (days === 3) return [LOWER_GLUTE_SUPPORT, UPPER_PRIORITY, BALANCED_B];
    if (days === 4) return [LOWER_GLUTE_SUPPORT, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT];
    return [LOWER_GLUTE_SUPPORT, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT, CORE_SUPPORT];
  }
  if (goal === "SLIM_TONED_WAIST") {
    if (days === 2) return [BALANCED_A, BALANCED_B];
    if (days === 3) return [BALANCED_A, UPPER_SUPPORT, LOWER_SUPPORT];
    if (days === 4) return [BALANCED_A, UPPER_SUPPORT, LOWER_SUPPORT, CORE_SUPPORT];
    return [BALANCED_A, UPPER_SUPPORT, LOWER_SUPPORT, PULL_POSTERIOR, CORE_SUPPORT];
  }
  if (days === 2) return [BALANCED_A, BALANCED_B];
  if (days === 3) return [BALANCED_A, UPPER_SUPPORT, LOWER_SUPPORT];
  if (days === 4) return [LOWER_SUPPORT, UPPER_PRIORITY, LOWER_POSTERIOR, UPPER_SUPPORT];
  return [LOWER_SUPPORT, UPPER_PRIORITY, BALANCED_A, PULL_POSTERIOR, CORE_SUPPORT];
}

export function requiredMovementRoles(goal: TrainingV2CanonicalGoal): string[] {
  if (goal === "GLUTE_GROWTH") return ["HIP_EXTENSION"];
  if (goal === "TONED_ARMS_UPPER_BODY") return ["ELBOW_FLEXION", "ELBOW_EXTENSION"];
  if (goal === "POSTURE_TONED_BACK") return ["HORIZONTAL_PULL"];
  if (goal === "SLIM_TONED_WAIST") return ["ANTI_EXTENSION"];
  return [];
}

export function hasPushPullCoverage(usedRoles: Set<string>) {
  const push = usedRoles.has("HORIZONTAL_PUSH") || usedRoles.has("VERTICAL_PUSH");
  const pull = usedRoles.has("HORIZONTAL_PULL") || usedRoles.has("VERTICAL_PULL");
  return push && pull;
}

export function buildSessionBlueprints(input: {
  goal: TrainingV2CanonicalGoal;
  days: DaysPerWeek;
  fromRegion?: string | null;
  toRegion?: string | null;
}): SessionBlueprint[] {
  return applyReallocation(forGoal(input.goal, input.days), input.fromRegion, input.toRegion);
}
