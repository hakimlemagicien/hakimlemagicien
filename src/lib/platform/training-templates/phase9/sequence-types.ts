/**
 * Phase 9 — Exercise sequence pack types + library resolver.
 * Content authoring only; no DB writes; no invented external_ids.
 */

import exerciseLibraryV2Json from "../../../../../scripts/exercise-library-v2-metadata.json";
import { CORE_100_EXTERNAL_IDS } from "@/lib/platform/strategy-matrix/config/core-100-external-ids";
import type { TemplateActivityRole } from "../activity-roles";
import type { PrimaryTrainingStrategy } from "../primary-strategy";
import type { TemplateEnvironment, TemplateLevel } from "../contract";
import { PHASE9_LIBRARY_ADDITION_RESOLUTIONS } from "./library-additions";

export type ContentApprovalStatus =
  | "CONTENT_APPROVED_FOR_IMPORT"
  | "CONTENT_APPROVED_PENDING_LIBRARY_ADDITION"
  | "CONTENT_REVIEW_REQUIRED"
  | "BLOCKED";

export type SequenceExerciseSlot = {
  slot_key: string;
  activity_role: TemplateActivityRole;
  external_id: string | null;
  addition_spec_id: string | null;
  name_en: string;
  name_ar: string | null;
  slug: string | null;
  equipment: string[];
  primary_muscles: string[];
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  reps_label: string;
  rest_seconds: number;
  smart_progression_eligible: boolean;
  excluded_from_main_volume: boolean;
  notes_ar: string | null;
  home_requirements: string[];
  content_status: "APPROVED_EXISTING" | "EXERCISE_LIBRARY_ADDITION_REQUIRED";
};

export type SequenceSession = {
  session_key: string;
  day_number: number;
  day_type: "workout" | "rest";
  session_name_ar: string;
  session_name_en: string;
  session_purpose_ar: string;
  muscle_focus: string | null;
  estimated_minutes: number | null;
  exercises: SequenceExerciseSlot[];
};

export type TemplateSequencePack = {
  template_key: string;
  primary_strategy: PrimaryTrainingStrategy;
  level: TemplateLevel;
  environment: TemplateEnvironment;
  days_per_week: 3 | 4 | 5;
  weekly_split: string;
  target_audience_ar: string;
  template_purpose_ar: string;
  content_status: ContentApprovalStatus;
  female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE" | "STANDARD_OK";
  preferred_demonstrator: "FEMALE" | "STANDARD" | null;
  preferred_media_variant: "FEMALE" | "STANDARD" | null;
  client_compatibility_review_required: boolean;
  block_reason_ar: string | null;
  sessions: SequenceSession[];
  qa_flags: string[];
  authoring_notes_ar: string[];
};

type V2Row = {
  external_id: string;
  name_en: string;
  name_ar: string;
  exercise_type: string;
  primary_muscle_canonical?: string;
  secondary_muscles_canonical?: string[];
  required_equipment?: string[];
  location_compatibility?: string[];
  primary_movement_role?: string;
};

const V2 = exerciseLibraryV2Json as V2Row[];
const BY_ID = new Map(V2.map((r) => [r.external_id, r]));
export const CORE_100_SET = new Set(CORE_100_EXTERNAL_IDS);

export function resolveLibraryExercise(externalId: string): V2Row {
  const row = BY_ID.get(externalId);
  if (!row) {
    throw new Error(`UNRESOLVED_EXERCISE_REFERENCE: ${externalId}`);
  }
  return row;
}

