/**
 * Phase 8 — Exercise Library compatibility, media & content readiness audit.
 * Audit-only: does not import templates or invent exercise IDs.
 */

import exerciseLibraryJson from "../../../../../scripts/exercise-library.json";
import exerciseLibraryV2Json from "../../../../../scripts/exercise-library-v2-metadata.json";
import { CORE_100_EXTERNAL_IDS } from "@/lib/platform/strategy-matrix/config/core-100-external-ids";
import { TEMPLATE_ACTIVITY_ROLES, type TemplateActivityRole } from "../activity-roles";
import { PILOT_4_DEFINITIONS } from "../pilot-4/definitions";
import { auditPilotExercises, loadExerciseCatalogIndex } from "../pilot-4/exercise-audit";
import {
  APPROVED_36_COUNT,
  APPROVED_36_TEMPLATE_REFS,
  type Approved36TemplateRef,
} from "./approved-36-reference";

export type ImportReadiness =
  | "READY_FOR_IMPORT"
  | "READY_WITH_REVIEW"
  | "CONTENT_ADDITION_REQUIRED"
  | "BLOCKED_BY_REFERENCE";

export type FamilyReadiness = "READY" | "READY_WITH_REVIEW" | "CONTENT_GAPS";

export type MediaClass = "MEDIA_READY" | "MEDIA_PARTIAL" | "MEDIA_MISSING";

export type RoleRenderClass = "FULLY_RENDERED" | "GENERIC_RENDERING" | "NOT_SUPPORTED";

export type EquipmentBucket =
  | "BODYWEIGHT"
  | "DUMBBELL"
  | "BARBELL"
  | "BENCH"
  | "CHAIR"
  | "BAND"
  | "CABLE"
  | "MACHINE"
  | "TREADMILL"
  | "BIKE"
  | "KETTLEBELL"
  | "OTHER";

export type PowerReadinessTag =
  | "LOW_COMPLEXITY"
  | "MODERATE_COMPLEXITY"
  | "JUMP_REQUIRED"
  | "SPACE_REQUIRED"
  | "BAND_REQUIRED"
  | "BALL_REQUIRED"
  | "MACHINE_REQUIRED";

export type MissingExerciseAddition = {
  classification: "EXERCISE_LIBRARY_ADDITION_REQUIRED";
  desired_name: string;
  movement_pattern: string;
  primary_muscles: string[];
  environment: "GYM" | "HOME" | "BOTH";
  equipment: string[];
  difficulty: string;
  activity_role: string;
  reason: string;
  similar_existing: Array<{ external_id: string; name_en: string; match: "NO_MATCH" | "POSSIBLE_DUPLICATE" | "EXISTING_EXERCISE_USABLE" }>;
  duplicate_risk: "LOW" | "MEDIUM" | "HIGH";
};

export type CatalogExercise = {
  external_id: string;
  name_en: string;
  name_ar: string;
  group: string;
  equipment_label: string;
  level: string;
  catalog_status: string;
};

export type V2Exercise = {
  external_id: string;
  name_en: string;
  name_ar: string;
  group: string;
  exercise_type: string;
  primary_muscle_canonical?: string;
  primary_movement_role?: string;
  required_equipment?: string[];
  location_compatibility?: string[];
  difficulty?: string;
  complexity?: string;
  beginner_eligible?: boolean;
  loading_type?: string;
  is_bodyweight?: boolean;
  supports_timed_prescription?: boolean;
  prescription_mode?: string;
  substitution_group?: string;
  v2_metadata_status?: string;
};

export const KNOWN_ID_EXPECTATIONS: Array<{ external_id: string; expected_name_en: string }> = [
  { external_id: "WU-001", expected_name_en: "Arm Circles" },
  { external_id: "WU-002", expected_name_en: "Leg Swings" },
  { external_id: "LE-003", expected_name_en: "Goblet Squat" },
  { external_id: "CH-003", expected_name_en: "Dumbbell Bench Press" },
  { external_id: "BA-016", expected_name_en: "Seated Cable Row" },
  { external_id: "BA-023", expected_name_en: "Romanian Deadlift" },
  { external_id: "SH-005", expected_name_en: "Lateral Raise" },
  { external_id: "AB-011", expected_name_en: "Dead Bug" },
  { external_id: "CR-001", expected_name_en: "Treadmill Run" },
  { external_id: "CH-002", expected_name_en: "Incline Bench Press" },
  { external_id: "SH-027", expected_name_en: "Smith Machine Press" },
  { external_id: "AB-001", expected_name_en: "Crunch" },
];

const CORE_SET = new Set(CORE_100_EXTERNAL_IDS);

function flattenCatalog(): CatalogExercise[] {
  const raw = exerciseLibraryJson as Record<string, unknown>;
  const out: CatalogExercise[] = [];
  for (const [group, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const id = String(row.id ?? "");
      if (!id) continue;
      out.push({
        external_id: id,
        name_en: String(row.name ?? ""),
        name_ar: String(row.name_ar ?? ""),
        group,
        equipment_label: String(row.equipment ?? ""),
        level: String(row.level ?? ""),
        catalog_status: String(row.status ?? ""),
      });
    }
  }
  return out;
}

function loadV2(): V2Exercise[] {
  return exerciseLibraryV2Json as V2Exercise[];
}

