import type { TodayWorkoutPrescription } from "@/lib/platform/today-workout";
import type { WeekdayWorkoutPlan } from "@/lib/platform/weekly-workout-schedule";

export type SessionAnatomyVisualKey =
  | "PUSH"
  | "PULL"
  | "LEGS"
  | "UPPER"
  | "FULL_BODY"
  | "ARMS"
  | "SHOULDERS"
  | "CORE"
  | "REST";

export type SessionMuscleRegion =
  | "CHEST"
  | "UPPER_BACK"
  | "LATS"
  | "SHOULDERS"
  | "BICEPS"
  | "TRICEPS"
  | "QUADRICEPS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES"
  | "CORE";

const LOWER_BODY: SessionMuscleRegion[] = ["QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES"];
const UPPER_BODY: SessionMuscleRegion[] = [
  "CHEST",
  "UPPER_BACK",
  "LATS",
  "SHOULDERS",
  "BICEPS",
  "TRICEPS",
];

const PREFIX_REGION: Record<string, SessionMuscleRegion> = {
  CH: "CHEST",
  BA: "UPPER_BACK",
  SH: "SHOULDERS",
  BI: "BICEPS",
  TR: "TRICEPS",
  LE: "QUADRICEPS",
  GL: "GLUTES",
  AB: "CORE",
  CA: "CALVES",
};

const CANONICAL_REGION: Record<string, SessionMuscleRegion> = {
  CHEST: "CHEST",
  BACK: "UPPER_BACK",
  UPPER_BACK: "UPPER_BACK",
  LATS: "LATS",
  SHOULDERS: "SHOULDERS",
  ANTERIOR_DELTOID: "SHOULDERS",
  LATERAL_DELTOID: "SHOULDERS",
  POSTERIOR_DELTOID: "SHOULDERS",
  BICEPS: "BICEPS",
  TRICEPS: "TRICEPS",
  QUADRICEPS: "QUADRICEPS",
  HAMSTRINGS: "HAMSTRINGS",
  GLUTES: "GLUTES",
  GLUTEUS_MAXIMUS: "GLUTES",
  GLUTEUS_MEDIUS: "GLUTES",
  GLUTEUS_MINIMUS: "GLUTES",
  CALVES: "CALVES",
  CORE: "CORE",
  RECTUS_ABDOMINIS: "CORE",
  OBLIQUES: "CORE",
  FULL_BODY: "CHEST",
};

const REGION_LABEL_AR: Record<SessionMuscleRegion, string> = {
  CHEST: "صدر",
  UPPER_BACK: "ظهر",
  LATS: "ظهر",
  SHOULDERS: "أكتاف",
  BICEPS: "بايسبس",
  TRICEPS: "ترايسبس",
  QUADRICEPS: "أرجل",
  HAMSTRINGS: "أرجل",
  GLUTES: "أرجل",
  CALVES: "أرجل",
  CORE: "بطن",
};

export type SessionMuscleSummary = {
  regions: SessionMuscleRegion[];
  regionWeights: Record<SessionMuscleRegion, number>;
  visualKey: SessionAnatomyVisualKey;
  displayNameAr: string;
  dominantExternalId: string | null;
};

function normalizeRegion(value: string | null | undefined): SessionMuscleRegion | null {
  if (!value?.trim()) return null;
  const key = value.trim().toUpperCase().replace(/\s+/g, "_");
  return CANONICAL_REGION[key] ?? null;
}

function regionFromExternalId(externalId: string): SessionMuscleRegion | null {
  const prefix = externalId.slice(0, 2).toUpperCase();
  return PREFIX_REGION[prefix] ?? null;
}

function addWeight(
  weights: Record<SessionMuscleRegion, number>,
  region: SessionMuscleRegion,
  amount: number,
) {
  weights[region] = (weights[region] ?? 0) + amount;
}

