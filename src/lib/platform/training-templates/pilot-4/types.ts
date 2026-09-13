/**
 * Pilot 4 template types (Phase 5).
 */

import type { AdminProgramDetail } from "@/lib/admin/admin-programs-api";
import type {
  ProgramTemplateContractV1,
  ResolvableTemplateRecord,
  TemplateActivityRole,
} from "@/lib/platform/training-templates";

export const PILOT_4_TEMPLATE_KEYS = [
  "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
  "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
  "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D",
  "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
] as const;

export type Pilot4TemplateKey = (typeof PILOT_4_TEMPLATE_KEYS)[number];

export type PilotExerciseSpec = {
  external_id: string;
  sets: number;
  reps_min: number | null;
  reps_max: number | null;
  reps_label: string | null;
  rest_seconds: number;
  role: "warmup" | "main" | "accessory" | "finisher";
  activity_role: TemplateActivityRole;
  notes_ar?: string | null;
  /** When true, does not count toward main resistance volume of 6. */
  excluded_from_main_volume?: boolean;
};

export type PilotDaySpec = {
  day_number: number;
  day_type: "workout" | "rest";
  title_ar: string;
  muscle_focus: string | null;
  estimated_minutes: number | null;
  exercises: PilotExerciseSpec[];
};

export type PilotTemplateDefinition = {
  key: Pilot4TemplateKey;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  version: number;
  status: "DRAFT" | "PUBLISHED";
  legacy_goal: "cut" | "bulk" | "fitness" | "recomp";
  level: "beginner" | "intermediate" | "advanced";
  days_per_week: number;
  duration_weeks: number;
  training_location: "GYM" | "HOME";
  equipment: string;
  contract: ProgramTemplateContractV1;
  week: {
    title_ar: string;
    days: PilotDaySpec[];
  };
};

export type PilotCatalogRecord = {
  definition: PilotTemplateDefinition;
  detail: AdminProgramDetail;
  resolvable: ResolvableTemplateRecord;
  exercise_audit: PilotExerciseAudit;
};

export type PilotExerciseAudit = {
  template_key: Pilot4TemplateKey;
  total_exercise_references: number;
  unique_external_ids: string[];
  core_100_references: number;
  full_library_references: number;
  missing_exercises: string[];
  missing_media: number;
  broken_references: number;
  library_readiness: ProgramTemplateContractV1["library_readiness"]["state"];
};
