import type { LocationCompatibility } from "@/lib/platform/exercise-library-v2";
import type { GenerationReasonCode } from "@/lib/platform/program-generation/types";
import type {
  ClientTrainingLevel,
  TrainingV2CanonicalGoal,
} from "@/lib/platform/training-v2-contracts";
import type { ExercisePoolVersion } from "./core-100";
import type { PreferredWeekdayId, StrategySupportedDaysPerWeek } from "./constants";
import type { TrainingStrategyVersion } from "./version";

export type TrainingStrategyLocation = "GYM" | "HOME" | "BOTH" | "UNKNOWN";

export type SessionDurationSource = "CLIENT" | "FALLBACK_DEFAULT";

export type GoalResolutionSource =
  | "CANONICAL_ID"
  | "LEGACY_MAP"
  | "PROFILE_GOAL"
  | "MISSING";

export type GoalResolutionFailureReason =
  | "MISSING_GOAL"
  | "UNKNOWN_GOAL"
  | "UNMAPPED_LEGACY_GOAL";

export type GoalResolutionSuccess = {
  ok: true;
  rawGoal: string;
  canonicalGoal: TrainingV2CanonicalGoal;
  resolutionSource: Exclude<GoalResolutionSource, "MISSING">;
};

export type GoalResolutionFailure = {
  ok: false;
  rawGoal: string | null;
  reason: GoalResolutionFailureReason;
  assignable: false;
};

export type GoalResolutionResult = GoalResolutionSuccess | GoalResolutionFailure;

export type StrategyFrequencySource = "CLIENT" | "COACH_OVERRIDE" | "UNRESOLVED";

export type TrainingStrategyInput = {
  userId?: string | null;
  /** Quiz / profile goal identifier (legacy or canonical). */
  rawGoalId?: string | null;
  /** Denormalized `profiles.goal` or `training_profiles.goal` when present. */
  profileGoal?: string | null;
  gender?: "male" | "female" | null;
  /** Pre-fetched assessed level when available. */
  assessedTrainingLevel?: ClientTrainingLevel | null;
  trainingDaysPerWeek?: number | null;
  preferredTrainingDays?: PreferredWeekdayId[] | null;
  sessionDurationMinutes?: number | null;
  /** Quiz `trainingEnvironment` when stored in answers. */
  trainingEnvironment?: "home" | "gym" | "anywhere" | null;
  trainingType?: string | null;
  locationPreference?: string | null;
  availableEquipment?: string[] | null;
  injuryIds?: string[] | null;
  lockedExternalIds?: string[] | null;
  excludedExternalIds?: string[] | null;
  coachProtected?: boolean;
};

/** Coach/admin explicit inputs that may override unresolved profile fields. */
export type StrategyResolutionOverrides = {
  trainingDaysPerWeek?: number | null;
  sessionDurationMinutes?: number | null;
  trainingLocation?: TrainingStrategyLocation | null;
  availableEquipment?: string[] | null;
  lockedExternalIds?: string[] | null;
  excludedExternalIds?: string[] | null;
  coachProtected?: boolean;
  reason?: GenerationReasonCode;
};

export type StrategySafetyConstraints = {
  injuryIds: string[];
  restrictedMuscles: string[];
  blockedExternalIds: string[];
  blockedMovementRoles: string[];
  unknownInjuryIds: string[];
  warnings: string[];
};

export type ResolvedTrainingStrategy = {
  strategyVersion: TrainingStrategyVersion;
  userId: string | null;
  rawGoal: string;
  canonicalGoal: TrainingV2CanonicalGoal;
  goalResolutionSource: Exclude<GoalResolutionSource, "MISSING">;
  trainingLevel: ClientTrainingLevel;
  trainingLevelSource: "ASSESSED" | "UNASSESSED";
  trainingDaysPerWeek: StrategySupportedDaysPerWeek;
  frequencySource: Exclude<StrategyFrequencySource, "UNRESOLVED">;
  preferredTrainingDays: PreferredWeekdayId[];
  sessionDurationMinutes: number;
  sessionDurationSource: SessionDurationSource;
  trainingLocation: TrainingStrategyLocation;
  /** Generator pool filter — union semantics for BOTH (not intersection). */
  permittedLocations: LocationCompatibility[];
  availableEquipment: string[] | null;
  equipmentSource: "CLIENT" | "UNKNOWN";
  safety: StrategySafetyConstraints;
  lockedExternalIds: string[];
  excludedExternalIds: string[];
  coachProtected: boolean;
  /** V1 launch pool — always `MAAKFIT_V1_CORE_100`; invalid config fails closed at context build. */
  exercisePoolVersion: ExercisePoolVersion;
  generationReason: GenerationReasonCode;
};

export type StrategyResolutionErrorCode =
  | GoalResolutionFailureReason
  | "INVALID_SESSION_DURATION"
  | "MISSING_TRAINING_FREQUENCY"
  | "UNSUPPORTED_TRAINING_FREQUENCY"
  | "UNKNOWN_TRAINING_LOCATION"
  | "CORE_100_POOL_UNAVAILABLE";

export type StrategyResolutionError = {
  code: StrategyResolutionErrorCode;
  message: string;
};

export type StrategyResolutionResult =
  | { ok: true; strategy: ResolvedTrainingStrategy }
  | { ok: false; errors: StrategyResolutionError[]; rawGoal: string | null };
