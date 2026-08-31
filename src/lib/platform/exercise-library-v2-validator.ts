/**
 * Phase 3 reusable Exercise Library V2 validators.
 * Catalog/source checks — no runtime guessing, no prescription engine.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type ExerciseV2Metadata,
  type LocationCompatibility,
  EXERCISE_EXTERNAL_ID_PATTERN,
  filterV2Candidates,
  isValidExternalId,
  isV2EligibleExercise,
  substitutionCandidates,
  validateV2Combination,
} from "@/lib/platform/exercise-library-v2";

export type CatalogExercise = {
  external_id: string;
  name_en: string;
  name_ar: string;
  group: string;
  equipment: string;
  level: string;
  status: string;
};

export type AuthoredV2Record = {
  external_id: string;
  name_en: string;
  name_ar: string;
  exercise_type: string;
  primary_muscle_canonical: string;
  secondary_muscles_canonical: string[];
  muscle_contributions: Array<{ muscle: string; contribution: string }>;
  primary_movement_role: string;
  secondary_movement_roles: string[];
  substitution_group: string;
  mechanics: string;
  loading_type: string;
  required_equipment: string[];
  equipment_state: string;
  location_compatibility: string[];
  is_bodyweight: boolean;
  is_unilateral: boolean;
  execution_sides: string;
  supports_timed_prescription: boolean;
  prescription_mode: string;
  conditioning_class: string | null;
  complexity: string;
  beginner_eligible: boolean;
  v2_metadata_status: string;
};

export type LibraryAuditReport = {
  TOTAL_EXERCISES: number;
  ACTIVE_EXERCISES: number;
  V2_ELIGIBLE: number;
  REVIEW_REQUIRED: number;
  BLOCKED: number;
  MISSING_EXTERNAL_ID: number;
  DUPLICATE_EXTERNAL_ID: number;
  INVALID_EXTERNAL_ID: number;
  MISSING_PRIMARY_MUSCLE: number;
  MISSING_MOVEMENT_ROLE: number;
  MISSING_EQUIPMENT: number;
  UNKNOWN_MECHANICS: number;
  UNKNOWN_PRESCRIPTION_MODE: number;
  MEDIA_READY: number;
  MEDIA_PLACEHOLDER: number;
  MEDIA_MISSING: number;
  MEDIA_REVIEW_REQUIRED: number;
  POSSIBLE_DUPLICATE_PAIRS: Array<[string, string]>;
  ROLE_COVERAGE: Record<string, number>;
  MUSCLE_COVERAGE: Record<string, number>;
  EQUIPMENT_COVERAGE: Record<string, number>;
  LOCATION_COVERAGE: Record<string, number>;
  ROLE_WITH_ZERO_ELIGIBLE_EXERCISES: string[];
  GOAL_REQUIRED_MUSCLE_WITH_LOW_COVERAGE: string[];
  SUBSTITUTION_GAPS: string[];
  PROGRAM_REFERENCES_WITHOUT_MATCH: string[];
  ORPHAN_ACTIVE_PROGRAM_REFERENCE: number;
  NAME_QA: {
    missing_name_ar: string[];
    missing_name_en: string[];
    placeholder_names: string[];
    id_as_name: string[];
  };
};

const GOAL_MUSCLES = [
  "GLUTES",
  "BICEPS",
  "TRICEPS",
  "SHOULDERS",
  "UPPER_BACK",
  "LATS",
  "CORE",
  "RECTUS_ABDOMINIS",
  "QUADRICEPS",
  "HAMSTRINGS",
  "CHEST",
  "CALVES",
];

const REQUIRED_ROLES = [
  "SQUAT",
  "HINGE",
  "HIP_EXTENSION",
  "HORIZONTAL_PUSH",
  "HORIZONTAL_PULL",
  "VERTICAL_PUSH",
  "VERTICAL_PULL",
  "ELBOW_FLEXION",
  "ELBOW_EXTENSION",
  "SHOULDER_ABDUCTION",
  "HIP_ABDUCTION",
  "ANTI_EXTENSION",
  "STEADY_CARDIO",
];

export function loadExerciseCatalog(root = process.cwd()): CatalogExercise[] {
  const data = JSON.parse(readFileSync(join(root, "scripts/exercise-library.json"), "utf8")) as Record<
    string,
    Array<{ id: string; name: string; name_ar: string; equipment: string; level: string; status: string }>
  >;
  const rows: CatalogExercise[] = [];
  for (const [group, items] of Object.entries(data)) {
    for (const item of items) {
      rows.push({
        external_id: item.id,
        name_en: item.name,
        name_ar: item.name_ar,
        group,
        equipment: item.equipment ?? "",
        level: item.level ?? "",
        status: item.status ?? "placeholder",
      });
    }
  }
  return rows;
}

export function loadAuthoredV2Metadata(root = process.cwd()): AuthoredV2Record[] {
  return JSON.parse(
    readFileSync(join(root, "scripts/exercise-library-v2-metadata.json"), "utf8"),
  ) as AuthoredV2Record[];
}

export function toV2Contract(record: AuthoredV2Record, mediaStatus = "placeholder"): ExerciseV2Metadata {
  return {
    external_id: record.external_id,
    name_en: record.name_en,
    name_ar: record.name_ar,
    primary_muscles: [record.primary_muscle_canonical],
    secondary_muscles: record.secondary_muscles_canonical,
    muscle_contributions: record.muscle_contributions.map((item) => ({
      muscle: item.muscle,
      contribution: item.contribution as ExerciseV2Metadata["muscle_contributions"][number]["contribution"],
    })),
    primary_movement_role: record.primary_movement_role,
    secondary_movement_roles: record.secondary_movement_roles,
    substitution_group: record.substitution_group,
    mechanics: record.mechanics as ExerciseV2Metadata["mechanics"],
    loading_type: record.loading_type as ExerciseV2Metadata["loading_type"],
    required_equipment: record.required_equipment,
    equipment_state: record.equipment_state as ExerciseV2Metadata["equipment_state"],
    location_compatibility: record.location_compatibility as LocationCompatibility[],
    is_bodyweight: record.is_bodyweight,
    is_unilateral: record.is_unilateral,
    execution_sides: record.execution_sides as ExerciseV2Metadata["execution_sides"],
    supports_timed_prescription: record.supports_timed_prescription,
    prescription_mode: record.prescription_mode as ExerciseV2Metadata["prescription_mode"],
    conditioning_class: record.conditioning_class as ExerciseV2Metadata["conditioning_class"],
    complexity: record.complexity as ExerciseV2Metadata["complexity"],
    beginner_eligible: record.beginner_eligible,
    metadata_status: record.v2_metadata_status as ExerciseV2Metadata["metadata_status"],
    media_status: mediaStatus,
  };
}

export function collectHardcodedProgramExternalIds(root = process.cwd()): string[] {
  const files = [
    "src/lib/platform/today-workout.ts",
    "src/lib/platform/weekly-workout-schedule.ts",
  ];
  const ids = new Set<string>();
  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    for (const match of source.matchAll(/external_id:\s*"([A-Z]{2}-\d{3})"/g)) {
      ids.add(match[1]!);
    }
  }
  return [...ids].sort();
}

function countBy(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

export function auditExerciseLibrary(root = process.cwd()): LibraryAuditReport {
  const catalog = loadExerciseCatalog(root);
  const authored = loadAuthoredV2Metadata(root);
  const mediaById = new Map(catalog.map((row) => [row.external_id, row.status]));
  const contracts = authored.map((row) => toV2Contract(row, mediaById.get(row.external_id) ?? "placeholder"));

  const ids = catalog.map((row) => row.external_id);
  const idCounts = countBy(ids);
  const duplicateIds = Object.values(idCounts).filter((count) => count > 1).length;
  const missingIds = catalog.filter((row) => !row.external_id).length;
  const invalidIds = catalog.filter((row) => row.external_id && !isValidExternalId(row.external_id)).length;

  const eligible = contracts.filter((row) =>
    isV2EligibleExercise({
      is_active: true,
      external_id: row.external_id,
      metadata_status: row.metadata_status,
      primary_muscles: row.primary_muscles,
      primary_movement_role: row.primary_movement_role,
      equipment_state: row.equipment_state,
      required_equipment: row.required_equipment,
      mechanics: row.mechanics,
      is_bodyweight: row.is_bodyweight,
      is_unilateral: row.is_unilateral,
      prescription_mode: row.prescription_mode,
      supports_timed_prescription: row.supports_timed_prescription,
    }),
  );

  const roleCoverage = countBy(eligible.map((row) => row.primary_movement_role ?? "NONE"));
  const muscleCoverage = countBy(eligible.map((row) => row.primary_muscles[0] ?? "NONE"));
  const equipmentCoverage = countBy(
    eligible.flatMap((row) => (row.required_equipment.length ? row.required_equipment : ["NO_EQUIPMENT"])),
  );
  const locationCoverage = countBy(eligible.flatMap((row) => row.location_compatibility));

  const possibleDuplicates: Array<[string, string]> = [];
  for (let i = 0; i < authored.length; i += 1) {
    for (let j = i + 1; j < authored.length; j += 1) {
      const left = authored[i]!;
      const right = authored[j]!;
      if (
        left.primary_movement_role === right.primary_movement_role &&
        left.primary_muscle_canonical === right.primary_muscle_canonical &&
        left.loading_type === right.loading_type &&
        left.name_en.replace(/\s+/g, "").toLowerCase() === right.name_en.replace(/\s+/g, "").toLowerCase()
      ) {
        possibleDuplicates.push([left.external_id, right.external_id]);
      }
    }
  }

  const programIds = collectHardcodedProgramExternalIds(root);
  const catalogIds = new Set(ids);
  const orphans = programIds.filter((id) => !catalogIds.has(id));

  const substitutionGaps = REQUIRED_ROLES.filter((role) => {
    const group = eligible.filter((row) => row.primary_movement_role === role);
    if (group.length < 2) return true;
    const home = group.filter((row) => row.location_compatibility.includes("HOME"));
    return home.length === 0;
  });

  return {
    TOTAL_EXERCISES: catalog.length,
    ACTIVE_EXERCISES: catalog.length,
    V2_ELIGIBLE: eligible.length,
    REVIEW_REQUIRED: contracts.filter((row) => row.metadata_status === "REVIEW_REQUIRED").length,
    BLOCKED: contracts.filter((row) => row.metadata_status === "BLOCKED").length,
    MISSING_EXTERNAL_ID: missingIds,
    DUPLICATE_EXTERNAL_ID: duplicateIds,
    INVALID_EXTERNAL_ID: invalidIds,
    MISSING_PRIMARY_MUSCLE: authored.filter((row) => !row.primary_muscle_canonical).length,
    MISSING_MOVEMENT_ROLE: authored.filter((row) => !row.primary_movement_role).length,
    MISSING_EQUIPMENT: authored.filter(
      (row) => row.equipment_state === "UNKNOWN" || (row.equipment_state === "HAS_EQUIPMENT" && !row.required_equipment.length),
    ).length,
    UNKNOWN_MECHANICS: authored.filter((row) => !row.mechanics).length,
    UNKNOWN_PRESCRIPTION_MODE: authored.filter((row) => !row.prescription_mode).length,
    MEDIA_READY: catalog.filter((row) => row.status === "ready").length,
    MEDIA_PLACEHOLDER: catalog.filter((row) => row.status === "placeholder").length,
    MEDIA_MISSING: catalog.filter((row) => row.status === "missing").length,
    MEDIA_REVIEW_REQUIRED: catalog.filter((row) => row.status === "review_required").length,
    POSSIBLE_DUPLICATE_PAIRS: possibleDuplicates,
    ROLE_COVERAGE: roleCoverage,
    MUSCLE_COVERAGE: muscleCoverage,
    EQUIPMENT_COVERAGE: equipmentCoverage,
    LOCATION_COVERAGE: locationCoverage,
    ROLE_WITH_ZERO_ELIGIBLE_EXERCISES: REQUIRED_ROLES.filter((role) => !roleCoverage[role]),
    GOAL_REQUIRED_MUSCLE_WITH_LOW_COVERAGE: GOAL_MUSCLES.filter((muscle) => {
      if (muscle === "CORE") {
        return (muscleCoverage.RECTUS_ABDOMINIS ?? 0) + (muscleCoverage.OBLIQUES ?? 0) < 3;
      }
      return (muscleCoverage[muscle] ?? 0) < 3;
    }),
    SUBSTITUTION_GAPS: substitutionGaps,
    PROGRAM_REFERENCES_WITHOUT_MATCH: orphans,
    ORPHAN_ACTIVE_PROGRAM_REFERENCE: orphans.length,
    NAME_QA: {
      missing_name_ar: catalog.filter((row) => !row.name_ar.trim()).map((row) => row.external_id),
      missing_name_en: catalog.filter((row) => !row.name_en.trim()).map((row) => row.external_id),
      placeholder_names: catalog
        .filter((row) => /^(tbd|placeholder|todo|exercise)$/i.test(row.name_en.trim()))
        .map((row) => row.external_id),
      id_as_name: catalog.filter((row) => row.name_en === row.external_id).map((row) => row.external_id),
    },
  };
}

export function assertLibraryInvariants(root = process.cwd()) {
  const catalog = loadExerciseCatalog(root);
  const authored = loadAuthoredV2Metadata(root);
  const report = auditExerciseLibrary(root);
  const issues: string[] = [];

  if (catalog.length !== 320) issues.push(`expected 320 catalog rows, got ${catalog.length}`);
  if (authored.length !== catalog.length) issues.push("authored V2 metadata count != catalog count");
  if (report.MISSING_EXTERNAL_ID !== 0) issues.push("active exercises missing external_id");
  if (report.DUPLICATE_EXTERNAL_ID !== 0) issues.push("duplicate external_id");
  if (report.INVALID_EXTERNAL_ID !== 0) issues.push("invalid external_id format");
  if (report.ORPHAN_ACTIVE_PROGRAM_REFERENCE !== 0) {
    issues.push(`orphan program refs: ${report.PROGRAM_REFERENCES_WITHOUT_MATCH.join(",")}`);
  }
  if (authored.some((row) => !EXERCISE_EXTERNAL_ID_PATTERN.test(row.external_id))) {
    issues.push("authored metadata has invalid external_id");
  }
  if (authored.some((row) => row.external_id.endsWith("-V2"))) {
    issues.push("V2 identity suffix created");
  }

  const byId = new Map(authored.map((row) => [row.external_id, row]));
  for (const row of catalog) {
    const meta = byId.get(row.external_id);
    if (!meta) issues.push(`missing V2 metadata for ${row.external_id}`);
    else if (meta.name_en !== row.name_en) issues.push(`name drift ${row.external_id}`);
  }

  for (const row of authored) {
    const combo = validateV2Combination({
      metadata_status: row.v2_metadata_status as never,
      loading_type: row.loading_type,
      is_bodyweight: row.is_bodyweight,
      required_equipment: row.required_equipment,
      equipment_state: row.equipment_state as never,
      prescription_mode: row.prescription_mode,
      supports_timed_prescription: row.supports_timed_prescription,
      primary_movement_role: row.primary_movement_role,
      conditioning_class: row.conditioning_class ?? undefined,
      exercise_type: row.exercise_type,
    });
    if (combo.length) issues.push(`${row.external_id}: ${combo.join(",")}`);
  }

  return { report, issues, catalog, authored };
}

export { filterV2Candidates, substitutionCandidates };
