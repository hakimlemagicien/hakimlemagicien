/**
 * Deterministic Program Template Resolver (Phase 3).
 * Recommendation only — never assigns.
 */

import { mapLegacyGoalId } from "@/lib/platform/training-v2-contracts";
import {
  templateEnvironmentFromLocation,
  templateLevelFromProgramLevel,
  type TemplateEnvironment,
  type TemplateLevel,
  type TemplateReviewSignal,
} from "./contract";
import { listAssignableFixtureTemplates } from "./fixture-catalog";
import {
  isPrimaryTrainingStrategy,
  mapQuizGoalToPrimaryStrategy,
  type PrimaryTrainingStrategy,
} from "./primary-strategy";
import {
  assessCapabilityCompatibility,
  assessEquipmentCompatibility,
  isLibraryBlocking,
} from "./template-compatibility-gate";
import { pickDeterministicWinner } from "./template-ranking";
import type {
  CandidateSummary,
  ResolvableTemplateRecord,
  StructuredRecommendationReason,
  TemplateResolverInput,
  TemplateResolverResult,
  TemplateResolverStatus,
} from "./template-resolution-types";
import { mapTrainingV2GoalToPrimaryStrategy } from "./v2-primary-bridge";

function normalizeLevel(raw: TemplateResolverInput["training_level"]): TemplateLevel | null {
  if (!raw) return null;
  if (raw === "BEGINNER" || raw === "INTERMEDIATE" || raw === "ADVANCED") return raw;
  return templateLevelFromProgramLevel(String(raw));
}

function resolveEnvironment(input: TemplateResolverInput): {
  environment: TemplateEnvironment | null;
  note: string | null;
  insufficient: boolean;
} {
  const raw = String(input.training_environment ?? "")
    .trim()
    .toUpperCase();
  if (!raw) {
    return { environment: null, note: null, insufficient: true };
  }
  if (raw === "BOTH" || raw === "ANYWHERE" || raw === "HYBRID") {
    // Ambiguous: do not silently pick HOME or GYM.
    return {
      environment: null,
      note: "CLIENT_ENVIRONMENT_AMBIGUOUS_BOTH_ANYWHERE",
      insufficient: true,
    };
  }
  const mapped = templateEnvironmentFromLocation(raw);
  if (!mapped) {
    return { environment: null, note: "UNMAPPED_ENVIRONMENT", insufficient: true };
  }
  return { environment: mapped, note: `SELECTED_${mapped}`, insufficient: false };
}

function resolvePrimaryStrategy(input: TemplateResolverInput): {
  strategy: PrimaryTrainingStrategy | null;
  source: string;
  review: TemplateReviewSignal[];
  nutritionAlignment: boolean;
  blocked: boolean;
  insufficient: boolean;
} {
  const review: TemplateReviewSignal[] = [];
  let nutritionAlignment = false;

  if (input.primary_strategy) {
    if (!isPrimaryTrainingStrategy(input.primary_strategy)) {
      return {
        strategy: null,
        source: "INVALID_PRIMARY_STRATEGY",
        review,
        nutritionAlignment,
        blocked: true,
        insufficient: false,
      };
    }
    return {
      strategy: input.primary_strategy,
      source: "INPUT_PRIMARY_STRATEGY",
      review,
      nutritionAlignment,
      blocked: false,
      insufficient: false,
    };
  }

  const quiz = input.quiz_goal_id?.trim() ?? "";
  if (quiz) {
    const mapped = mapQuizGoalToPrimaryStrategy(quiz);
    if (!mapped.ok) {
      return {
        strategy: null,
        source: "QUIZ_FAIL_CLOSED",
        review,
        nutritionAlignment,
        blocked: true,
        insufficient: false,
      };
    }
    let strategy = mapped.primaryStrategy;
    let source = `QUIZ:${quiz}`;
    if (quiz === "waist" && input.fat_loss_priority) {
      strategy = "FAT_LOSS";
      source = "QUIZ:waist+FAT_LOSS_PRIORITY";
    }
    if (quiz === "tone") {
      review.push("COACH_REVIEW_REQUIRED");
      source = "QUIZ:tone→BODY_RECOMPOSITION+COACH_REVIEW";
    }
    if (quiz === "gain") {
      nutritionAlignment = true;
    }
    return {
      strategy,
      source,
      review,
      nutritionAlignment,
      blocked: false,
      insufficient: false,
    };
  }

  const v2 = input.training_v2_goal_id?.trim() ?? "";
  if (v2) {
    const bridge = mapTrainingV2GoalToPrimaryStrategy(v2);
    if (!bridge.ok) {
      return {
        strategy: null,
        source: "V2_FAIL_CLOSED",
        review,
        nutritionAlignment,
        blocked: true,
        insufficient: false,
      };
    }
    let strategy = bridge.primaryStrategy;
    let source = `V2:${v2}`;
    if (v2 === "SLIM_TONED_WAIST" && input.fat_loss_priority) {
      strategy = "FAT_LOSS";
      source = "V2:SLIM_TONED_WAIST+FAT_LOSS_PRIORITY";
    }
    if (v2 === "TONED_ARMS_UPPER_BODY") {
      review.push("COACH_REVIEW_REQUIRED");
    }
    if (v2 === "HEALTHY_WEIGHT_GAIN") {
      nutritionAlignment = true;
    }
    return {
      strategy,
      source,
      review,
      nutritionAlignment,
      blocked: false,
      insufficient: false,
    };
  }

  return {
    strategy: null,
    source: "MISSING_GOAL",
    review,
    nutritionAlignment,
    blocked: false,
    insufficient: true,
  };
}

