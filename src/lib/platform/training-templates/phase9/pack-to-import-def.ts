/**
 * Phase 9 — convert approved sequence packs into Pilot-compatible import definitions.
 * LOCAL import only. Does not invent exercise IDs.
 */

import {
  createEmptyTemplateContract,
  type ProgramTemplateContractV1,
  type TemplateActivityRole,
} from "@/lib/platform/training-templates";
import { DEFAULT_PRESCRIPTION_MODEL_FOR_ROLE } from "../activity-roles";
import { legacyProgramGoalFromPrimaryStrategy } from "../legacy-program-goal";
import type { TemplateSequencePack } from "./sequence-types";

export type Phase9ImportExercise = {
  external_id: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  reps_label: string | null;
  rest_seconds: number;
  role: "warmup" | "main" | "accessory" | "finisher";
  activity_role: TemplateActivityRole;
  notes_ar: string | null;
};

export type Phase9ImportDay = {
  day_number: number;
  day_type: "workout" | "rest";
  title_ar: string;
  muscle_focus: string | null;
  estimated_minutes: number | null;
  exercises: Phase9ImportExercise[];
};

export type Phase9ImportDefinition = {
  key: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  version: number;
  legacy_goal: "cut" | "bulk" | "fitness" | "recomp";
  level: "beginner" | "intermediate" | "advanced";
  days_per_week: number;
  duration_weeks: number;
  training_location: "GYM" | "HOME";
  equipment: string;
  contract: ProgramTemplateContractV1;
  week: { title_ar: string; days: Phase9ImportDay[] };
};

function legacyRole(activity_role: TemplateActivityRole): Phase9ImportExercise["role"] {
  if (activity_role === "MAIN_RESISTANCE") return "main";
  if (
    activity_role === "POST_WORKOUT_CARDIO" ||
    activity_role === "AEROBIC_ENDURANCE_BLOCK" ||
    activity_role === "CONTROLLED_AEROBIC_INTERVAL_BLOCK"
  ) {
    return "finisher";
  }
  if (activity_role === "EXERCISE_SPECIFIC_RAMP_UP" || activity_role === "POWER_SKILL_BLOCK") {
    return "accessory";
  }
  return "warmup";
}

function levelDb(level: TemplateSequencePack["level"]): Phase9ImportDefinition["level"] {
  return level === "BEGINNER" ? "beginner" : "intermediate";
}

function humanNameEn(key: string): string {
  return key.replaceAll("_", " ");
}

function buildContract(pack: TemplateSequencePack): ProgramTemplateContractV1 {
  const base = createEmptyTemplateContract({
    primaryStrategy: pack.primary_strategy,
    level: pack.level,
    environment: pack.environment,
    daysPerWeek: pack.days_per_week,
    durationWeeks: 8,
    targetAudience: pack.target_audience_ar,
    templatePurpose: pack.template_purpose_ar,
  });

  const femaleGap = pack.female_media_policy === "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE";
  const roles = new Set(
    pack.sessions.flatMap((s) => s.exercises.map((e) => e.activity_role)),
  );

  return {
    ...base,
    eligibility: {
      ...base.eligibility,
      rules: pack.environment === "GYM" ? ["GYM_ACCESS_REQUIRED"] : ["HOME_ENVIRONMENT"],
      review_conditions: pack.client_compatibility_review_required
        ? ["HOME_CLIENT_CAPABILITY_REVIEW_REQUIRED"]
        : [],
      equipment_requirements: [],
      environment_requirements: [pack.environment],
      capability_requirements: [],
      unknown_required_capability_policy: "REVIEW_REQUIRED",
    },
    activity_roles: [...roles].map((role) => ({
      role,
      prescription_model: DEFAULT_PRESCRIPTION_MODEL_FOR_ROLE[role],
      required: role === "MAIN_RESISTANCE" || role === "GENERAL_WARM_UP",
    })),
    media_preference: {
      preferred_demonstrator: pack.preferred_demonstrator === "FEMALE" ? "FEMALE" : "ANY",
      preferred_media_variant: pack.preferred_media_variant === "FEMALE" ? "FEMALE" : "STANDARD",
      duplicates_exercise_identity: false,
    },
    library_readiness: {
      state: femaleGap ? "REVIEW_REQUIRED" : "READY",
      missing_exercise_count: 0,
      missing_media_count: femaleGap ? 1 : 0,
      notes: femaleGap
        ? `IMPORT_READY — FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE. weekly_split=${pack.weekly_split}`
        : `Phase 9 import — catalog resolved. weekly_split=${pack.weekly_split}`,
    },
    review_signals: [],
    provenance: {
      created_from: "PHASE_9_SEQUENCE_PACK",
      reference_version: "1",
    },
  };
}

export function sequencePackToImportDefinition(pack: TemplateSequencePack): Phase9ImportDefinition {
  const unresolved = pack.sessions
    .flatMap((s) => s.exercises)
    .filter((e) => !e.external_id || e.content_status === "EXERCISE_LIBRARY_ADDITION_REQUIRED");
  if (unresolved.length) {
    throw new Error(
      `CONTENT_REFERENCE_REVIEW_REQUIRED: ${pack.template_key} unresolved=${unresolved
        .map((e) => e.addition_spec_id ?? e.slot_key)
        .join(",")}`,
    );
  }

  const days: Phase9ImportDay[] = pack.sessions.map((session) => ({
    day_number: session.day_number,
    day_type: session.day_type,
    title_ar: session.session_name_ar,
    muscle_focus: session.muscle_focus,
    estimated_minutes: session.estimated_minutes,
    exercises: session.exercises.map((e) => ({
      external_id: e.external_id!,
      sets: e.sets,
      reps_min: e.reps_min,
      reps_max: e.reps_max,
      reps_label: e.reps_label,
      rest_seconds: e.rest_seconds,
      role: legacyRole(e.activity_role),
      activity_role: e.activity_role,
      notes_ar: e.notes_ar,
    })),
  }));

  return {
    key: pack.template_key,
    slug: pack.template_key,
    name_ar: pack.template_purpose_ar.slice(0, 120),
    name_en: humanNameEn(pack.template_key),
    description_ar: `${pack.target_audience_ar} — ${pack.template_purpose_ar}`,
    version: 1,
    legacy_goal: legacyProgramGoalFromPrimaryStrategy(pack.primary_strategy),
    level: levelDb(pack.level),
    days_per_week: pack.days_per_week,
    duration_weeks: 8,
    training_location: pack.environment,
    equipment: pack.environment === "GYM" ? "gym" : "home",
    contract: buildContract(pack),
    week: {
      title_ar: `أسبوع 1 — ${pack.weekly_split}`,
      days,
    },
  };
}

export function buildPhase9ImportDefinitions(packs: TemplateSequencePack[]): Phase9ImportDefinition[] {
  return packs.map(sequencePackToImportDefinition);
}
