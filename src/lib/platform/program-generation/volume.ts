import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import { exerciseContributions } from "@/lib/platform/volume/contribution";
import { regionFamily } from "@/lib/platform/goal-intelligence/profiles";
import type { TrainingV2CanonicalGoal } from "@/lib/platform/training-v2-contracts";
import { getGoalMuscleProfile } from "@/lib/platform/prescription/goal-profile";
import type { GeneratedSession, ProgramGenerationContext, RegionalVolumeSummary, RegionalVolumeTarget } from "./types";

export function defaultRegionalTargets(input: {
  goal: TrainingV2CanonicalGoal;
  trainingLevel: ProgramGenerationContext["trainingLevel"];
  reconditioningActive?: boolean;
  recoveryState?: ProgramGenerationContext["recoveryState"];
}): RegionalVolumeTarget[] {
  const profile = getGoalMuscleProfile(input.goal);
  const conservative = input.reconditioningActive || input.recoveryState === "POOR" || input.recoveryState === "LIMITED";
  const beginner = input.trainingLevel === "BEGINNER" || input.trainingLevel === "UNASSESSED";
  const primaryTarget = conservative ? 6 : beginner ? 8 : input.goal === "FEMININE_BALANCED_BODY" ? 6 : 10;
  const primaryMax = conservative ? 12 : 18;
  const secondaryTarget = conservative ? 4 : 6;
  const maintenanceTarget = 3;
  const families = new Map<string, RegionalVolumeTarget>();
  const add = (region: string, min: number, target: number, max: number) => {
    const family = regionFamily(region);
    if (families.has(family)) return;
    families.set(family, { region: family, min, target, max });
  };
  for (const region of profile.primary) add(region, 0, primaryTarget, primaryMax);
  for (const region of profile.secondary) add(region, 0, secondaryTarget, 12);
  for (const region of profile.maintenance) add(region, 0, maintenanceTarget, 8);
  if (input.goal === "SLIM_TONED_WAIST") {
    add("CORE", 1, 3, 6);
  }
  for (const region of leadVolumeRegions(input.goal)) {
    const current = families.get(region);
    if (current) current.min = 3;
    else families.set(region, { region, min: 3, target: primaryTarget, max: primaryMax });
  }
  return [...families.values()];
}

export function leadVolumeRegions(goal: TrainingV2CanonicalGoal): string[] {
  if (goal === "GLUTE_GROWTH") return ["GLUTES"];
  if (goal === "TONED_ARMS_UPPER_BODY") return ["BICEPS", "TRICEPS"];
  if (goal === "FEMININE_BALANCED_BODY") return ["GLUTES"];
  if (goal === "POSTURE_TONED_BACK") return ["UPPER_BACK"];
  if (goal === "SLIM_TONED_WAIST") return ["CORE"];
  return [];
}

export function summarizeRegionalVolume(
  sessions: GeneratedSession[],
  catalog: Map<string, ExerciseV2Metadata>,
): RegionalVolumeSummary {
  const summary: RegionalVolumeSummary = {};
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      const meta = catalog.get(exercise.external_id);
      const rows = exerciseContributions(meta).contributions;
      for (const row of rows) {
        const family = regionFamily(row.muscle);
        const current = summary[family] ?? { effective: 0, physical: 0 };
        current.effective += exercise.sets * row.weight;
        if (row.weight >= 1) current.physical += exercise.sets;
        summary[family] = current;
      }
    }
  }
  return summary;
}

export function volumeForFamily(summary: RegionalVolumeSummary, region: string) {
  return summary[regionFamily(region)] ?? { effective: 0, physical: 0 };
}