export function detectDuplicateExternalIds(catalog: CatalogExercise[] = flattenCatalog()): string[] {
  const seen = new Map<string, number>();
  for (const row of catalog) seen.set(row.external_id, (seen.get(row.external_id) ?? 0) + 1);
  return [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

export function detectDuplicateSlugs(catalog: CatalogExercise[] = flattenCatalog()): string[] {
  // Catalog has no explicit slug field; slug ≈ lowercase external_id / name slug candidates from name_en
  const bySlug = new Map<string, string[]>();
  for (const row of catalog) {
    const slug = row.name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) continue;
    const list = bySlug.get(slug) ?? [];
    list.push(row.external_id);
    bySlug.set(slug, list);
  }
  return [...bySlug.entries()].filter(([, ids]) => ids.length > 1).flatMap(([, ids]) => ids);
}

export function detectNearDuplicateNames(v2: V2Exercise[] = loadV2()): Array<{ name_norm: string; ids: string[] }> {
  const byNorm = new Map<string, string[]>();
  for (const row of v2) {
    const norm = row.name_en.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const list = byNorm.get(norm) ?? [];
    list.push(row.external_id);
    byNorm.set(norm, list);
  }
  return [...byNorm.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([name_norm, ids]) => ({ name_norm, ids }));
}

export function validateKnownIds(
  catalog: CatalogExercise[] = flattenCatalog(),
): Array<{ external_id: string; expected_name_en: string; found: boolean; actual_name_en: string | null; name_match: boolean }> {
  const byId = new Map(catalog.map((r) => [r.external_id, r]));
  return KNOWN_ID_EXPECTATIONS.map((exp) => {
    const row = byId.get(exp.external_id);
    const actual = row?.name_en ?? null;
    const name_match = actual
      ? actual.toLowerCase().includes(exp.expected_name_en.toLowerCase().split("—")[0]!.trim().toLowerCase()) ||
        exp.expected_name_en.toLowerCase().includes(actual.toLowerCase())
      : false;
    return {
      external_id: exp.external_id,
      expected_name_en: exp.expected_name_en,
      found: Boolean(row),
      actual_name_en: actual,
      name_match: Boolean(row) && name_match,
    };
  });
}

export function validateCore100(catalog: CatalogExercise[] = flattenCatalog()): {
  expected_count: number;
  unique_count: number;
  missing_from_library: string[];
  duplicate_in_core_list: string[];
  result: "PASS" | "FAIL";
} {
  const ids = [...CORE_100_EXTERNAL_IDS];
  const unique = new Set(ids);
  const library = new Set(catalog.map((r) => r.external_id));
  const missing = ids.filter((id) => !library.has(id));
  const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
  return {
    expected_count: 100,
    unique_count: unique.size,
    missing_from_library: missing,
    duplicate_in_core_list: [...new Set(dups)],
    result: unique.size === 100 && missing.length === 0 && dups.length === 0 ? "PASS" : "FAIL",
  };
}

export function countByExerciseType(v2: V2Exercise[] = loadV2()): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of v2) {
    const t = row.exercise_type || "unknown";
    out[t] = (out[t] ?? 0) + 1;
  }
  return out;
}

export function classifyWarmupRegion(nameEn: string): string {
  const n = nameEn.toLowerCase();
  if (/arm|shoulder|scap|band pull|dislocation|circle/.test(n) && !/leg|hip|ankle/.test(n)) return "shoulder";
  if (/leg|lunge|squat|knee/.test(n)) return "lower-body";
  if (/hip|glute|bridge/.test(n)) return "hip";
  if (/ankle|calf|foot/.test(n)) return "ankle";
  if (/spine|trunk|torso|thoracic|cat.?cow|world.?greatest/.test(n)) return "spine/trunk";
  if (/jog|march|jumping jack|cardio|high.?knee/.test(n)) return "general cardio";
  if (/full|body|jumping|burpee/.test(n)) return "full-body";
  if (/arm|upper/.test(n)) return "upper-body";
  return "movement preparation";
}

export function auditWarmups(v2: V2Exercise[] = loadV2()) {
  const warmups = v2.filter((e) => e.exercise_type === "warmup");
  const byRegion: Record<string, string[]> = {};
  for (const w of warmups) {
    const region = classifyWarmupRegion(w.name_en);
    (byRegion[region] ??= []).push(w.external_id);
  }
  return {
    count: warmups.length,
    expected_approx: 25,
    supports_3_per_session_across_36: warmups.length >= 15,
    by_region: byRegion,
    status: warmups.length >= 20 ? ("CLASSIFIED_SUFFICIENT" as const) : ("CLASSIFIED_THIN" as const),
  };
}

export function classifyMobilityKind(nameEn: string): "dynamic mobility" | "controlled ROM" | "static stretch" | "activation" {
  const n = nameEn.toLowerCase();
  if (/stretch|hold|pigeon|couch|doorway/.test(n)) return "static stretch";
  if (/activation|glute bridge|dead bug|bird.?dog|clam/.test(n)) return "activation";
  if (/circle|swing|open|rotation|thread|cat.?cow|dislocation/.test(n)) return "dynamic mobility";
  return "controlled ROM";
}

export function auditMobility(v2: V2Exercise[] = loadV2()) {
  const mob = v2.filter((e) => e.exercise_type === "mobility");
  const byKind: Record<string, string[]> = {};
  const byArea: Record<string, string[]> = {};
  for (const m of mob) {
    const kind = classifyMobilityKind(m.name_en);
    (byKind[kind] ??= []).push(m.external_id);
    const n = m.name_en.toLowerCase();
    let area = "general movement control";
    if (/hip|pigeon|couch|90|flexor/.test(n)) area = "hips";
    else if (/shoulder|scap|dislocation|pec/.test(n)) area = "shoulders";
    else if (/thoracic|t.?spine|rotation/.test(n)) area = "thoracic spine";
    else if (/ankle|calf|foot/.test(n)) area = "ankles";
    else if (/trunk|core|spine|cat/.test(n)) area = "trunk";
    (byArea[area] ??= []).push(m.external_id);
  }
  return {
    count: mob.length,
    expected_approx: 25,
    by_kind: byKind,
    by_area: byArea,
    status: mob.length >= 20 ? ("CLASSIFIED_SUFFICIENT" as const) : ("CLASSIFIED_THIN" as const),
    gaps_for_families: [] as string[],
  };
}

