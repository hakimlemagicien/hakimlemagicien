/**
 * Training Engine V2 Phase 2 — data contracts only.
 * Phase 4 prescription logic lives in `src/lib/platform/prescription` (pure domain, not SQL).
 */

export const TRAINING_V2_CANONICAL_GOALS = [
  "GLUTE_GROWTH",
  "SLIM_TONED_WAIST",
  "TONED_ARMS_UPPER_BODY",
  "FEMININE_BALANCED_BODY",
  "FAT_LOSS",
  "POSTURE_TONED_BACK",
  "MUSCLE_GROWTH",
  "FITNESS_ENERGY",
  "ATHLETIC_PHYSIQUE",
  "BODY_RESHAPE",
  "HEALTHY_WEIGHT_GAIN",
] as const;

export type TrainingV2CanonicalGoal = (typeof TRAINING_V2_CANONICAL_GOALS)[number];

export type GoalMappingStatus = "MAPPED" | "LEGACY_UNMAPPED";

export type LegacyGoalMapping = {
  legacyId: string;
  canonicalId: TrainingV2CanonicalGoal | null;
  mappingStatus: GoalMappingStatus;
  notes?: string;
};

export const TRAINING_V2_GOAL_LABELS_AR: Record<TrainingV2CanonicalGoal, string> = {
  GLUTE_GROWTH: "أريد تكبير المؤخرة",
  SLIM_TONED_WAIST: "أريد خصرًا أنحف ومشدودًا",
  TONED_ARMS_UPPER_BODY: "أريد شد الذراعين والجزء العلوي",
  FEMININE_BALANCED_BODY: "أريد جسمًا متناسقًا وأنثويًا",
  FAT_LOSS: "خسارة الدهون",
  POSTURE_TONED_BACK: "أريد تحسين القوام وشد الظهر",
  MUSCLE_GROWTH: "بناء العضلات",
  FITNESS_ENERGY: "تحسين اللياقة والطاقة",
  ATHLETIC_PHYSIQUE: "جسم رياضي ومتناسق",
  BODY_RESHAPE: "تغيير شكل الجسم",
  HEALTHY_WEIGHT_GAIN: "زيادة وزن صحي",
};

export function isCanonicalTrainingGoal(value: string | null | undefined): value is TrainingV2CanonicalGoal {
  return Boolean(value && (TRAINING_V2_CANONICAL_GOALS as readonly string[]).includes(value));
}

/**
 * Display-only: map an official Matrix goal to the quiz/home hero asset id.
 * This does not invent Strategy Matrix mappings for unmapped quiz ids.
 */
export function quizHeroIdForCanonicalGoal(
  goal: TrainingV2CanonicalGoal,
  gender: "male" | "female" = "female",
): string {
  switch (goal) {
    case "FAT_LOSS":
      return "fat";
    case "GLUTE_GROWTH":
      return "glutes";
    case "SLIM_TONED_WAIST":
      return "waist";
    case "FEMININE_BALANCED_BODY":
      return "body";
    case "TONED_ARMS_UPPER_BODY":
      return gender === "female" ? "tone" : "muscle";
    case "POSTURE_TONED_BACK":
      return gender === "female" ? "fit" : "fitness";
    case "MUSCLE_GROWTH":
      return "muscle";
    case "FITNESS_ENERGY":
      return "fitness";
    case "ATHLETIC_PHYSIQUE":
      return "athletic";
    case "BODY_RESHAPE":
      return "shape";
    case "HEALTHY_WEIGHT_GAIN":
      return "gain";
  }
}

export function homeBucketForCanonicalGoal(goal: TrainingV2CanonicalGoal): "cut" | "bulk" | "fitness" {
  if (goal === "FAT_LOSS" || goal === "SLIM_TONED_WAIST") return "cut";
  if (goal === "TONED_ARMS_UPPER_BODY" || goal === "MUSCLE_GROWTH" || goal === "HEALTHY_WEIGHT_GAIN") {
    return "bulk";
  }
  return "fitness";
}

