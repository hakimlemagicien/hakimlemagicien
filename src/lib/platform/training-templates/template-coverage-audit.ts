/**
 * Coverage audit helpers — Primary Strategy × Level × Environment × Days.
 */

import { PRIMARY_TRAINING_STRATEGIES, type PrimaryTrainingStrategy } from "./primary-strategy";
import { PHASE3_FIXTURE_TEMPLATES, listAssignableFixtureTemplates } from "./fixture-catalog";
import type { ResolvableTemplateRecord } from "./template-resolution-types";
import type { TemplateEnvironment, TemplateLevel } from "./contract";

export type CoverageCellStatus =
  | "EXACT_TEMPLATE_AVAILABLE"
  | "NO_EXACT_TEMPLATE"
  | "REQUIRES_COACH_CUSTOM"
  | "REQUIRES_NEW_TEMPLATE_VARIANT";

export type CoverageGapAction =
  | "ACCEPTABLE_COACH_CUSTOM"
  | "NEW_TEMPLATE_RECOMMENDED"
  | "PRODUCT_RULE_NEEDED"
  | "CONTEXT_DATA_MISSING";

export type CoverageCell = {
  primary_strategy: PrimaryTrainingStrategy;
  level: TemplateLevel;
  environment: TemplateEnvironment;
  days: number;
  status: CoverageCellStatus;
  action: CoverageGapAction | null;
  matching_slugs: string[];
};

/** Client-reachable dimensions we care about for V1 routing audit. */
export const COVERAGE_LEVELS: TemplateLevel[] = ["BEGINNER", "INTERMEDIATE"];
export const COVERAGE_ENVIRONMENTS: TemplateEnvironment[] = ["GYM", "HOME"];
export const COVERAGE_DAYS = [3, 4, 5] as const;

export function auditTemplateCoverage(
  catalog: ResolvableTemplateRecord[] = listAssignableFixtureTemplates(PHASE3_FIXTURE_TEMPLATES),
): CoverageCell[] {
  const cells: CoverageCell[] = [];
  for (const strategy of PRIMARY_TRAINING_STRATEGIES) {
    for (const level of COVERAGE_LEVELS) {
      for (const environment of COVERAGE_ENVIRONMENTS) {
        for (const days of COVERAGE_DAYS) {
          const matches = catalog.filter(
            (t) =>
              t.contract.primary_strategy === strategy &&
              t.contract.variant.level === level &&
              t.contract.variant.environment === environment &&
              t.contract.variant.days_per_week === days &&
              t.contract.library_readiness.state !== "MISSING_EXERCISE",
          );
          if (matches.length > 0) {
            cells.push({
              primary_strategy: strategy,
              level,
              environment,
              days,
              status: "EXACT_TEMPLATE_AVAILABLE",
              action: null,
              matching_slugs: matches.map((m) => m.slug),
            });
          } else {
            const action: CoverageGapAction =
              strategy === "STRENGTH" ||
              strategy === "ENDURANCE" ||
              strategy === "MOBILITY_FUNCTIONAL" ||
              strategy === "HEALTHY_AGING_ACTIVE_LIFE"
                ? "PRODUCT_RULE_NEEDED"
                : strategy === "GLUTE_FOCUS" && environment === "HOME"
                  ? "NEW_TEMPLATE_RECOMMENDED"
                  : strategy === "GENERAL_FITNESS" && level === "INTERMEDIATE"
                    ? "NEW_TEMPLATE_RECOMMENDED"
                    : "NEW_TEMPLATE_RECOMMENDED";
            cells.push({
              primary_strategy: strategy,
              level,
              environment,
              days,
              status: "NO_EXACT_TEMPLATE",
              action,
              matching_slugs: [],
            });
          }
        }
      }
    }
  }
  return cells;
}

export function summarizeCoverageGaps(cells: CoverageCell[] = auditTemplateCoverage()) {
  return cells.filter((cell) => cell.status !== "EXACT_TEMPLATE_AVAILABLE");
}