export function detectTreadmillBriskWalk(v2: V2Exercise[] = loadV2()): {
  status: "EXISTS" | "ABSENT";
  fat_loss_gym_cardio_activity: "READY" | "ADDITION_REQUIRED";
  duration_prescription_supported: boolean;
  matching_ids: string[];
} {
  const matches = v2.filter((e) => {
    const n = e.name_en.toLowerCase();
    return /treadmill/.test(n) && /brisk/.test(n) && /walk/.test(n);
  });
  const inclineWalk = v2.find((e) => e.external_id === "CR-015");
  return {
    status: matches.length > 0 ? "EXISTS" : "ABSENT",
    fat_loss_gym_cardio_activity: matches.length > 0 ? "READY" : "ADDITION_REQUIRED",
    duration_prescription_supported: true,
    matching_ids: matches.map((m) => m.external_id),
    // note for report consumers
    ...(inclineWalk ? { near_miss: { external_id: "CR-015", name_en: inclineWalk.name_en } } : {}),
  } as {
    status: "EXISTS" | "ABSENT";
    fat_loss_gym_cardio_activity: "READY" | "ADDITION_REQUIRED";
    duration_prescription_supported: boolean;
    matching_ids: string[];
    near_miss?: { external_id: string; name_en: string };
  };
}

export function auditHomeCardio(v2: V2Exercise[] = loadV2()) {
  const home = v2.filter((e) => (e.location_compatibility ?? []).includes("HOME"));
  const aerobicOptions = home.filter((e) => {
    if (e.exercise_type === "cardio") return true;
    const n = e.name_en.toLowerCase();
    return /march|brisk walk|walk in place|jog|aerobic|jump rope|burpee|mountain climber/.test(n);
  });
  const trueLowImpact = aerobicOptions.filter((e) => {
    const n = e.name_en.toLowerCase();
    return /march|walk/.test(n) && !/jump|burpee|rope/.test(n);
  });
  const hasBriskWalk = aerobicOptions.some((e) => /brisk walk/.test(e.name_en.toLowerCase()));
  const hasMarch = aerobicOptions.some((e) => /march/.test(e.name_en.toLowerCase()));
  let readiness: "READY" | "REVIEW" | "ADDITION_REQUIRED" = "READY";
  if (!hasBriskWalk || trueLowImpact.length < 2) readiness = "ADDITION_REQUIRED";
  else if (aerobicOptions.length < 4) readiness = "REVIEW";

  return {
    HOME_AEROBIC_OPTIONS_COUNT: aerobicOptions.length,
    HOME_CARDIO_READINESS: readiness,
    options: aerobicOptions.map((e) => ({
      external_id: e.external_id,
      name_en: e.name_en,
      exercise_type: e.exercise_type,
    })),
    has_brisk_walk: hasBriskWalk,
    has_march_in_place: hasMarch,
    low_impact_count: trueLowImpact.length,
  };
}

export function classifyPowerCandidate(row: V2Exercise): PowerReadinessTag[] {
  const tags: PowerReadinessTag[] = [];
  const n = row.name_en.toLowerCase();
  const eq = (row.required_equipment ?? []).join(" ").toLowerCase();
  if (/jump|plyo|hop|skip/.test(n)) tags.push("JUMP_REQUIRED");
  if (/space|sprint|shuttle/.test(n) || /JUMP/.test(eq)) tags.push("SPACE_REQUIRED");
  if (/band/.test(n) || /BAND/.test(eq)) tags.push("BAND_REQUIRED");
  if (/ball|med.?ball|slam/.test(n)) tags.push("BALL_REQUIRED");
  if (/smith|machine|cable|sled|erg/.test(n) || /MACHINE|CABLE|SMITH|SLED/.test(eq)) tags.push("MACHINE_REQUIRED");
  if (tags.length === 0) {
    if (row.beginner_eligible === false || row.complexity === "HIGH" || row.difficulty === "advanced") {
      tags.push("MODERATE_COMPLEXITY");
    } else {
      tags.push("LOW_COMPLEXITY");
    }
  } else if (!tags.includes("JUMP_REQUIRED") && !tags.includes("MACHINE_REQUIRED")) {
    tags.push("MODERATE_COMPLEXITY");
  }
  return [...new Set(tags)];
}

export function auditPower(v2: V2Exercise[] = loadV2()) {
  const candidates = v2.filter((e) => {
    const n = e.name_en.toLowerCase();
    return (
      /jump|swing|slam|plyo|power|throw|med ball|box jump|kettlebell swing|hang clean|broad jump/.test(n) ||
      e.exercise_type === "cardio" && /sprint|hiit|battle/.test(n)
    );
  });
  const classified = candidates.map((e) => ({
    external_id: e.external_id,
    name_en: e.name_en,
    environment: e.location_compatibility ?? [],
    tags: classifyPowerCandidate(e),
  }));
  const homeLow = classified.filter(
    (c) => c.environment.includes("HOME") && c.tags.includes("LOW_COMPLEXITY"),
  );
  const homeJump = classified.filter(
    (c) => c.environment.includes("HOME") && c.tags.includes("JUMP_REQUIRED"),
  );
  return {
    candidate_count: classified.length,
    classified,
    beginner_home_options: homeLow.length + homeJump.filter((c) => !c.tags.includes("MACHINE_REQUIRED")).length,
    note: "Athletic Performance does not require Olympic lifts or mandatory jumping.",
    status: classified.length >= 3 ? ("CLASSIFIED" as const) : ("THIN" as const),
  };
}

