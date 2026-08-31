import type { ExerciseV2Metadata } from "@/lib/platform/exercise-library-v2";
import type { ProgramGenerationContext } from "@/lib/platform/program-generation/types";
import { isCore100ConfigStructurallyValid, validateCore100Config } from "./core-100";
import { resolveTrainingStrategy } from "./resolve";
import { toProgramGenerationContext } from "./to-program-context";
import type {
  StrategyResolutionOverrides,
  StrategyResolutionResult,
  TrainingStrategyInput,
} from "./types";

export type ProgramGenerationContextBuildResult =
  | {
      ok: true;
      strategy: ReturnType<typeof resolveTrainingStrategy> extends { ok: true; strategy: infer S }
        ? S
        : never;
      context: ProgramGenerationContext;
    }
  | { ok: false; resolution: Extract<StrategyResolutionResult, { ok: false }> };

/**
 * Authoritative bridge: client profile context → Strategy Matrix → ProgramGenerationContext.
 */
export function buildProgramGenerationContextFromProfile(
  input: TrainingStrategyInput,
  extras: {
    exercises: ExerciseV2Metadata[];
    overrides?: StrategyResolutionOverrides;
  },
): ProgramGenerationContextBuildResult {
  const resolution = resolveTrainingStrategy(input, extras.overrides ?? {});
  if (!resolution.ok) {
    return { ok: false, resolution };
  }
  if (!isCore100ConfigStructurallyValid()) {
    return {
      ok: false,
      resolution: {
        ok: false,
        rawGoal: resolution.strategy.rawGoal,
        errors: [
          {
            code: "CORE_100_POOL_UNAVAILABLE",
            message: "CORE_100_POOL_UNAVAILABLE:STRUCTURAL_INVALID",
          },
        ],
      },
    };
  }
  const coreValidation = validateCore100Config(extras.exercises);
  if (!coreValidation.ok) {
    return {
      ok: false,
      resolution: {
        ok: false,
        rawGoal: resolution.strategy.rawGoal,
        errors: [
          {
            code: "CORE_100_POOL_UNAVAILABLE",
            message: `CORE_100_POOL_UNAVAILABLE:${coreValidation.issues.join(",")}`,
          },
        ],
      },
    };
  }
  const context = toProgramGenerationContext(resolution.strategy, {
    exercises: extras.exercises,
  });
  return { ok: true, strategy: resolution.strategy, context };
}