/** Approved Phase 2 mappings — all quiz goal ids used in /quiz map to a canonical V2 goal. */
export const LEGACY_GOAL_MAP: Record<string, LegacyGoalMapping> = {
  fat: { legacyId: "fat", canonicalId: "FAT_LOSS", mappingStatus: "MAPPED" },
  glutes: { legacyId: "glutes", canonicalId: "GLUTE_GROWTH", mappingStatus: "MAPPED" },
  waist: { legacyId: "waist", canonicalId: "SLIM_TONED_WAIST", mappingStatus: "MAPPED" },
  body: { legacyId: "body", canonicalId: "FEMININE_BALANCED_BODY", mappingStatus: "MAPPED" },
  tone: {
    legacyId: "tone",
    canonicalId: "TONED_ARMS_UPPER_BODY",
    mappingStatus: "MAPPED",
    notes: "Female quiz chest/upper tone → TONED_ARMS_UPPER_BODY (matches hero asset id)",
  },
  fit: {
    legacyId: "fit",
    canonicalId: "POSTURE_TONED_BACK",
    mappingStatus: "MAPPED",
    notes: "Female quiz healthy/athletic → POSTURE_TONED_BACK (matches hero asset id)",
  },
  muscle: { legacyId: "muscle", canonicalId: "MUSCLE_GROWTH", mappingStatus: "MAPPED" },
  fitness: { legacyId: "fitness", canonicalId: "FITNESS_ENERGY", mappingStatus: "MAPPED" },
  athletic: { legacyId: "athletic", canonicalId: "ATHLETIC_PHYSIQUE", mappingStatus: "MAPPED" },
  shape: { legacyId: "shape", canonicalId: "BODY_RESHAPE", mappingStatus: "MAPPED" },
  gain: { legacyId: "gain", canonicalId: "HEALTHY_WEIGHT_GAIN", mappingStatus: "MAPPED" },
};

export function mapLegacyGoalId(legacyId: string | null | undefined): LegacyGoalMapping {
  const key = legacyId?.trim() ?? "";
  if (!key) {
    return {
      legacyId: "",
      canonicalId: null,
      mappingStatus: "LEGACY_UNMAPPED",
      notes: "empty goal",
    };
  }
  return (
    LEGACY_GOAL_MAP[key] ?? {
      legacyId: key,
      canonicalId: null,
      mappingStatus: "LEGACY_UNMAPPED",
      notes: "unknown legacy goal",
    }
  );
}

export type LegacyEffort = "easy" | "medium" | "hard";
export type TrainingV2Effort = "EASY" | "IDEAL" | "VERY_HARD" | "FAILURE";

export function mapLegacyEffortToV2(
  effort: LegacyEffort | null | undefined,
): TrainingV2Effort | null {
  if (effort === "easy") return "EASY";
  if (effort === "medium") return "IDEAL";
  if (effort === "hard") return "VERY_HARD";
  return null;
}

export type WorkoutSessionStatus =
  | "READY"
  | "IN_PROGRESS"
  | "PARTIALLY_COMPLETED"
  | "COMPLETED"
  | "INTERRUPTED"
  | "CANCELLED";

export type WorkoutSetType = "WARMUP" | "WORKING" | "RAMP" | "BACKOFF" | "TOP";

export type ClientTrainingLevel = "UNASSESSED" | "BEGINNER" | "INTERMEDIATE";

export type LevelConfidence = "LOW" | "MODERATE" | "HIGH";

export type PrescriptionState =
  | "CALIBRATING"
  | "NORMAL"
  | "RECONDITIONING"
  | "RECOVERY_LIMITED"
  | "SAFETY_REVIEW";

export type ExerciseExperienceState = "NEW" | "CALIBRATING" | "FAMILIAR" | "ESTABLISHED";

export type TrainingSafetySignal = "pain" | "discomfort" | "unsafe_execution";

export const KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_5_6 =
  "KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_5_6";

export const KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_4 = "KNOWN_CRITICAL_CONFLICT_PENDING_PHASE_4";

/** Phase 4 implemented the V2 core prescription engine; free-preview 40 kg remains isolated. */
export const PHASE_4_CORE_PRESCRIPTION_ENGINE = "src/lib/platform/prescription" as const;

/** Phase 7 weekly volume / recovery. Separate from Phase 6 load progression. */
export const PHASE_7_VOLUME_ENGINE = "src/lib/platform/volume" as const;

export const TRAINING_NUTRITION_BOUNDARY = "PENDING_SHARED_CONTRACT" as const;

export type ExerciseSetHistoryItem = {
  id: string;
  workoutSessionId: string | null;
  sessionDate: string;
  setNumber: number;
  setType: WorkoutSetType | null;
  prescribedLoad: number | null;
  actualLoad: number | null;
  prescribedRepsMin: number | null;
  prescribedRepsMax: number | null;
  actualReps: number | null;
  prescribedDurationSeconds?: number | null;
  actualDurationSeconds?: number | null;
  effort: LegacyEffort | null;
  effortV2: TrainingV2Effort | null;
  skipped: boolean;
  setCompleted: boolean | null;
  createdAt: string;
  executionSide?: "LEFT" | "RIGHT" | null;
};

export function isWorkingSetHistoryRow(row: Pick<ExerciseSetHistoryItem, "setType" | "skipped">) {
  return row.skipped !== true && (row.setType == null || row.setType === "WORKING");
}