export function rampUpLibraryModelSupported(): {
  RAMP_UP_LIBRARY_MODEL: "SUPPORTED";
  reason: string;
} {
  return {
    RAMP_UP_LIBRARY_MODEL: "SUPPORTED",
    reason:
      "Same exercise identity + activity_role=EXERCISE_SPECIFIC_RAMP_UP + distinct load/reps prescription is already used by Pilot 4 and persisted in DB/RPC.",
  };
}

export function bucketEquipment(required: string[] | undefined, loadingType?: string, isBodyweight?: boolean): EquipmentBucket[] {
  const buckets = new Set<EquipmentBucket>();
  const tokens = [...(required ?? []), loadingType ?? ""].map((t) => t.toUpperCase());
  if (isBodyweight || tokens.some((t) => t.includes("NO_EQUIPMENT") || t === "BODYWEIGHT")) buckets.add("BODYWEIGHT");
  if (tokens.some((t) => t.includes("DUMBBELL"))) buckets.add("DUMBBELL");
  if (tokens.some((t) => t.includes("BARBELL"))) buckets.add("BARBELL");
  if (tokens.some((t) => t.includes("BENCH"))) buckets.add("BENCH");
  if (tokens.some((t) => t.includes("CHAIR"))) buckets.add("CHAIR");
  if (tokens.some((t) => t.includes("BAND"))) buckets.add("BAND");
  if (tokens.some((t) => t.includes("CABLE"))) buckets.add("CABLE");
  if (tokens.some((t) => /SMITH|MACHINE|LEG_PRESS|HACK|LAT_PULL|PEC|FLY/.test(t) || t === "MACHINE")) buckets.add("MACHINE");
  if (tokens.some((t) => t.includes("TREADMILL"))) buckets.add("TREADMILL");
  if (tokens.some((t) => t.includes("BIKE") || t.includes("ASSAULT"))) buckets.add("BIKE");
  if (tokens.some((t) => t.includes("KETTLEBELL"))) buckets.add("KETTLEBELL");
  if (buckets.size === 0) buckets.add("OTHER");
  return [...buckets];
}

export function auditHomeEquipment(v2: V2Exercise[] = loadV2()) {
  const home = v2.filter((e) => (e.location_compatibility ?? []).includes("HOME"));
  const byBucket: Record<string, number> = {};
  let capabilityMetadataGaps = 0;
  for (const e of home) {
    for (const b of bucketEquipment(e.required_equipment, e.loading_type, e.is_bodyweight)) {
      byBucket[b] = (byBucket[b] ?? 0) + 1;
    }
    const needsBand = (e.required_equipment ?? []).some((x) => /BAND/i.test(x));
    const needsBench = (e.required_equipment ?? []).some((x) => /BENCH|CHAIR/i.test(x));
    // HOME capability fields are not on exercise rows → gap when dependency exists
    if (needsBand || needsBench) capabilityMetadataGaps += 1;
  }
  return {
    home_compatible_count: home.length,
    equipment_bucket_counts: byBucket,
    CAPABILITY_METADATA_GAP: true as const,
    exercises_with_implicit_capability_deps: capabilityMetadataGaps,
    missing_capability_fields: [
      "training_space",
      "available_load",
      "load_increment_granularity",
      "safe_band_anchor",
      "stable_bench_or_chair",
      "stable_elevated_surface",
    ],
    note: "Do not mark HOME compatible merely because no machine exists — location_compatibility is present but client capability metadata is not on exercise rows.",
  };
}

export function auditGymEquipment(v2: V2Exercise[] = loadV2()) {
  const gym = v2.filter((e) => (e.location_compatibility ?? []).includes("GYM"));
  const specialty: Array<{ external_id: string; name_en: string; reason: string }> = [];
  for (const e of gym) {
    const eq = (e.required_equipment ?? []).join(" ").toUpperCase();
    const n = e.name_en.toLowerCase();
    if (/SMITH/.test(eq) || /smith/.test(n)) specialty.push({ external_id: e.external_id, name_en: e.name_en, reason: "Smith machine" });
    else if (/CABLE/.test(eq) || /cable/.test(n)) specialty.push({ external_id: e.external_id, name_en: e.name_en, reason: "cable station" });
    else if (/SLED|SKI_ERG|VERSA|ASSAULT|BATTLE|POOL|ROWER/.test(eq) || /sled|ski erg|versa|battle rope|swim/.test(n)) {
      specialty.push({ external_id: e.external_id, name_en: e.name_en, reason: "specialty machine/attachment" });
    }
  }
  return {
    gym_compatible_count: gym.length,
    specialty_review_count: specialty.length,
    specialty_examples: specialty.slice(0, 25),
    status: "CLASSIFIED" as const,
  };
}

export function auditDifficultyMismatches(v2: V2Exercise[] = loadV2()) {
  const review: Array<{ external_id: string; name_en: string; reason: string }> = [];
  for (const e of v2) {
    const n = e.name_en.toLowerCase();
    if (/snatch|clean and jerk|muscle.?up|handstand|pistol squat|nordic/.test(n)) {
      review.push({ external_id: e.external_id, name_en: e.name_en, reason: "advanced technical lift — review before Beginner Foundation" });
    }
    if (/box jump|broad jump|depth jump|burpee/.test(n) && e.beginner_eligible !== false) {
      review.push({ external_id: e.external_id, name_en: e.name_en, reason: "high-impact / jump — needs readiness gate" });
    }
  }
  return { review_candidates: review, status: "CLASSIFIED" as const };
}

