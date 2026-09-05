export {
  PROGRAM_SOURCES,
  PROGRESSION_STRATEGIES,
  PROGRESSION_STATUSES,
  EXERCISE_CHANGE_ACTIONS,
} from "./types";
export type {
  ProgramSource,
  ProgressionStrategy,
  ProgressionStatus,
  ProgressionAutomationScope,
  ProgressionReview,
  ProgressionHistoryEntry,
  ProgressionAssignmentState,
  ProgressionExerciseInput,
  ProgressionApplyPatch,
  ProgressionEvaluation,
} from "./types";
export {
  PROGRESSION_STRATEGY_OPTIONS,
  progressionStrategyLabel,
  progressionStrategyDescription,
  programSourceLabel,
  progressionStatusLabel,
  automationOwnerLabel,
  progressionDecisionLabel,
  clientProgressionHint,
} from "./labels";
export { automationScopeFor, shouldAutoApplyProgression } from "./scope";
export {
  parseProgressionStrategy,
  parseProgressionStatus,
  resolveProgramSource,
  emptyProgressionState,
  parseProgressionState,
} from "./parse";
export {
  lockExerciseIdentity,
  progressionForRuntime,
  applyAllowedPrescription,
  assertExerciseIdentityPreserved,
  isExerciseChangeAction,
} from "./apply";
export { evaluateAssignmentProgression } from "./evaluate";
export { keepExerciseReview, mergeEvaluationReviews } from "./reviews";
export {
  buildProgressionAudit,
  strategyChangeAudit,
  isStaleProgressionWrite,
  STALE_PROGRESSION_MESSAGE,
} from "./audit";
