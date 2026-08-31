import type { LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import type { TrainingStrategyLocation } from "./types";

function includesHome(text: string): boolean {
  return text.includes("home") || text.includes("منزل");
}

function includesGym(text: string): boolean {
  return text.includes("gym") || text.includes("نادي") || text.includes("club");
}

export function resolveStrategyTrainingLocation(input: {
  trainingEnvironment?: "home" | "gym" | "anywhere" | null;
  trainingType?: string | null;
  locationPreference?: string | null;
  coachOverride?: TrainingStrategyLocation | null;
}):
  | {
      ok: true;
      trainingLocation: TrainingStrategyLocation;
      permittedLocations: LocationCompatibility[];
    }
  | { ok: false; code: "UNKNOWN_TRAINING_LOCATION" } {
  if (input.coachOverride && input.coachOverride !== "UNKNOWN") {
    return {
      ok: true,
      trainingLocation: input.coachOverride,
      permittedLocations: permittedLocationsFor(input.coachOverride),
    };
  }

  const env = input.trainingEnvironment;
  if (env === "anywhere") {
    return { ok: true, trainingLocation: "BOTH", permittedLocations: ["GYM", "HOME"] };
  }
  if (env === "home") {
    return { ok: true, trainingLocation: "HOME", permittedLocations: ["HOME"] };
  }
  if (env === "gym") {
    return { ok: true, trainingLocation: "GYM", permittedLocations: ["GYM"] };
  }

  const hints = [input.trainingType, input.locationPreference].filter(Boolean).join(" ").toLowerCase();
  if (!hints.trim()) {
    return { ok: false, code: "UNKNOWN_TRAINING_LOCATION" };
  }
  const home = includesHome(hints);
  const gym = includesGym(hints);
  if (home && gym) {
    return { ok: true, trainingLocation: "BOTH", permittedLocations: ["GYM", "HOME"] };
  }
  if (home) {
    return { ok: true, trainingLocation: "HOME", permittedLocations: ["HOME"] };
  }
  if (gym) {
    return { ok: true, trainingLocation: "GYM", permittedLocations: ["GYM"] };
  }

  return { ok: false, code: "UNKNOWN_TRAINING_LOCATION" };
}

export function permittedLocationsFor(
  location: TrainingStrategyLocation,
): LocationCompatibility[] {
  if (location === "BOTH") return ["GYM", "HOME"];
  if (location === "HOME") return ["HOME"];
  if (location === "GYM") return ["GYM"];
  return [];
}

/** Primary generator location for backward-compatible single-location fields. */
export function primaryGeneratorLocation(
  location: TrainingStrategyLocation,
): LocationCompatibility {
  if (location === "HOME") return "HOME";
  return "GYM";
}