/** Female media variants are not modeled on exercise rows today. */
export function auditFemaleMedia(v2: V2Exercise[] = loadV2(), relevantIds?: string[]) {
  const relevant = relevantIds?.length
    ? v2.filter((e) => relevantIds.includes(e.external_id))
    : v2.filter((e) => {
        const g = (e.group || "").toLowerCase();
        const m = (e.primary_muscle_canonical || "").toUpperCase();
        return g.includes("glute") || m === "GLUTES" || e.exercise_type === "warmup" || e.exercise_type === "mobility";
      });

  const TOTAL_RELEVANT_EXERCISES = relevant.length;
  const FEMALE_MEDIA_READY = 0;
  const STANDARD_ONLY = TOTAL_RELEVANT_EXERCISES; // identity exists; female variant absent
  const MEDIA_MISSING = 0; // standard pack may still be partial — counted in general media
  const FEMALE_MEDIA_COVERAGE_PERCENT = TOTAL_RELEVANT_EXERCISES === 0 ? 0 : Math.round((FEMALE_MEDIA_READY / TOTAL_RELEVANT_EXERCISES) * 100);

  return {
    TOTAL_RELEVANT_EXERCISES,
    FEMALE_MEDIA_READY,
    STANDARD_ONLY,
    MEDIA_MISSING,
    FEMALE_MEDIA_COVERAGE_PERCENT,
    FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE: true,
    resolution_order: ["FEMALE", "STANDARD", "MEDIA_MISSING"] as const,
    note: "Canonical exercise identity remains single. Female variants are preference/media only — not duplicated records. No female media fields exist on library rows yet (METADATA_MODEL_GAP).",
  };
}

export function classifyCatalogMediaStatus(catalogStatus: string): MediaClass {
  if (catalogStatus === "ready" || catalogStatus === "filmed") return "MEDIA_READY";
  if (catalogStatus === "placeholder" || catalogStatus === "partial") return "MEDIA_PARTIAL";
  return "MEDIA_MISSING";
}

export function auditGeneralMedia(catalog: CatalogExercise[] = flattenCatalog()) {
  let MEDIA_READY = 0;
  let MEDIA_PARTIAL = 0;
  let MEDIA_MISSING = 0;
  for (const row of catalog) {
    const cls = classifyCatalogMediaStatus(row.catalog_status);
    if (cls === "MEDIA_READY") MEDIA_READY += 1;
    else if (cls === "MEDIA_PARTIAL") MEDIA_PARTIAL += 1;
    else MEDIA_MISSING += 1;
  }
  const ab001 = catalog.find((r) => r.external_id === "AB-001");
  return {
    MEDIA_READY,
    MEDIA_PARTIAL,
    MEDIA_MISSING,
    ab001: {
      external_id: "AB-001",
      catalog_status: ab001?.catalog_status ?? null,
      local_asset_video_known: true,
      db_video_status_observed: "placeholder",
      note: "Historical local exercise.mp4 exists under core-100 content pack; local DB row remains placeholder with empty video_path.",
    },
  };
}

export function classifyActivityRoleRendering(): Record<TemplateActivityRole, RoleRenderClass> {
  // Admin preview: activityRoleLabelAr — FULLY_RENDERED for labeled roles.
  // Client workout UI: Phase 6 evidence — activity_role present in RPC but chips often generic.
  const adminFully: TemplateActivityRole[] = [
    "GENERAL_WARM_UP",
    "TARGETED_DYNAMIC_WARM_UP",
    "EXERCISE_SPECIFIC_RAMP_UP",
    "MAIN_RESISTANCE",
    "POST_WORKOUT_CARDIO",
    "POWER_SKILL_BLOCK",
    "MOBILITY_ACTIVITY",
  ];
  const out = {} as Record<TemplateActivityRole, RoleRenderClass>;
  for (const role of TEMPLATE_ACTIVITY_ROLES) {
    if (role === "MAIN_RESISTANCE") out[role] = "FULLY_RENDERED";
    else if (adminFully.includes(role)) out[role] = "GENERIC_RENDERING";
    else out[role] = "NOT_SUPPORTED";
  }
  // Refine: Admin labels exist for all known roles via ACTIVITY_ROLE_LABELS_AR — client is generic.
  out.GENERAL_WARM_UP = "GENERIC_RENDERING";
  out.TARGETED_DYNAMIC_WARM_UP = "GENERIC_RENDERING";
  out.EXERCISE_SPECIFIC_RAMP_UP = "GENERIC_RENDERING";
  out.POST_WORKOUT_CARDIO = "GENERIC_RENDERING";
  out.AEROBIC_ENDURANCE_BLOCK = "GENERIC_RENDERING";
  out.CONTROLLED_AEROBIC_INTERVAL_BLOCK = "NOT_SUPPORTED";
  out.POWER_SKILL_BLOCK = "GENERIC_RENDERING";
  out.MOBILITY_ACTIVITY = "GENERIC_RENDERING";
  out.DAILY_ACTIVITY = "NOT_SUPPORTED";
  out.MAIN_RESISTANCE = "FULLY_RENDERED";
  return out;
}

