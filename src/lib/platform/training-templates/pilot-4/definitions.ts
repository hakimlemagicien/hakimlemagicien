/**
 * Pilot 4 Program Template definitions — Phase 5 source of truth.
 * Exactly 4 templates. Exercise refs use real catalog external_ids (no invented IDs).
 */

import {
  createEmptyTemplateContract,
  type ProgramTemplateContractV1,
  type TemplateActivityRole,
} from "@/lib/platform/training-templates";
import type { PilotDaySpec, PilotExerciseSpec, PilotTemplateDefinition } from "./types";
import { TREADMILL_BRISK_WALK_EXTERNAL_ID } from "../phase9/library-additions";

function ex(
  external_id: string,
  activity_role: TemplateActivityRole,
  opts: Partial<PilotExerciseSpec> & {
    sets?: number;
    reps?: [number, number] | string;
    rest?: number;
  } = {},
): PilotExerciseSpec {
  const legacyRole =
    activity_role === "MAIN_RESISTANCE"
      ? "main"
      : activity_role === "POST_WORKOUT_CARDIO" || activity_role === "AEROBIC_ENDURANCE_BLOCK"
        ? "finisher"
        : activity_role === "EXERCISE_SPECIFIC_RAMP_UP" || activity_role === "POWER_SKILL_BLOCK"
          ? "accessory"
          : "warmup";

  let reps_min: number | null = null;
  let reps_max: number | null = null;
  let reps_label: string | null = null;
  if (typeof opts.reps === "string") {
    reps_label = opts.reps;
  } else if (Array.isArray(opts.reps)) {
    reps_min = opts.reps[0];
    reps_max = opts.reps[1];
    reps_label = `${opts.reps[0]}-${opts.reps[1]}`;
  } else if (activity_role === "MAIN_RESISTANCE" || activity_role === "EXERCISE_SPECIFIC_RAMP_UP") {
    reps_min = 8;
    reps_max = 10;
    reps_label = "8-10";
  }

  return {
    external_id,
    sets: opts.sets ?? (activity_role.includes("CARDIO") || activity_role.includes("WARM") ? 1 : 3),
    reps_min,
    reps_max,
    reps_label,
    rest_seconds: opts.rest ?? (activity_role === "MAIN_RESISTANCE" ? 90 : 30),
    role: opts.role ?? legacyRole,
    activity_role,
    notes_ar: opts.notes_ar ?? null,
    excluded_from_main_volume: opts.excluded_from_main_volume ?? activity_role !== "MAIN_RESISTANCE",
  };
}

function fillRestDays(workoutDays: PilotDaySpec[], total = 7): PilotDaySpec[] {
  const byNum = new Map(workoutDays.map((d) => [d.day_number, d]));
  const days: PilotDaySpec[] = [];
  for (let i = 1; i <= total; i++) {
    days.push(
      byNum.get(i) ?? {
        day_number: i,
        day_type: "rest",
        title_ar: "راحة",
        muscle_focus: null,
        estimated_minutes: null,
        exercises: [],
      },
    );
  }
  return days;
}

function baseContract(
  input: Parameters<typeof createEmptyTemplateContract>[0],
  patch: Partial<ProgramTemplateContractV1>,
): ProgramTemplateContractV1 {
  const contract = createEmptyTemplateContract(input);
  return {
    ...contract,
    ...patch,
    variant: patch.variant ?? contract.variant,
    eligibility: { ...contract.eligibility, ...patch.eligibility },
    progression: patch.progression ?? contract.progression,
    media_preference: patch.media_preference ?? contract.media_preference,
    library_readiness: patch.library_readiness ?? {
      state: "READY",
      missing_exercise_count: 0,
      missing_media_count: 0,
      notes: "Pilot 4 — validated against exercise catalog external_ids",
    },
    activity_roles: patch.activity_roles ?? contract.activity_roles,
    review_signals: patch.review_signals ?? contract.review_signals,
    transition_policies: patch.transition_policies ?? contract.transition_policies,
    admin_summary: patch.admin_summary ?? contract.admin_summary,
    provenance: patch.provenance ?? { created_from: "PHASE_5_PILOT_4", reference_version: "1" },
  };
}