export function libraryHas(externalId: string): boolean {
  return BY_ID.has(externalId);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function inferHomeRequirements(row: V2Row): string[] {
  const req: string[] = [];
  const eq = (row.required_equipment ?? []).map((e) => e.toUpperCase());
  const locs = row.location_compatibility ?? [];
  if (!locs.includes("HOME") && !locs.includes("NO_EQUIPMENT")) return req;
  if (row.is_bodyweight || eq.length === 0 || eq.includes("NO_EQUIPMENT")) req.push("BODYWEIGHT");
  if (eq.some((e) => e.includes("DUMBBELL"))) {
    req.push("DUMBBELL", "AVAILABLE_LOAD_REQUIRED");
  }
  if (eq.some((e) => e.includes("BAND"))) req.push("BAND", "SAFE_BAND_ANCHOR");
  if (eq.some((e) => e.includes("BENCH") || e.includes("CHAIR"))) req.push("CHAIR/BENCH", "STABLE_ELEVATED_SURFACE");
  if (eq.some((e) => e.includes("KETTLEBELL"))) req.push("AVAILABLE_LOAD_REQUIRED", "SPACE_REQUIRED");
  if (/lunge|walk|carry|farmer/i.test(row.name_en)) req.push("SPACE_REQUIRED");
  return [...new Set(req)];
}

type SlotOpts = {
  sets?: number;
  reps?: [number, number] | string;
  rest?: number;
  notes_ar?: string | null;
  smart?: boolean;
  slot_key?: string;
  home_extra?: string[];
};

export function existingSlot(
  externalId: string,
  activity_role: TemplateActivityRole,
  opts: SlotOpts = {},
): SequenceExerciseSlot {
  const row = resolveLibraryExercise(externalId);
  const isMain = activity_role === "MAIN_RESISTANCE";
  const isRamp = activity_role === "EXERCISE_SPECIFIC_RAMP_UP";
  const isDuration =
    typeof opts.reps === "string" ||
    activity_role.includes("WARM") ||
    activity_role.includes("CARDIO") ||
    activity_role.includes("AEROBIC") ||
    activity_role === "MOBILITY_ACTIVITY" ||
    activity_role === "POWER_SKILL_BLOCK";

  let reps_min: number | null = null;
  let reps_max: number | null = null;
  let reps_label: string;
  if (typeof opts.reps === "string") {
    reps_label = opts.reps;
  } else if (Array.isArray(opts.reps)) {
    reps_min = opts.reps[0];
    reps_max = opts.reps[1];
    reps_label = `${opts.reps[0]}-${opts.reps[1]}`;
  } else if (isMain || isRamp) {
    reps_min = 8;
    reps_max = 10;
    reps_label = "8-10";
  } else {
    reps_label = "40 sec";
  }

  const smart =
    opts.smart ?? (isMain && !isDuration && typeof opts.reps !== "string");

  return {
    slot_key: opts.slot_key ?? `${activity_role}:${externalId}`,
    activity_role,
    external_id: externalId,
    addition_spec_id: null,
    name_en: row.name_en,
    name_ar: row.name_ar ?? null,
    slug: slugify(row.name_en),
    equipment: row.required_equipment ?? [],
    primary_muscles: [
      row.primary_muscle_canonical ?? row.exercise_type,
      ...(row.secondary_muscles_canonical ?? []).slice(0, 2),
    ].filter(Boolean) as string[],
    sets: opts.sets ?? (isMain ? 3 : isRamp ? 2 : 1),
    reps_min,
    reps_max,
    reps_label,
    rest_seconds: opts.rest ?? (isMain ? 90 : isRamp ? 90 : 30),
    smart_progression_eligible: smart,
    excluded_from_main_volume: !isMain,
    notes_ar: opts.notes_ar ?? null,
    home_requirements: [...inferHomeRequirements(row as V2Row & { is_bodyweight?: boolean }), ...(opts.home_extra ?? [])],
    content_status: "APPROVED_EXISTING",
  };
}

export function additionSlot(
  additionSpecId: "ADD_TREADMILL_BRISK_WALK" | "ADD_HOME_BRISK_WALK",
  activity_role: TemplateActivityRole,
  durationLabel: string,
  opts: { notes_ar?: string; slot_key?: string } = {},
): SequenceExerciseSlot {
  const resolvedId = PHASE9_LIBRARY_ADDITION_RESOLUTIONS[additionSpecId];
  if (libraryHas(resolvedId)) {
    const bound = existingSlot(resolvedId, activity_role, {
      reps: durationLabel,
      sets: 1,
      rest: 0,
      slot_key: opts.slot_key ?? `${activity_role}:${additionSpecId}`,
      notes_ar: opts.notes_ar ?? "كارديو تحت سيطرة المدرب — ليس Smart Progression",
      smart: false,
    });
    return {
      ...bound,
      addition_spec_id: additionSpecId,
      smart_progression_eligible: false,
      excluded_from_main_volume: true,
    };
  }

  const meta =
    additionSpecId === "ADD_TREADMILL_BRISK_WALK"
      ? {
          name_en: "Treadmill Brisk Walk",
          name_ar: "مشي سريع على جهاز المشي",
          equipment: ["TREADMILL"],
          home: [] as string[],
        }
      : {
          name_en: "Brisk Walk (Outdoor / Neighborhood / Indoor Fallback)",
          name_ar: "مشي سريع (خارجي / حي / بديل داخلي آمن)",
          equipment: ["NO_EQUIPMENT"],
          home: ["SPACE_REQUIRED", "BODYWEIGHT"],
        };

  return {
    slot_key: opts.slot_key ?? `${activity_role}:${additionSpecId}`,
    activity_role,
    external_id: null,
    addition_spec_id: additionSpecId,
    name_en: meta.name_en,
    name_ar: meta.name_ar,
    slug: null,
    equipment: meta.equipment,
    primary_muscles: ["CARDIOVASCULAR", "LEGS"],
    sets: 1,
    reps_min: null,
    reps_max: null,
    reps_label: durationLabel,
    rest_seconds: 0,
    smart_progression_eligible: false,
    excluded_from_main_volume: true,
    notes_ar: opts.notes_ar ?? "كارديو تحت سيطرة المدرب — ليس Smart Progression",
    home_requirements: meta.home,
    content_status: "EXERCISE_LIBRARY_ADDITION_REQUIRED",
  };
}

export function restDay(day_number: number): SequenceSession {
  return {
    session_key: `REST_${day_number}`,
    day_number,
    day_type: "rest",
    session_name_ar: "راحة",
    session_name_en: "Rest",
    session_purpose_ar: "استعادة وتعافٍ",
    muscle_focus: null,
    estimated_minutes: null,
    exercises: [],
  };
}

export function fillWeek(workouts: SequenceSession[], total = 7): SequenceSession[] {
  const by = new Map(workouts.map((w) => [w.day_number, w]));
  const out: SequenceSession[] = [];
  for (let i = 1; i <= total; i++) {
    out.push(by.get(i) ?? restDay(i));
  }
  return out;
}

export function assertEnvCompatible(externalId: string, env: TemplateEnvironment) {
  const row = resolveLibraryExercise(externalId);
  const locs = row.location_compatibility ?? [];
  if (env === "HOME" && !locs.includes("HOME") && !locs.includes("NO_EQUIPMENT")) {
    throw new Error(`HOME_INCOMPATIBLE: ${externalId} (${row.name_en}) locs=${locs.join(",")}`);
  }
  if (env === "GYM" && locs.length > 0 && !locs.includes("GYM") && !locs.includes("HOME")) {
    // allow HOME-only? prefer GYM listed
  }
}

export { BY_ID as LIBRARY_BY_ID, V2 as LIBRARY_ROWS };