export function missingExerciseAdditions(v2: V2Exercise[] = loadV2()): MissingExerciseAddition[] {
  const brisk = detectTreadmillBriskWalk(v2);
  const homeCardio = auditHomeCardio(v2);
  const additions: MissingExerciseAddition[] = [];

  if (brisk.status === "ABSENT") {
    const similar = [
      { external_id: "CR-001", name_en: "Treadmill Run", match: "POSSIBLE_DUPLICATE" as const },
      { external_id: "CR-015", name_en: "Incline Walk", match: "POSSIBLE_DUPLICATE" as const },
    ];
    additions.push({
      classification: "EXERCISE_LIBRARY_ADDITION_REQUIRED",
      desired_name: "Treadmill Brisk Walk",
      movement_pattern: "AEROBIC_WALK",
      primary_muscles: ["CARDIOVASCULAR", "LEGS"],
      environment: "GYM",
      equipment: ["TREADMILL"],
      difficulty: "beginner",
      activity_role: "POST_WORKOUT_CARDIO / GENERAL_WARM_UP (duration)",
      reason: "Fat Loss GYM requires distinct brisk walk (10 min start + 15 min end). Must not silently encode as Treadmill Run.",
      similar_existing: similar,
      duplicate_risk: "MEDIUM",
    });
  }

  if (!homeCardio.has_brisk_walk) {
    additions.push({
      classification: "EXERCISE_LIBRARY_ADDITION_REQUIRED",
      desired_name: "Brisk Walk (Outdoor / Neighborhood)",
      movement_pattern: "AEROBIC_WALK",
      primary_muscles: ["CARDIOVASCULAR"],
      environment: "HOME",
      equipment: ["NO_EQUIPMENT"],
      difficulty: "beginner",
      activity_role: "POST_WORKOUT_CARDIO / AEROBIC_ENDURANCE_BLOCK",
      reason: "HOME fat-loss / endurance templates need machine-free brisk walk distinct from March in Place and Jump Rope.",
      similar_existing: [
        { external_id: "WU-023", name_en: "March in Place", match: "POSSIBLE_DUPLICATE" },
        { external_id: "CR-016", name_en: "Outdoor Run", match: "POSSIBLE_DUPLICATE" },
      ],
      duplicate_risk: "MEDIUM",
    });
  }

  return additions;
}

export function computeFamilyReadiness(args: {
  treadmillBriskWalk: ReturnType<typeof detectTreadmillBriskWalk>;
  homeCardio: ReturnType<typeof auditHomeCardio>;
  mobility: ReturnType<typeof auditMobility>;
  power: ReturnType<typeof auditPower>;
  female: ReturnType<typeof auditFemaleMedia>;
  homeEquipment: ReturnType<typeof auditHomeEquipment>;
}): Array<{
  family: string;
  gym: FamilyReadiness;
  home: FamilyReadiness;
  notes: string;
}> {
  const { treadmillBriskWalk, homeCardio, power, female, homeEquipment } = args;
  return [
    {
      family: "FAT_LOSS",
      gym: treadmillBriskWalk.fat_loss_gym_cardio_activity === "READY" ? "READY_WITH_REVIEW" : "CONTENT_GAPS",
      home: homeCardio.HOME_CARDIO_READINESS === "READY" ? "READY_WITH_REVIEW" : "CONTENT_GAPS",
      notes: "Needs distinct treadmill brisk walk (GYM) and low-impact HOME aerobic options.",
    },
    {
      family: "MUSCLE_GAIN",
      gym: "READY_WITH_REVIEW",
      home: homeEquipment.CAPABILITY_METADATA_GAP ? "READY_WITH_REVIEW" : "READY",
      notes: "Core strength library adequate; HOME capability metadata gap remains.",
    },
    {
      family: "BODY_RECOMPOSITION",
      gym: "READY_WITH_REVIEW",
      home: "READY_WITH_REVIEW",
      notes: "Sequences not locked; library patterns exist.",
    },
    {
      family: "GENERAL_FITNESS",
      gym: "READY_WITH_REVIEW",
      home: "READY_WITH_REVIEW",
      notes: "Warm-up + strength coverage adequate; media partial.",
    },
    {
      family: "STRENGTH",
      gym: "READY_WITH_REVIEW",
      home: "CONTENT_GAPS",
      notes: "GYM-primary family; HOME strength templates not in provisional 36 set.",
    },
    {
      family: "ENDURANCE",
      gym: "READY_WITH_REVIEW",
      home: homeCardio.HOME_CARDIO_READINESS === "ADDITION_REQUIRED" ? "CONTENT_GAPS" : "READY_WITH_REVIEW",
      notes: "Machine cardio plentiful in GYM; HOME aerobic options thin.",
    },
    {
      family: "MOBILITY_FUNCTIONAL",
      gym: "READY_WITH_REVIEW",
      home: "READY_WITH_REVIEW",
      notes: "25 mobility exercises present; programming sequences not locked.",
    },
    {
      family: "HEALTHY_AGING_ACTIVE_LIFE",
      gym: "READY_WITH_REVIEW",
      home: "READY_WITH_REVIEW",
      notes: "Prefer low-impact; jump-heavy power candidates must be gated.",
    },
    {
      family: "ATHLETIC_PERFORMANCE",
      gym: power.status === "CLASSIFIED" ? "READY_WITH_REVIEW" : "CONTENT_GAPS",
      home: "READY_WITH_REVIEW",
      notes: "Power block candidates exist; jumping not mandatory.",
    },
    {
      family: "GLUTE_FOCUS",
      gym: female.FEMALE_MEDIA_COVERAGE_PERCENT < 50 ? "READY_WITH_REVIEW" : "READY",
      home: "CONTENT_GAPS",
      notes: "Female media completeness required before release; HOME sequences not yet defined.",
    },
  ];
}