const fatLossDay = (day_number: number, title_ar: string, mains: string[]): PilotDaySpec => ({
  day_number,
  day_type: "workout",
  title_ar,
  muscle_focus: "full_body",
  estimated_minutes: 70,
  exercises: [
    ex(TREADMILL_BRISK_WALK_EXTERNAL_ID, "GENERAL_WARM_UP", {
      reps: "10 min",
      sets: 1,
      rest: 0,
      notes_ar: "مشي سريع على الجهاز — إحماء",
    }),
    ex("WU-001", "TARGETED_DYNAMIC_WARM_UP", { reps: "45 sec", sets: 1 }),
    ex("WU-003", "TARGETED_DYNAMIC_WARM_UP", { reps: "45 sec", sets: 1 }),
    ...mains.map((id) => ex(id, "MAIN_RESISTANCE", { reps: [10, 12], sets: 3, rest: 75 })),
    ex(TREADMILL_BRISK_WALK_EXTERNAL_ID, "POST_WORKOUT_CARDIO", {
      reps: "15 min",
      sets: 1,
      rest: 0,
      notes_ar: "مشي سريع بعد المقاومة — كارديو تحت سيطرة المدرب",
    }),
  ],
});

const muscleHomeDay = (day_number: number, title_ar: string, focus: string, mains: string[]): PilotDaySpec => ({
  day_number,
  day_type: "workout",
  title_ar,
  muscle_focus: focus,
  estimated_minutes: 50,
  exercises: [
    ex("WU-001", "GENERAL_WARM_UP", { reps: "40 sec", sets: 1 }),
    ex("WU-002", "TARGETED_DYNAMIC_WARM_UP", { reps: "40 sec", sets: 1 }),
    ex("CH-004", "TARGETED_DYNAMIC_WARM_UP", { reps: [8, 10], sets: 1, rest: 20, notes_ar: "تفعيل خفيف" }),
    ...mains.map((id) => ex(id, "MAIN_RESISTANCE", { reps: [8, 12], sets: 3, rest: 90 })),
  ],
});

function strengthDay(
  day_number: number,
  title_ar: string,
  focus: string,
  primary: string,
  mains: string[],
): PilotDaySpec {
  return {
    day_number,
    day_type: "workout",
    title_ar,
    muscle_focus: focus,
    estimated_minutes: 65,
    exercises: [
      ex("WU-001", "GENERAL_WARM_UP", { reps: "40 sec", sets: 1 }),
      ex("WU-002", "TARGETED_DYNAMIC_WARM_UP", { reps: "40 sec", sets: 1 }),
      ex("WU-003", "TARGETED_DYNAMIC_WARM_UP", { reps: "40 sec", sets: 1 }),
      ex(primary, "EXERCISE_SPECIFIC_RAMP_UP", {
        sets: 2,
        reps: [5, 5],
        rest: 90,
        notes_ar: "مجموعات تهيئة — لا تُحسب ضمن حجم العمل الرئيسي ولا ضمن Smart Progression",
        excluded_from_main_volume: true,
      }),
      ...mains.map((id, index) =>
        ex(id, "MAIN_RESISTANCE", {
          reps: index === 0 ? [4, 6] : [6, 8],
          sets: 4,
          rest: index === 0 ? 210 : 150,
          notes_ar: index === 0 ? "راحة ممتدة للحفاظ على الأداء — بلا سقف 180ث إلزامي" : null,
        }),
      ),
    ],
  };
}

function athleticDay(
  day_number: number,
  title_ar: string,
  power: PilotExerciseSpec,
  mains: string[],
): PilotDaySpec {
  return {
    day_number,
    day_type: "workout",
    title_ar,
    muscle_focus: "athletic",
    estimated_minutes: 55,
    exercises: [
      ex("WU-001", "GENERAL_WARM_UP", { reps: "40 sec", sets: 1 }),
      ex("WU-002", "TARGETED_DYNAMIC_WARM_UP", { reps: "40 sec", sets: 1 }),
      ex("WU-003", "TARGETED_DYNAMIC_WARM_UP", { reps: "40 sec", sets: 1 }),
      power,
      ...mains.map((id) => ex(id, "MAIN_RESISTANCE", { reps: [8, 10], sets: 3, rest: 90 })),
    ],
  };
}