export function summarizeSessionMuscles(input: {
  externalIds: string[];
  primaryMuscles?: Array<string | null | undefined>;
  muscleFocus?: string | null;
}): SessionMuscleSummary {
  const weights = {} as Record<SessionMuscleRegion, number>;
  const focus = (input.muscleFocus ?? "").toLowerCase();

  if (focus.includes("صدر")) addWeight(weights, "CHEST", 2);
  if (focus.includes("ظهر")) addWeight(weights, "UPPER_BACK", 2);
  if (focus.includes("كتف") || focus.includes("أكتاف")) addWeight(weights, "SHOULDERS", 2);
  if (focus.includes("باي")) addWeight(weights, "BICEPS", 2);
  if (focus.includes("تراي")) addWeight(weights, "TRICEPS", 2);
  if (focus.includes("رجل") || focus.includes("أرجل") || focus.includes("فخذ")) addWeight(weights, "QUADRICEPS", 2);
  if (focus.includes("جلوت") || focus.includes("مقعد")) addWeight(weights, "GLUTES", 2);
  if (focus.includes("بطن") || focus.includes("عضلات البطن")) addWeight(weights, "CORE", 2);
  if (focus.includes("جسم كامل") || focus.includes("كامل")) addWeight(weights, "CHEST", 1);

  input.externalIds.forEach((externalId, index) => {
    const primary = normalizeRegion(input.primaryMuscles?.[index] ?? null);
    const prefixRegion = regionFromExternalId(externalId);
    if (primary) addWeight(weights, primary, 3);
    if (prefixRegion) addWeight(weights, prefixRegion, 1);
  });

  const regions = Object.entries(weights)
    .filter(([, weight]) => weight > 0)
    .sort((left, right) => right[1] - left[1])
    .map(([region]) => region as SessionMuscleRegion);

  const visualKey = resolveVisualKey(regions, weights);
  const displayNameAr = buildSessionDisplayName(regions, weights);
  const dominantExternalId = pickDominantExternalId(input.externalIds, regions[0] ?? null);

  return {
    regions,
    regionWeights: weights,
    visualKey,
    displayNameAr,
    dominantExternalId,
  };
}

function pickDominantExternalId(
  externalIds: string[],
  topRegion: SessionMuscleRegion | null,
): string | null {
  if (!externalIds.length) return null;
  if (!topRegion) return externalIds[0] ?? null;
  const match = externalIds.find((externalId) => regionFromExternalId(externalId) === topRegion);
  return match ?? externalIds[0] ?? null;
}

function hasRegion(regions: SessionMuscleRegion[], candidates: SessionMuscleRegion[]) {
  return candidates.some((region) => regions.includes(region));
}

export function resolveVisualKey(
  regions: SessionMuscleRegion[],
  weights: Record<SessionMuscleRegion, number>,
): SessionAnatomyVisualKey {
  const lowerScore = LOWER_BODY.reduce((sum, region) => sum + (weights[region] ?? 0), 0);
  const upperScore = UPPER_BODY.reduce((sum, region) => sum + (weights[region] ?? 0), 0);
  const chest = weights.CHEST ?? 0;
  const back = (weights.UPPER_BACK ?? 0) + (weights.LATS ?? 0);
  const shoulders = weights.SHOULDERS ?? 0;
  const biceps = weights.BICEPS ?? 0;
  const triceps = weights.TRICEPS ?? 0;
  const core = weights.CORE ?? 0;

  if (regions.length >= 5 || (lowerScore >= 4 && upperScore >= 4)) return "FULL_BODY";
  if (lowerScore > 0 && upperScore === 0) return "LEGS";
  if (core > 0 && upperScore === 0 && lowerScore === 0) return "CORE";
  if (shoulders > 0 && chest === 0 && back === 0 && biceps === 0 && triceps === 0) return "SHOULDERS";
  if ((biceps > 0 || triceps > 0) && chest === 0 && back === 0 && lowerScore === 0) return "ARMS";
  if (back > 0 && chest === 0 && lowerScore === 0) return "PULL";
  if (chest > 0 && back === 0 && lowerScore === 0) return "PUSH";
  if (hasRegion(regions, ["CHEST", "TRICEPS"]) && !hasRegion(regions, LOWER_BODY)) return "PUSH";
  if (hasRegion(regions, ["UPPER_BACK", "LATS", "BICEPS"]) && !hasRegion(regions, LOWER_BODY)) {
    return back >= chest ? "PULL" : "UPPER";
  }
  if (upperScore > 0 && lowerScore > 0) return "FULL_BODY";
  if (upperScore > 0) return "UPPER";
  return regions[0] ? visualKeyForRegion(regions[0]) : "FULL_BODY";
}