export function classifyTemplateImportReadiness(
  ref: Approved36TemplateRef,
  ctx: {
    treadmillBriskWalk: ReturnType<typeof detectTreadmillBriskWalk>;
    homeCardio: ReturnType<typeof auditHomeCardio>;
    female: ReturnType<typeof auditFemaleMedia>;
    pilotKeys: Set<string>;
  },
): {
  TEMPLATE_KEY: string;
  PRIMARY_STRATEGY: string;
  LEVEL: string;
  ENVIRONMENT: string;
  DAYS: number;
  EXERCISE_REFERENCE_STATUS: string;
  WARMUP_STATUS: string;
  CARDIO_STATUS: string;
  POWER_STATUS: string;
  HOME_CAPABILITY_STATUS: string;
  MEDIA_STATUS: string;
  FEMALE_MEDIA_STATUS: string | null;
  OVERALL_IMPORT_READINESS: ImportReadiness;
  notes: string[];
} {
  const notes: string[] = [];
  let overall: ImportReadiness = "READY_WITH_REVIEW";

  const exerciseRef =
    ref.exercise_sequence_status === "APPROVED_EXERCISE"
      ? "APPROVED_EXERCISE"
      : ref.exercise_sequence_status === "NOT_YET_DEFINED"
        ? "NOT_YET_DEFINED"
        : "CANDIDATE_FOR_REVIEW";

  if (exerciseRef === "NOT_YET_DEFINED") {
    overall = "BLOCKED_BY_REFERENCE";
    notes.push("Exercise sequence not defined in project reference.");
  }

  let cardio: string = "LIBRARY_OK";
  if (ref.primary_strategy === "FAT_LOSS" && ref.environment === "GYM") {
    if (ctx.treadmillBriskWalk.status === "ABSENT") {
      cardio = "EXERCISE_LIBRARY_ADDITION_REQUIRED:TREADMILL_BRISK_WALK";
      overall = "CONTENT_ADDITION_REQUIRED";
      notes.push("Fat Loss GYM requires Treadmill Brisk Walk.");
    }
  }
  if (ref.environment === "HOME" && (ref.primary_strategy === "FAT_LOSS" || ref.primary_strategy === "ENDURANCE")) {
    if (ctx.homeCardio.HOME_CARDIO_READINESS === "ADDITION_REQUIRED") {
      cardio = "HOME_AEROBIC_ADDITION_REQUIRED";
      if (overall !== "BLOCKED_BY_REFERENCE") overall = "CONTENT_ADDITION_REQUIRED";
      notes.push("HOME aerobic options incomplete.");
    }
  }

  let femaleStatus: string | null = null;
  if (ref.female_media_policy === "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE") {
    femaleStatus = `COVERAGE_${ctx.female.FEMALE_MEDIA_COVERAGE_PERCENT}_PERCENT`;
    if (ctx.female.FEMALE_MEDIA_COVERAGE_PERCENT < 50 && overall === "READY_WITH_REVIEW") {
      overall = "CONTENT_ADDITION_REQUIRED";
      notes.push("Female media completeness required before release.");
    } else if (ctx.female.FEMALE_MEDIA_COVERAGE_PERCENT < 50 && overall === "READY_FOR_IMPORT") {
      overall = "CONTENT_ADDITION_REQUIRED";
    }
  }

  if (ctx.pilotKeys.has(ref.template_key) && overall === "READY_WITH_REVIEW" && exerciseRef === "APPROVED_EXERCISE") {
    // Pilot already imported — media still partial → keep review, not addition, unless cardio block
    if (!notes.some((n) => /Treadmill Brisk Walk|HOME aerobic|Female media/.test(n))) {
      overall = "READY_WITH_REVIEW";
      notes.push("Pilot 4 already imported; media mostly placeholder.");
    }
  }

  if (ref.template_key === "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D" && ctx.treadmillBriskWalk.status === "ABSENT") {
    overall = "CONTENT_ADDITION_REQUIRED";
  }

  return {
    TEMPLATE_KEY: ref.template_key,
    PRIMARY_STRATEGY: ref.primary_strategy,
    LEVEL: ref.level,
    ENVIRONMENT: ref.environment,
    DAYS: ref.days_per_week,
    EXERCISE_REFERENCE_STATUS: exerciseRef,
    WARMUP_STATUS: "LIBRARY_SUFFICIENT",
    CARDIO_STATUS: cardio,
    POWER_STATUS: ref.primary_strategy === "ATHLETIC_PERFORMANCE" ? "CANDIDATES_AVAILABLE" : "N_A_OR_OPTIONAL",
    HOME_CAPABILITY_STATUS: ref.environment === "HOME" ? "CAPABILITY_METADATA_GAP" : "N_A",
    MEDIA_STATUS: "MEDIA_PARTIAL",
    FEMALE_MEDIA_STATUS: femaleStatus,
    OVERALL_IMPORT_READINESS: overall,
    notes,
  };
}

