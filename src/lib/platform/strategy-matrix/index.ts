export { MAAKFIT_TRAINING_STRATEGY_V1 } from "./version";
export {
  STRATEGY_FALLBACK_SESSION_DURATION_MINUTES,
  STRATEGY_SUPPORTED_DAYS_PER_WEEK,
  WEEKDAY_CALENDAR_ORDER,
  WEEKDAY_IDS,
} from "./constants";
export type { PreferredWeekdayId, WeekdayId } from "./constants";
export type {
  GoalResolutionFailure,
  GoalResolutionResult,
  GoalResolutionSuccess,
  ResolvedTrainingStrategy,
  StrategyResolutionError,
  StrategyResolutionOverrides,
  StrategyResolutionResult,
  StrategySafetyConstraints,
  TrainingStrategyInput,
  TrainingStrategyLocation,
} from "./types";
export { OPEN_GOAL_MAPPING_DECISIONS, resolveStrategyGoal } from "./resolve-goal";
export { resolveStrategyTrainingLevel } from "./resolve-level";
export { resolveStrategyFrequency } from "./resolve-frequency";
export { resolveStrategySessionDuration } from "./resolve-duration";
export {
  permittedLocationsFor,
  primaryGeneratorLocation,
  resolveStrategyTrainingLocation,
} from "./resolve-location";
export { resolveStrategyEquipment, resolveStrategySafetyConstraints } from "./resolve-equipment";
export { resolveTrainingStrategy } from "./resolve";
export { toProgramGenerationContext } from "./to-program-context";
export {
  parseTrainingProfileAnswers,
  trainingStrategyInputFromProfileRow,
} from "./profile-source";
export { buildProgramGenerationContextFromProfile } from "./build-from-profile";
export type { ProgramGenerationContextBuildResult } from "./build-from-profile";
export {
  fetchAdminClientTrainingLevel,
  fetchAdminClientTrainingProfile,
  loadAdminClientTrainingStrategyInput,
} from "./admin-profile";
export {
  normalizePreferredTrainingDays,
  sortWeekdays,
  isWeekdayId,
} from "./weekdays";
export {
  resolveWeeklyTrainingSchedule,
  SCHEDULE_FALLBACK_WEEKDAYS,
  countWorkoutDays,
  restWeekdayIds,
} from "./calendar-resolver";
export type {
  CalendarSessionInput,
  WeeklyCalendarDay,
  WeeklyTrainingSchedule,
  WeeklySchedulePlacementSource,
  DayPlacementSource,
} from "./calendar-resolver";
export { resolveSessionLocationSemantics } from "./resolve-session-location";
export type { SessionLocationSemantics } from "./resolve-session-location";
export {
  applyWeeklyScheduleToWeekdayPlans,
  buildWeekdayPlansForAssignedRuntime,
  buildWeeklyScheduleForRuntime,
  calendarSessionsFromRuntime,
} from "./calendar-runtime";
export {
  EXERCISE_POOL_MAAKFIT_V1_CORE_100,
  core100ExternalIdSet,
  exercisesForPoolVersion,
  filterExercisesToCore100Pool,
  isCore100ConfigStructurallyValid,
  isCore100PoolActive,
  isInCore100Pool,
  resolveExercisePoolVersion,
  validateCore100Config,
} from "./core-100";
export { CORE_100_EXTERNAL_IDS } from "./config/core-100-external-ids";
export type { Core100ValidationIssue, Core100ValidationResult, ExercisePoolVersion } from "./core-100";
export {
  MAAKFIT_EXERCISE_SAFETY_V1,
  INJURY_SAFETY_RULES,
  aggregateSafetyConstraints,
  classifyExerciseSafety,
  isExerciseSafetyBlocked,
  safetyBlockedExternalIds,
} from "./exercise-safety-rules";
export type {
  AggregatedSafetyConstraints,
  InjurySafetyRule,
  SafetyClassification,
} from "./exercise-safety-rules";