function emptyReason(
  partial: Partial<StructuredRecommendationReason>,
): StructuredRecommendationReason {
  return {
    goal: null,
    level: null,
    environment: null,
    days: null,
    equipment: "UNKNOWN",
    capability: "N/A",
    compatibility: "n/a",
    review_signals: [],
    summary: "",
    ...partial,
  };
}

function nearMismatches(
  template: ResolvableTemplateRecord,
  strategy: PrimaryTrainingStrategy,
  level: TemplateLevel,
  environment: TemplateEnvironment,
  days: number,
): string[] {
  const mismatches: string[] = [];
  if (template.contract.primary_strategy !== strategy) mismatches.push("primary_strategy");
  if (template.contract.variant.level !== level) mismatches.push("level");
  if (template.contract.variant.environment !== environment) mismatches.push("environment");
  if (template.contract.variant.days_per_week !== days) mismatches.push("days_per_week");
  return mismatches;
}

export function resolveProgramTemplate(
  input: TemplateResolverInput,
  catalog: ResolvableTemplateRecord[] = listAssignableFixtureTemplates(),
): TemplateResolverResult {
  const reviewSignals = new Set<TemplateReviewSignal>();
  const strategyResult = resolvePrimaryStrategy(input);
  for (const signal of strategyResult.review) reviewSignals.add(signal);

  const level = normalizeLevel(input.training_level);
  const envResolved = resolveEnvironment(input);
  const days =
    typeof input.training_days_per_week === "number" &&
    Number.isFinite(input.training_days_per_week) &&
    input.training_days_per_week >= 1 &&
    input.training_days_per_week <= 7
      ? Math.trunc(input.training_days_per_week)
      : null;

  const quizGoal = input.quiz_goal_id?.trim() || null;
  const v2Goal =
    input.training_v2_goal_id?.trim() ||
    (quizGoal ? mapLegacyGoalId(quizGoal).canonicalId : null) ||
    null;

  const baseTrace = {
    quiz_goal: quizGoal,
    training_v2_goal: v2Goal,
    primary_strategy: strategyResult.strategy,
    primary_strategy_source: strategyResult.source,
    level,
    environment: envResolved.environment,
    environment_selection_note: envResolved.note,
    days,
    initial_candidate_count: 0,
    strategy_filtered_count: 0,
    level_filtered_count: 0,
    environment_filtered_count: 0,
    days_filtered_count: 0,
    equipment_filtered_count: 0,
    eligibility_filtered_count: 0,
    readiness_filtered_count: 0,
    final_candidate_count: 0,
    selected_template: null as string | null,
    review_signals: [] as TemplateReviewSignal[],
    dimensions_changed: [] as string[],
  };

  const finish = (
    partial: Omit<TemplateResolverResult, "resolution_trace" | "recommendation_reason"> & {
      recommendation_reason: StructuredRecommendationReason;
      resolution_trace?: Partial<typeof baseTrace>;
    },
  ): TemplateResolverResult => {
    const trace = {
      ...baseTrace,
      ...partial.resolution_trace,
      review_signals: [...reviewSignals],
    };
    return {
      ...partial,
      review_signals: [...reviewSignals],
      resolution_trace: trace,
    };
  };

  if (strategyResult.blocked) {
    return finish({
      status: "BLOCKED",
      recommended_template_id: null,
      recommended_template_slug: null,
      primary_strategy: null,
      resolved_level: level,
      resolved_environment: envResolved.environment,
      resolved_days: days,
      compatibility_status: "INCOMPATIBLE",
      recommendation_reason: emptyReason({
        summary: "Goal mapping failed closed.",
        review_signals: [...reviewSignals],
      }),
      candidate_count: 0,
      candidate_summary: [],
      fallback_used: false,
      fallback_class: "NO_COMPATIBLE_TEMPLATE",
      fallback_reason: strategyResult.source,
      dimensions_changed: [],
      coach_override_required: true,
      coach_override_applied: false,
      auto_recommended_template_id: null,
      coach_selected_template_id: input.coach_override?.selected_template_id ?? null,
      override_reason: input.coach_override?.reason ?? null,
    });
  }

  if (
    strategyResult.insufficient ||
    envResolved.insufficient ||
    !level ||
    days == null ||
    !strategyResult.strategy ||
    !envResolved.environment
  ) {
    reviewSignals.add("COACH_REVIEW_REQUIRED");
    if (envResolved.note === "CLIENT_ENVIRONMENT_AMBIGUOUS_BOTH_ANYWHERE") {
      reviewSignals.add("TRAINING_ENVIRONMENT_REVIEW_RECOMMENDED");
    }
    return finish({
      status: "INSUFFICIENT_CONTEXT",
      recommended_template_id: null,
      recommended_template_slug: null,
      primary_strategy: strategyResult.strategy,
      resolved_level: level,
      resolved_environment: envResolved.environment,
      resolved_days: days,
      compatibility_status: "UNKNOWN",
      recommendation_reason: emptyReason({
        goal: strategyResult.strategy,
        level,
        environment: envResolved.environment,
        days,
        summary: "Insufficient context to recommend an exact template.",
        review_signals: [...reviewSignals],
        nutrition_alignment_required: strategyResult.nutritionAlignment || undefined,
      }),
      candidate_count: 0,
      candidate_summary: [],
      fallback_used: false,
      fallback_class: "NO_EXACT_MATCH",
      fallback_reason: "INSUFFICIENT_CONTEXT",
      dimensions_changed: [],
      coach_override_required: true,
      coach_override_applied: false,
      auto_recommended_template_id: null,
      coach_selected_template_id: input.coach_override?.selected_template_id ?? null,
      override_reason: input.coach_override?.reason ?? null,
    });
  }

  const strategy = strategyResult.strategy;
  const environment = envResolved.environment;

  // Assignable pool
  let pool = catalog.filter((t) => t.status === "PUBLISHED" && t.is_published && !t.archived);
  baseTrace.initial_candidate_count = pool.length;

  pool = pool.filter((t) => t.contract.primary_strategy === strategy && t.contract.template_family === strategy);
  baseTrace.strategy_filtered_count = pool.length;

  const afterLevel = pool.filter((t) => t.contract.variant.level === level);
  baseTrace.level_filtered_count = afterLevel.length;

  const afterEnv = afterLevel.filter((t) => t.contract.variant.environment === environment);
  baseTrace.environment_filtered_count = afterEnv.length;

  const afterDays = afterEnv.filter((t) => t.contract.variant.days_per_week === days);
  baseTrace.days_filtered_count = afterDays.length;

  const exactDimCandidates = afterDays;

  type Scored = {
    template: ResolvableTemplateRecord;
    equipment: ReturnType<typeof assessEquipmentCompatibility>;
    capability: ReturnType<typeof assessCapabilityCompatibility>;
    blocking: boolean;
    reviewOnly: boolean;
  };

  const scored: Scored[] = exactDimCandidates.map((template) => {
    const equipment = assessEquipmentCompatibility({
      template,
      availableEquipment: input.available_equipment,
    });
    const capability = assessCapabilityCompatibility({
      contract: template.contract,
      homeCapabilities: input.home_capabilities,
    });
    const readiness = template.contract.library_readiness.state;
    const blocking =
      isLibraryBlocking(readiness) ||
      equipment === "INCOMPATIBLE" ||
      capability.status === "INCOMPATIBLE";
    const reviewOnly =
      !blocking &&
      (equipment === "UNKNOWN" ||
        equipment === "REVIEW_REQUIRED" ||
        capability.status === "REVIEW_REQUIRED" ||
        readiness === "MISSING_MEDIA" ||
        readiness === "REVIEW_REQUIRED" ||
        template.contract.review_signals.length > 0);
    return { template, equipment, capability, blocking, reviewOnly };
  });

  const eligible = scored.filter((row) => !row.blocking);
  baseTrace.eligibility_filtered_count = eligible.length;

  const readinessOk = eligible.filter(
    (row) => !isLibraryBlocking(row.template.contract.library_readiness.state),
  );
  baseTrace.readiness_filtered_count = readinessOk.length;

  const exactSafe = readinessOk.filter((row) => !row.reviewOnly);
  const exactReview = readinessOk.filter((row) => row.reviewOnly);

  baseTrace.equipment_filtered_count = exactSafe.length + exactReview.length;
  baseTrace.final_candidate_count = exactSafe.length + exactReview.length;

  const candidate_summary: CandidateSummary[] = [
    ...exactSafe.map((row) => ({
      id: row.template.id,
      slug: row.template.slug,
      match_class: "EXACT" as const,
      mismatched_dimensions: [] as string[],
      library_readiness: row.template.contract.library_readiness.state,
      equipment: row.equipment,
    })),
    ...exactReview.map((row) => ({
      id: row.template.id,
      slug: row.template.slug,
      match_class: "EXACT" as const,
      mismatched_dimensions: [] as string[],
      library_readiness: row.template.contract.library_readiness.state,
      equipment: row.equipment,
    })),
  ];

  // Near candidates (same strategy, mismatched dims) for visibility — never exact
  const nearPool = catalog
    .filter((t) => t.status === "PUBLISHED" && t.is_published && !t.archived)
    .filter((t) => t.contract.primary_strategy === strategy)
    .filter((t) => !exactDimCandidates.some((exact) => exact.id === t.id))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      match_class: "NEAR" as const,
      mismatched_dimensions: nearMismatches(t, strategy, level, environment, days),
      library_readiness: t.contract.library_readiness.state,
      equipment: assessEquipmentCompatibility({
        template: t,
        availableEquipment: input.available_equipment,
      }),
    }));

  let autoWinner: ResolvableTemplateRecord | null = null;
  let status: TemplateResolverStatus = "NO_EXACT_MATCH";
  let fallback_used = false;
  let fallback_class: TemplateResolverResult["fallback_class"] = "NO_EXACT_MATCH";
  let fallback_reason: string | null = null;
  let compatibility_status: TemplateResolverResult["compatibility_status"] = "UNKNOWN";

  if (exactSafe.length > 0) {
    autoWinner = pickDeterministicWinner(exactSafe.map((row) => row.template));
    status = reviewSignals.has("COACH_REVIEW_REQUIRED") ? "MATCHED_WITH_REVIEW" : "MATCHED";
    fallback_class = "EXACT_MATCH";
    compatibility_status = "SAFE";
  } else if (exactReview.length > 0) {
    autoWinner = pickDeterministicWinner(exactReview.map((row) => row.template));
    status = "MATCHED_WITH_REVIEW";
    fallback_class = "REVIEW_REQUIRED_MATCH";
    fallback_used = false;
    compatibility_status = "REVIEW";
    reviewSignals.add("COACH_REVIEW_REQUIRED");
    for (const row of exactReview) {
      if (row.capability.status === "REVIEW_REQUIRED") {
        reviewSignals.add("HOME_LOAD_LIMIT_REVIEW_REQUIRED");
      }
      if (row.equipment === "UNKNOWN" || row.equipment === "REVIEW_REQUIRED") {
        reviewSignals.add("EQUIPMENT_LIMIT_REVIEW_REQUIRED");
      }
      for (const signal of row.template.contract.review_signals) reviewSignals.add(signal);
    }
  } else if (afterDays.length > 0) {
    // Dimensional exact existed but all blocked
    status = "NO_COMPATIBLE_TEMPLATE";
    fallback_class = "NO_COMPATIBLE_TEMPLATE";
    fallback_reason = "EXACT_DIMENSIONS_BLOCKED_BY_ELIGIBILITY_OR_READINESS";
    reviewSignals.add("COACH_REVIEW_REQUIRED");
    compatibility_status = "INCOMPATIBLE";
  } else {
    status = "NO_EXACT_MATCH";
    fallback_class = "NO_EXACT_MATCH";
    fallback_used = false;
    fallback_reason = "NO_APPROVED_TEMPLATE_FOR_STRATEGY_LEVEL_ENV_DAYS";
    reviewSignals.add("COACH_REVIEW_REQUIRED");
    if (strategy === "GLUTE_FOCUS" && environment === "HOME") {
      reviewSignals.add("TRAINING_ENVIRONMENT_REVIEW_RECOMMENDED");
    }
    if (baseTrace.level_filtered_count === 0 && baseTrace.strategy_filtered_count > 0) {
      reviewSignals.add("PROGRAM_LEVEL_REVIEW_RECOMMENDED");
    }
    if (baseTrace.days_filtered_count === 0 && baseTrace.environment_filtered_count > 0) {
      reviewSignals.add("TRAINING_FREQUENCY_REVIEW_RECOMMENDED");
    }
    compatibility_status = "REVIEW";
  }

  // Attach near candidates for NO_EXACT_MATCH visibility
  if (status === "NO_EXACT_MATCH" || status === "NO_COMPATIBLE_TEMPLATE") {
    candidate_summary.push(...nearPool);
  }

  const winnerRow =
    autoWinner == null
      ? null
      : scored.find((row) => row.template.id === autoWinner.id) ?? null;

  const reason: StructuredRecommendationReason = {
    goal: strategy,
    level,
    environment,
    days,
    equipment: winnerRow?.equipment ?? "UNKNOWN",
    capability: winnerRow?.capability.status ?? "N/A",
    compatibility: compatibility_status,
    review_signals: [...reviewSignals],
    nutrition_alignment_required: strategyResult.nutritionAlignment || undefined,
    summary:
      status === "MATCHED" || status === "MATCHED_WITH_REVIEW"
        ? `Exact match: ${strategy} / ${level} / ${environment} / ${days}D → ${autoWinner?.slug ?? ""}`
        : status === "NO_EXACT_MATCH"
          ? `No approved ${strategy} / ${level} / ${environment} / ${days}D template.`
          : status === "NO_COMPATIBLE_TEMPLATE"
            ? `Exact dimension candidates blocked by eligibility/readiness.`
            : "Unable to recommend.",
  };

  baseTrace.selected_template = autoWinner?.slug ?? null;
  baseTrace.final_candidate_count = exactSafe.length + exactReview.length;

  let coach_override_applied = false;
  let recommended = autoWinner;
  if (input.coach_override?.selected_template_id) {
    const overrideTpl = catalog.find((t) => t.id === input.coach_override!.selected_template_id);
    if (overrideTpl) {
      recommended = overrideTpl;
      coach_override_applied = true;
      status = "MATCHED_WITH_REVIEW";
      reviewSignals.add("COACH_REVIEW_REQUIRED");
      reason.summary = `Coach override selected ${overrideTpl.slug} (auto was ${autoWinner?.slug ?? "none"}).`;
    }
  }

  return finish({
    status,
    recommended_template_id: recommended?.id ?? null,
    recommended_template_slug: recommended?.slug ?? null,
    primary_strategy: strategy,
    resolved_level: level,
    resolved_environment: environment,
    resolved_days: days,
    compatibility_status,
    recommendation_reason: reason,
    candidate_count: candidate_summary.length,
    candidate_summary,
    fallback_used,
    fallback_class,
    fallback_reason,
    dimensions_changed: [],
    coach_override_required:
      status !== "MATCHED" || reviewSignals.has("COACH_REVIEW_REQUIRED") || coach_override_applied,
    coach_override_applied,
    auto_recommended_template_id: autoWinner?.id ?? null,
    coach_selected_template_id: input.coach_override?.selected_template_id ?? null,
    override_reason: input.coach_override?.reason ?? null,
    resolution_trace: baseTrace,
  });
}
