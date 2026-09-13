/**
 * Synthetic / fixture Program Templates for Phase 3 resolver tests & coverage audit.
 * NOT production content. TEMPLATES_IMPORTED remains 0.
 */

import { createEmptyTemplateContract, type ProgramTemplateContractV1 } from "./contract";
import type { PrimaryTrainingStrategy } from "./primary-strategy";
import type { ResolvableTemplateRecord } from "./template-resolution-types";
import type { TemplateEnvironment, TemplateLevel } from "./contract";

function fixture(
  input: {
    id: string;
    slug: string;
    strategy: PrimaryTrainingStrategy;
    level: TemplateLevel;
    environment: TemplateEnvironment;
    days: number;
    status?: ResolvableTemplateRecord["status"];
    version?: number;
    version_group_id?: string;
    readiness?: ProgramTemplateContractV1["library_readiness"]["state"];
    missing_exercise_count?: number;
    missing_media_count?: number;
    home_requirements?: ProgramTemplateContractV1["eligibility"]["capability_requirements"];
    equipment_tags?: string[];
    review_signals?: ProgramTemplateContractV1["review_signals"];
    preferred_demonstrator?: ProgramTemplateContractV1["media_preference"]["preferred_demonstrator"];
  },
): ResolvableTemplateRecord {
  const status = input.status ?? "PUBLISHED";
  const contract = createEmptyTemplateContract({
    primaryStrategy: input.strategy,
    level: input.level,
    environment: input.environment,
    daysPerWeek: input.days,
    targetAudience: `${input.strategy} ${input.level} ${input.environment} ${input.days}D audience`,
    templatePurpose: `Fixture purpose for ${input.slug}`,
    targetGender: input.strategy === "GLUTE_FOCUS" ? "female" : "all",
  });
  contract.library_readiness = {
    state: input.readiness ?? "READY",
    missing_exercise_count: input.missing_exercise_count ?? 0,
    missing_media_count: input.missing_media_count ?? 0,
  };
  if (input.home_requirements) {
    contract.eligibility.capability_requirements = input.home_requirements;
  }
  if (input.review_signals) {
    contract.review_signals = input.review_signals;
  }
  if (input.preferred_demonstrator) {
    contract.media_preference.preferred_demonstrator = input.preferred_demonstrator;
    contract.media_preference.preferred_media_variant =
      input.preferred_demonstrator === "FEMALE" ? "FEMALE" : "STANDARD";
  }

  return {
    id: input.id,
    slug: input.slug,
    version: input.version ?? 1,
    status,
    is_published: status === "PUBLISHED",
    archived: status === "ARCHIVED",
    version_group_id: input.version_group_id ?? input.slug,
    contract,
    equipment_tags: input.equipment_tags ?? (input.environment === "HOME" ? ["dumbbells", "bands"] : ["barbell", "machines"]),
  };
}

/**
 * Approved conceptual catalog slice for resolver QA.
 * Intentionally OMITs: GLUTE_FOCUS + HOME + any days (coverage gap).
 */
export const PHASE3_FIXTURE_TEMPLATES: ResolvableTemplateRecord[] = [
  fixture({
    id: "tpl-fat-beg-gym-3",
    slug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    strategy: "FAT_LOSS",
    level: "BEGINNER",
    environment: "GYM",
    days: 3,
  }),
  fixture({
    id: "tpl-fat-beg-home-3",
    slug: "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D",
    strategy: "FAT_LOSS",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
  }),
  fixture({
    id: "tpl-fat-int-gym-4",
    slug: "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D",
    strategy: "FAT_LOSS",
    level: "INTERMEDIATE",
    environment: "GYM",
    days: 4,
  }),
  fixture({
    id: "tpl-mg-beg-home-3",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
  }),
  fixture({
    id: "tpl-mg-beg-gym-3",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "GYM",
    days: 3,
  }),
  fixture({
    id: "tpl-mg-int-home-4",
    slug: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D",
    strategy: "MUSCLE_GAIN",
    level: "INTERMEDIATE",
    environment: "HOME",
    days: 4,
  }),
  fixture({
    id: "tpl-mg-int-gym-5",
    slug: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_GYM_5D",
    strategy: "MUSCLE_GAIN",
    level: "INTERMEDIATE",
    environment: "GYM",
    days: 5,
  }),
  // Tie-break pair: same exact dims, higher version wins
  fixture({
    id: "tpl-mg-beg-home-3-v1",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D_LEGACY",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
    version: 1,
    version_group_id: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
  }),
  fixture({
    id: "tpl-mg-beg-home-3-v2",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D_V2",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
    version: 2,
    version_group_id: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
  }),
  fixture({
    id: "tpl-ath-beg-home-3",
    slug: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
    strategy: "ATHLETIC_PERFORMANCE",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
  }),
  fixture({
    id: "tpl-recomp-beg-gym-3",
    slug: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D",
    strategy: "BODY_RECOMPOSITION",
    level: "BEGINNER",
    environment: "GYM",
    days: 3,
  }),
  fixture({
    id: "tpl-recomp-beg-home-3",
    slug: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D",
    strategy: "BODY_RECOMPOSITION",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
  }),
  fixture({
    id: "tpl-fit-beg-gym-3",
    slug: "GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D",
    strategy: "GENERAL_FITNESS",
    level: "BEGINNER",
    environment: "GYM",
    days: 3,
  }),
  // GENERAL_FITNESS INTERMEDIATE intentionally missing → coverage gap
  fixture({
    id: "tpl-glute-beg-gym-3",
    slug: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
    strategy: "GLUTE_FOCUS",
    level: "BEGINNER",
    environment: "GYM",
    days: 3,
    preferred_demonstrator: "FEMALE",
  }),
  // NO glute HOME fixtures — intentional gap
  fixture({
    id: "tpl-home-band-req",
    slug: "MUSCLE_GAIN_HOME_BAND_ANCHOR_BEGINNER_3D",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
    home_requirements: [{ key: "safe_band_anchor", required: true }],
    version: 3,
    version_group_id: "MUSCLE_GAIN_HOME_BAND",
  }),
  fixture({
    id: "tpl-draft",
    slug: "MUSCLE_GAIN_DRAFT_BEGINNER_HOME_3D",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
    status: "DRAFT",
  }),
  fixture({
    id: "tpl-archived",
    slug: "MUSCLE_GAIN_ARCHIVED_BEGINNER_HOME_3D",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
    status: "ARCHIVED",
  }),
  fixture({
    id: "tpl-missing-ex",
    slug: "MUSCLE_GAIN_MISSING_EXERCISE_BEGINNER_HOME_3D",
    strategy: "MUSCLE_GAIN",
    level: "BEGINNER",
    environment: "HOME",
    days: 3,
    readiness: "MISSING_EXERCISE",
    missing_exercise_count: 2,
  }),
];

export function listAssignableFixtureTemplates(
  catalog: ResolvableTemplateRecord[] = PHASE3_FIXTURE_TEMPLATES,
): ResolvableTemplateRecord[] {
  return catalog.filter((t) => t.status === "PUBLISHED" && t.is_published && !t.archived);
}