export const PILOT_4_DEFINITIONS: PilotTemplateDefinition[] = [
  {
    key: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    slug: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_3D",
    name_ar: "أساس خسارة الدهون — مبتدئ صالة 3 أيام",
    name_en: "Fat Loss Foundation Beginner GYM 3D",
    description_ar:
      "مقاومة كاملة الجسم مع كارديو مبرمج على الجهاز. الكارديو تحت سيطرة المدرب. لا استنتاج بطء أيض.",
    version: 2,
    status: "PUBLISHED",
    legacy_goal: "cut",
    level: "beginner",
    days_per_week: 3,
    duration_weeks: 8,
    training_location: "GYM",
    equipment: "treadmill, dumbbells, machines, barbell",
    contract: baseContract(
      {
        primaryStrategy: "FAT_LOSS",
        level: "BEGINNER",
        environment: "GYM",
        daysPerWeek: 3,
        durationWeeks: 8,
        targetAudience:
          "Beginner client training in a gym whose primary goal is fat loss and who needs a sustainable full-body resistance + programmed cardio foundation.",
        templatePurpose:
          "Preserve/build resistance training capacity while supporting fat-loss goals with repeatable full-body training and structured treadmill brisk walk (CR-026), not run.",
      },
      {
        admin_summary: "Fat Loss / Beginner / GYM / 3 Days",
        eligibility: {
          rules: ["GYM_ACCESS_REQUIRED"],
          review_conditions: ["FAT_LOSS_PROGRESS_REVIEW_REQUIRED"],
          equipment_requirements: ["treadmill", "dumbbells_or_machines"],
          environment_requirements: ["GYM"],
          capability_requirements: [],
          unknown_required_capability_policy: "REVIEW_REQUIRED",
        },
        activity_roles: [
          { role: "GENERAL_WARM_UP", prescription_model: "DURATION", required: true, notes: "10 min treadmill brisk walk CR-026" },
          { role: "TARGETED_DYNAMIC_WARM_UP", prescription_model: "DURATION", required: true },
          { role: "MAIN_RESISTANCE", prescription_model: "SETS_REPS_LOAD", required: true },
          {
            role: "POST_WORKOUT_CARDIO",
            prescription_model: "DURATION",
            required: true,
            notes: "15 min treadmill brisk walk CR-026; coach-controlled; weekly programmed 75 min",
          },
        ],
        progression: {
          compatible_strategies: ["SMART_PROGRESSION_EXERCISE_LOCKED"],
          smart_auto_variables: ["WEIGHT", "REPS"],
          coach_controlled_variables: [
            "SETS",
            "REST",
            "EXERCISE_IDENTITY",
            "EXERCISE_REPLACEMENT",
            "TRAINING_DAYS",
            "CARDIO_STRUCTURE",
            "CARDIO_DURATION",
            "CARDIO_INTENSITY",
            "CARDIO_MODALITY",
          ],
        },
        review_signals: [],
        transition_policies: [
          {
            from_label: "BEGINNER_GYM_3D",
            to_label: "INTERMEDIATE_GYM_4D",
            advisory: true,
            notes: "Coach decides when to advance days/level — no silent day change. Poor fat-loss progress → FAT_LOSS_PROGRESS_REVIEW_REQUIRED.",
          },
        ],
        provenance: { created_from: "PHASE_5_PILOT_4", reference_version: "2" },
      },
    ),
    week: {
      title_ar: "أسبوع أساس خسارة الدهون",
      days: fillRestDays([
        fatLossDay(1, "جسم كامل أ", ["LE-003", "CH-012", "BA-001", "SH-001", "GL-001", "BI-001"]),
        fatLossDay(3, "جسم كامل ب", ["LE-007", "CH-003", "BA-010", "SH-005", "GL-002", "TR-001"]),
        fatLossDay(5, "جسم كامل ج", ["LE-001", "CH-001", "BA-006", "SH-002", "GL-017", "AB-001"]),
      ]),
    },
  },
  {
    key: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
    slug: "MUSCLE_GAIN_FOUNDATION_BEGINNER_HOME_3D",
    name_ar: "أساس بناء العضلات — مبتدئ منزل 3 أيام",
    name_en: "Muscle Gain Foundation Beginner HOME 3D",
    description_ar: "تأسيس تضخيم منزلي بدون كارديو إلزامي وبدون فشل إلزامي.",
    version: 1,
    status: "PUBLISHED",
    legacy_goal: "bulk",
    level: "beginner",
    days_per_week: 3,
    duration_weeks: 8,
    training_location: "HOME",
    equipment: "dumbbells, bands, stable_bench_or_chair",
    contract: baseContract(
      {
        primaryStrategy: "MUSCLE_GAIN",
        level: "BEGINNER",
        environment: "HOME",
        daysPerWeek: 3,
        durationWeeks: 8,
        targetAudience:
          "Beginner client training at home with appropriate dumbbells/bands and basic safe training space whose primary goal is muscle gain.",
        templatePurpose:
          "Build a sustainable hypertrophy foundation using home-compatible resistance movements and progressive overload.",
      },
      {
        admin_summary: "Muscle Gain / Beginner / HOME / 3 Days",
        eligibility: {
          rules: ["HOME_SAFE_SPACE_REQUIRED"],
          review_conditions: ["HOME_LOAD_LIMIT_REVIEW_REQUIRED", "EQUIPMENT_LIMIT_REVIEW_REQUIRED"],
          equipment_requirements: ["dumbbells", "bands"],
          environment_requirements: ["HOME"],
          capability_requirements: [
            { key: "training_space", required: true },
            { key: "available_load", required: true },
            { key: "stable_bench_or_chair", required: true },
            { key: "safe_band_anchor", required: false },
          ],
          unknown_required_capability_policy: "REVIEW_REQUIRED",
        },
        activity_roles: [
          { role: "GENERAL_WARM_UP", prescription_model: "DURATION", required: true },
          { role: "TARGETED_DYNAMIC_WARM_UP", prescription_model: "DURATION", required: true },
          { role: "MAIN_RESISTANCE", prescription_model: "SETS_REPS_LOAD", required: true },
        ],
        progression: {
          compatible_strategies: ["SMART_PROGRESSION_EXERCISE_LOCKED"],
          smart_auto_variables: ["WEIGHT", "REPS"],
          coach_controlled_variables: [
            "SETS",
            "REST",
            "EXERCISE_IDENTITY",
            "EXERCISE_REPLACEMENT",
            "TRAINING_DAYS",
            "BAND_RESISTANCE",
            "CARRY_DISTANCE",
            "ROM",
          ],
        },
        review_signals: ["HOME_LOAD_LIMIT_REVIEW_REQUIRED"],
        transition_policies: [
          {
            from_label: "BEGINNER_HOME_3D",
            to_label: "INTERMEDIATE_HOME_4D",
            advisory: true,
          },
        ],
      },
    ),
    week: {
      title_ar: "أسبوع أساس بناء العضلات منزلي",
      days: fillRestDays([
        muscleHomeDay(1, "علوي منزلي", "upper", ["CH-007", "BA-013", "SH-002", "BI-002", "TR-001", "AB-006"]),
        muscleHomeDay(3, "سفلي منزلي", "lower", ["LE-003", "LE-008", "GL-002", "LE-007", "CA-001", "AB-001"]),
        muscleHomeDay(5, "كامل منزلي", "full_body", ["CH-004", "BA-006", "LE-003", "SH-005", "GL-001", "BI-002"]),
      ]),
    },
  },
  {
    key: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D",
    slug: "STRENGTH_PROGRESS_INTERMEDIATE_GYM_4D",
    name_ar: "تقدّم القوة — متوسط صالة 4 أيام",
    name_en: "Strength Progress Intermediate GYM 4D",
    description_ar: "Upper/Lower × 2 مع مجموعات تهيئة للحركات الثقيلة. بلا كارديو إلزامي وبلا اختبار فشل.",
    version: 1,
    status: "PUBLISHED",
    legacy_goal: "bulk",
    level: "intermediate",
    days_per_week: 4,
    duration_weeks: 10,
    training_location: "GYM",
    equipment: "barbell, racks, dumbbells, machines",
    contract: baseContract(
      {
        primaryStrategy: "STRENGTH",
        level: "INTERMEDIATE",
        environment: "GYM",
        daysPerWeek: 4,
        durationWeeks: 10,
        targetAudience:
          "Intermediate gym client with established resistance-training experience whose primary goal is improved strength through structured Upper/Lower training.",
        templatePurpose:
          "Develop strength in primary movement patterns while maintaining supporting volume and preserving technical quality.",
      },
      {
        admin_summary: "Strength / Intermediate / GYM / 4 Days",
        eligibility: {
          rules: ["INTERMEDIATE_EXPERIENCE_REQUIRED", "GYM_ACCESS_REQUIRED"],
          review_conditions: ["MOVEMENT_QUALITY_REVIEW_RECOMMENDED"],
          equipment_requirements: ["barbell", "squat_rack_or_smith", "bench"],
          environment_requirements: ["GYM"],
          capability_requirements: [],
          unknown_required_capability_policy: "REVIEW_REQUIRED",
        },
        activity_roles: [
          { role: "GENERAL_WARM_UP", prescription_model: "DURATION", required: true },
          { role: "TARGETED_DYNAMIC_WARM_UP", prescription_model: "DURATION", required: true },
          {
            role: "EXERCISE_SPECIFIC_RAMP_UP",
            prescription_model: "SETS_REPS_LOAD",
            required: false,
            notes: "Does not count as main working volume; not Smart Progression working sets",
          },
          { role: "MAIN_RESISTANCE", prescription_model: "SETS_REPS_LOAD", required: true },
        ],
        progression: {
          compatible_strategies: ["SMART_PROGRESSION_EXERCISE_LOCKED", "COACH_MANAGED"],
          smart_auto_variables: ["WEIGHT", "REPS"],
          coach_controlled_variables: [
            "SETS",
            "REST",
            "EXERCISE_IDENTITY",
            "EXERCISE_REPLACEMENT",
            "TRAINING_DAYS",
            "ROM",
            "MOVEMENT_COMPLEXITY",
          ],
        },
        review_signals: ["MOVEMENT_QUALITY_REVIEW_RECOMMENDED", "PROGRAM_LEVEL_REVIEW_RECOMMENDED"],
        transition_policies: [
          {
            from_label: "INTERMEDIATE_GYM_4D",
            to_label: "ADVANCED_GYM_4D_OR_5D",
            advisory: true,
          },
        ],
      },
    ),
    week: {
      title_ar: "أسبوع قوة Upper/Lower",
      days: fillRestDays([
        strengthDay(1, "علوي أ", "upper", "CH-001", ["CH-001", "BA-001", "SH-001", "BA-010", "BI-001", "TR-001"]),
        strengthDay(2, "سفلي أ", "lower", "LE-001", ["LE-001", "LE-004", "GL-001", "LE-009", "CA-001", "AB-006"]),
        strengthDay(4, "علوي ب", "upper", "CH-012", ["CH-012", "BA-006", "SH-002", "BA-013", "BI-002", "TR-003"]),
        strengthDay(5, "سفلي ب", "lower", "LE-003", ["LE-003", "LE-007", "GL-002", "LE-008", "CA-001", "AB-001"]),
      ]),
    },
  },
  {
    key: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
    slug: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_HOME_3D",
    name_ar: "أساس الأداء الرياضي — مبتدئ منزل 3 أيام",
    name_en: "Athletic Performance Foundation Beginner HOME 3D",
    description_ar:
      "أساس رياضي منزلي: إحماء + كتلة مهارة قوة منخفضة التعقيد + مقاومة. بلا سباقات/أولمبي/HIIT إلزامي.",
    version: 1,
    status: "PUBLISHED",
    legacy_goal: "fitness",
    level: "beginner",
    days_per_week: 3,
    duration_weeks: 8,
    training_location: "HOME",
    equipment: "dumbbells, bands, open_floor_space",
    contract: baseContract(
      {
        primaryStrategy: "ATHLETIC_PERFORMANCE",
        level: "BEGINNER",
        environment: "HOME",
        daysPerWeek: 3,
        durationWeeks: 8,
        targetAudience:
          "Beginner home-training client seeking general athletic capability, movement quality, basic power development and foundational strength without sport-specific programming.",
        templatePurpose:
          "Build a safe athletic foundation using strength, carries, trunk control and readiness-appropriate low-complexity power work.",
      },
      {
        admin_summary: "Athletic Performance / Beginner / HOME / 3 Days",
        eligibility: {
          rules: ["HOME_SAFE_SPACE_REQUIRED", "POWER_READINESS_GATE"],
          review_conditions: ["MOVEMENT_QUALITY_REVIEW_RECOMMENDED", "HOME_LOAD_LIMIT_REVIEW_REQUIRED"],
          equipment_requirements: ["dumbbells", "bands"],
          environment_requirements: ["HOME"],
          capability_requirements: [
            { key: "training_space", required: true },
            { key: "safe_band_anchor", required: false },
            { key: "stable_elevated_surface", required: false },
          ],
          unknown_required_capability_policy: "REVIEW_REQUIRED",
        },
        activity_roles: [
          { role: "GENERAL_WARM_UP", prescription_model: "DURATION", required: true },
          { role: "TARGETED_DYNAMIC_WARM_UP", prescription_model: "DURATION", required: true },
          {
            role: "POWER_SKILL_BLOCK",
            prescription_model: "QUALITY_REPS",
            required: true,
            notes: "Coach-controlled; not counted in main 6; readiness gated",
          },
          { role: "MAIN_RESISTANCE", prescription_model: "SETS_REPS_LOAD", required: true },
        ],
        progression: {
          compatible_strategies: ["SMART_PROGRESSION_EXERCISE_LOCKED", "COACH_MANAGED"],
          smart_auto_variables: ["WEIGHT", "REPS"],
          coach_controlled_variables: [
            "SETS",
            "REST",
            "EXERCISE_IDENTITY",
            "EXERCISE_REPLACEMENT",
            "TRAINING_DAYS",
            "POWER_PROGRESSION",
            "MOVEMENT_COMPLEXITY",
            "BAND_RESISTANCE",
            "CARRY_DISTANCE",
          ],
        },
        review_signals: ["MOVEMENT_QUALITY_REVIEW_RECOMMENDED"],
        transition_policies: [
          {
            from_label: "BEGINNER_HOME_3D",
            to_label: "INTERMEDIATE_HOME_OR_GYM",
            advisory: true,
            notes: "Power progression remains coach-controlled.",
          },
        ],
      },
    ),
    week: {
      title_ar: "أسبوع أساس رياضي منزلي",
      days: fillRestDays([
        athleticDay(
          1,
          "رياضي أ — دفع",
          ex("CH-004", "POWER_SKILL_BLOCK", {
            sets: 3,
            reps: [5, 5],
            rest: 60,
            notes_ar: "ضغط انفجاري منخفض التعقيد — بديل آمن عن تمريرة صدر بالباند إن لم تُعتمد",
            excluded_from_main_volume: true,
          }),
          ["CH-007", "BA-013", "SH-002", "FO-003", "AB-006", "BI-002"],
        ),
        athleticDay(
          3,
          "رياضي ب — نهوض",
          ex("LE-003", "POWER_SKILL_BLOCK", {
            sets: 3,
            reps: [5, 6],
            rest: 60,
            notes_ar: "سكوات كأس سريع مضبوط / نهوض سريع منخفض الأثر",
            excluded_from_main_volume: true,
          }),
          ["LE-008", "GL-002", "BA-006", "SH-005", "AB-001", "CA-001"],
        ),
        athleticDay(
          5,
          "رياضي ج — هبوط بديل",
          ex("LE-007", "POWER_SKILL_BLOCK", {
            sets: 3,
            reps: [6, 6],
            rest: 60,
            notes_ar:
              "بديل منخفض الأثر — قفز+هبوط فقط إذا JUMP_READINESS=APPROVED وإلا يبقى هذا البديل",
            excluded_from_main_volume: true,
          }),
          ["LE-003", "GL-017", "CH-004", "BA-013", "FO-003", "AB-008"],
        ),
      ]),
    },
  },
];

export function getPilotDefinition(key: string): PilotTemplateDefinition | undefined {
  return PILOT_4_DEFINITIONS.find((item) => item.key === key || item.slug === key);
}