function visualKeyForRegion(region: SessionMuscleRegion): SessionAnatomyVisualKey {
  if (LOWER_BODY.includes(region)) return "LEGS";
  if (region === "CHEST") return "PUSH";
  if (region === "UPPER_BACK" || region === "LATS") return "PULL";
  if (region === "SHOULDERS") return "SHOULDERS";
  if (region === "BICEPS" || region === "TRICEPS") return "ARMS";
  if (region === "CORE") return "CORE";
  return "FULL_BODY";
}

export function buildSessionDisplayName(
  regions: SessionMuscleRegion[],
  weights: Record<SessionMuscleRegion, number>,
): string {
  const lowerScore = LOWER_BODY.reduce((sum, region) => sum + (weights[region] ?? 0), 0);
  const upperScore = UPPER_BODY.reduce((sum, region) => sum + (weights[region] ?? 0), 0);
  const chest = weights.CHEST ?? 0;
  const back = (weights.UPPER_BACK ?? 0) + (weights.LATS ?? 0);
  const shoulders = weights.SHOULDERS ?? 0;
  const biceps = weights.BICEPS ?? 0;
  const triceps = weights.TRICEPS ?? 0;

  if (regions.length >= 5 || (lowerScore >= 4 && upperScore >= 4)) return "الجسم كامل";
  if (lowerScore > 0 && upperScore === 0) return "أرجل";
  if (upperScore > 0 && lowerScore === 0) {
    if (chest > 0 && triceps > 0 && back === 0 && biceps === 0) return "صدر وترايسبس";
    if (back > 0 && biceps > 0 && chest === 0) return "ظهر وبايسبس";
    if (shoulders > 0 && chest === 0 && back === 0) return "أكتاف";
    if (biceps > 0 && triceps > 0 && chest === 0 && back === 0) return "بايسبس وترايسبس";
    if (back > 0 && chest === 0) return "ظهر";
    if (chest > 0 && back === 0) return "صدر";
    return "الجزء العلوي";
  }
  if (upperScore > 0 && lowerScore > 0) return "الجسم كامل";

  const labels = [...new Set(regions.map((region) => REGION_LABEL_AR[region]))];
  return labels.slice(0, 2).join(" و") || "تمرين";
}

export function resolveSessionAnatomyImageSrc(summary: SessionMuscleSummary): string | null {
  if (summary.visualKey === "REST") return null;
  if (summary.dominantExternalId) {
    return `/exercises/${summary.dominantExternalId}/anatomy/anatomy.webp`;
  }
  return null;
}

export function resolveSessionPresentation(input: {
  plan: WeekdayWorkoutPlan;
  exerciseMuscles?: Array<{ external_id: string; muscle?: string | null }>;
}): SessionMuscleSummary {
  const externalIds = input.plan.prescriptions.map((item) => item.external_id);
  const primaryMuscles =
    input.exerciseMuscles?.map((item) => item.muscle ?? null) ??
    input.plan.prescriptions.map(() => null);

  const summary = summarizeSessionMuscles({
    externalIds,
    primaryMuscles,
    muscleFocus: input.plan.targetMuscle || input.plan.muscleTitle,
  });

  if (input.plan.isRestDay) {
    return {
      regions: [],
      regionWeights: {} as Record<SessionMuscleRegion, number>,
      visualKey: "REST",
      displayNameAr: "يوم راحة",
      dominantExternalId: null,
    };
  }

  return summary;
}

export function applySessionPresentationToPlan(
  plan: WeekdayWorkoutPlan,
  exerciseMuscles?: Array<{ external_id: string; muscle?: string | null }>,
): WeekdayWorkoutPlan {
  if (plan.isRestDay) return plan;
  const presentation = resolveSessionPresentation({ plan, exerciseMuscles });
  return {
    ...plan,
    muscleTitle: presentation.displayNameAr,
    targetMuscle: presentation.displayNameAr,
  };
}

export function prescriptionsFromPlan(plan: WeekdayWorkoutPlan): TodayWorkoutPrescription[] {
  return plan.prescriptions;
}