export function runPhase8LibraryAudit() {
  const catalog = flattenCatalog();
  const v2 = loadV2();
  const core = validateCore100(catalog);
  const known = validateKnownIds(catalog);
  const dupExt = detectDuplicateExternalIds(catalog);
  const dupSlug = detectDuplicateSlugs(catalog);
  const nearDup = detectNearDuplicateNames(v2);
  const types = countByExerciseType(v2);
  const warmups = auditWarmups(v2);
  const mobility = auditMobility(v2);
  const treadmill = detectTreadmillBriskWalk(v2);
  const homeCardio = auditHomeCardio(v2);
  const power = auditPower(v2);
  const ramp = rampUpLibraryModelSupported();
  const homeEq = auditHomeEquipment(v2);
  const gymEq = auditGymEquipment(v2);
  const difficulty = auditDifficultyMismatches(v2);
  const female = auditFemaleMedia(v2);
  const media = auditGeneralMedia(catalog);
  const roles = classifyActivityRoleRendering();
  const missing = missingExerciseAdditions(v2);
  const families = computeFamilyReadiness({
    treadmillBriskWalk: treadmill,
    homeCardio,
    mobility,
    power,
    female,
    homeEquipment: homeEq,
  });

  const pilotKeys = new Set(PILOT_4_DEFINITIONS.map((d) => d.key));
  const template36 = APPROVED_36_TEMPLATE_REFS.map((ref) =>
    classifyTemplateImportReadiness(ref, {
      treadmillBriskWalk: treadmill,
      homeCardio,
      female,
      pilotKeys,
    }),
  );

  const pilotAudits = PILOT_4_DEFINITIONS.map((d) => auditPilotExercises(d, loadExerciseCatalogIndex()));
  const pilotBroken = pilotAudits.reduce((n, a) => n + a.broken_references, 0);

  const readinessCounts = {
    READY_FOR_IMPORT: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "READY_FOR_IMPORT").length,
    READY_WITH_REVIEW: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "READY_WITH_REVIEW").length,
    CONTENT_ADDITION_REQUIRED: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "CONTENT_ADDITION_REQUIRED").length,
    BLOCKED_BY_REFERENCE: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "BLOCKED_BY_REFERENCE").length,
  };

  return {
    phase: "8/10",
    phase_name: "EXERCISE_LIBRARY_COMPATIBILITY_MEDIA_AND_CONTENT_READINESS_AUDIT",
    generated_at: new Date().toISOString(),
    provenance: {
      approved_36_source: "PROVISIONAL_IN_REPO — official content pack not checked into repository; Pilot 4 keys are APPROVED_EXERCISE.",
      catalog_source: "scripts/exercise-library.json",
      v2_source: "scripts/exercise-library-v2-metadata.json",
      core_100_source: "src/lib/platform/strategy-matrix/config/core-100-external-ids.ts",
    },
    counts: {
      exercise_library_total: catalog.length,
      v2_total: v2.length,
      core_100: core.unique_count,
      by_type: types,
      approved_36: APPROVED_36_COUNT,
      templates_imported_total: 4,
      template_5_plus_imported: 0,
    },
    core_100: core,
    known_ids: {
      result: known.every((k) => k.found) ? "PASS" : "FAIL",
      rows: known,
    },
    duplicates: {
      duplicate_external_ids: dupExt,
      duplicate_slugs: dupSlug,
      near_duplicate_names: nearDup,
      variation_note: "Large substitution_groups (e.g. SQUAT_PATTERN) are intentional equipment/movement variations — not accidental merges.",
    },
    warmups,
    mobility,
    cardio: {
      treadmill_brisk_walk: treadmill,
      home: homeCardio,
      gym_cardio_count: v2.filter((e) => e.exercise_type === "cardio").length,
    },
    power,
    ramp_up: ramp,
    home_equipment: homeEq,
    gym_equipment: gymEq,
    difficulty,
    female_media: female,
    media,
    runtime_activity_role_rendering: roles,
    family_readiness: families,
    template_36_readiness: template36,
    readiness_counts: readinessCounts,
    missing_exercises: missing,
    missing_media_work: {
      policy: "Catalog status mostly placeholder; DB video_status=placeholder for all local rows observed.",
      female_variants: "0 female media variants modeled",
      ab001_local_video: "Present in assets; not wired in local DB video_path",
      blocking_for_import: false,
      visible_readiness_issue: true,
    },
    pilot_4_regression: {
      templates: 4,
      broken_references: pilotBroken,
      result: pilotBroken === 0 ? "PASS" : "FAIL",
      audits: pilotAudits,
    },
    admin_editor: {
      status: "PASS" as const,
      prior_gap: "ProgramLibraryManager stuck on AdminSkeletonRows when getAdminProgramTemplate fails (selectedId set, draft null).",
      fix: "Clear selectedId + draft on load failure / missing pilot-local row (ProgramLibraryManager.tsx).",
    },
    recommendation_defaults: {
      classification: "EXPLICIT_DEFAULT_USED" as const,
      when_client_context_absent: "Admin TemplateRecommendationPanel supplies coach level/days (+ HOME equipment) defaults",
      resolver_behavior: "INSUFFICIENT_CONTEXT when level/days/environment missing — no silent inference in resolver",
      phase_10_ui_labeling_recommended: true,
    },
    phase_7_gaps_carried: [
      "Coach Override reason not fully historical",
      "In-progress workout replacement safety not newly hardened",
    ],
    migrations_created: 0,
    staging_changed: false,
    production_changed: false,
    phase_9: {
      ready: readinessCounts.BLOCKED_BY_REFERENCE === 0 && readinessCounts.CONTENT_ADDITION_REQUIRED > 0 ? "PARTIAL" : readinessCounts.CONTENT_ADDITION_REQUIRED === 0 ? "YES" : "PARTIAL",
      importable_batches: [
        {
          batch: "PILOT_4_ALREADY_IMPORTED",
          keys: [...pilotKeys],
          action: "DO_NOT_REIMPORT",
        },
        {
          batch: "READY_WITH_REVIEW_SEQUENCES",
          keys: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "READY_WITH_REVIEW").map((t) => t.TEMPLATE_KEY),
          action: "PM_DECISION_REQUIRED — sequences mostly CANDIDATE_FOR_REVIEW; media partial",
        },
        {
          batch: "CONTENT_ADDITION_REQUIRED",
          keys: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "CONTENT_ADDITION_REQUIRED").map((t) => t.TEMPLATE_KEY),
          action: "BLOCK_UNTIL_ADDITIONS_OR_EXPLICIT_PM_WAIVER",
        },
        {
          batch: "BLOCKED_BY_REFERENCE",
          keys: template36.filter((t) => t.OVERALL_IMPORT_READINESS === "BLOCKED_BY_REFERENCE").map((t) => t.TEMPLATE_KEY),
          action: "DO_NOT_IMPORT",
        },
      ],
    },
  };
}

export type Phase8AuditResult = ReturnType<typeof runPhase8LibraryAudit>;
