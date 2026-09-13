/**
 * Phase 9 — Exercise Sequence Pack for remaining canonical templates (33 of 37).
 * Matches Locked Product Master exactly. No DB writes.
 */
import { fillWeek, existingSlot, additionSlot, type TemplateSequencePack } from "./sequence-types";
import {
  gymBriskCardioSession,
  gymExistingCardioSession,
  homePostWalkSession,
  mains,
  power,
  ramp,
  session,
  wu3,
} from "./session-builders";

function baseMeta(
  partial: Omit<TemplateSequencePack, "sessions" | "qa_flags" | "authoring_notes_ar" | "block_reason_ar"> & {
    block_reason_ar?: string | null;
    qa_flags?: string[];
    authoring_notes_ar?: string[];
    sessions: TemplateSequencePack["sessions"];
  },
): TemplateSequencePack {
  return {
    block_reason_ar: partial.block_reason_ar ?? null,
    qa_flags: partial.qa_flags ?? [],
    authoring_notes_ar: partial.authoring_notes_ar ?? [],
    preferred_demonstrator: partial.preferred_demonstrator ?? null,
    preferred_media_variant: partial.preferred_media_variant ?? null,
    ...partial,
  };
}

/** Remaining canonical sequences (Pilot 4 excluded). Alias kept for callers. */
export function buildRemaining32SequencePack(): TemplateSequencePack[] {
  return buildRemainingCanonicalSequencePack();
}

export function buildRemainingCanonicalSequencePack(): TemplateSequencePack[] {
  const packs: TemplateSequencePack[] = [];

  // ─── FAT LOSS BEG GYM 4D (02) ───
  packs.push(
    baseMeta({
      template_key: "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D",
      primary_strategy: "FAT_LOSS",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "مبتدئ صالة لخسارة الدهون بتردد 4 أيام.",
      template_purpose_ar: "تأسيس مقاومة Upper/Lower + مشي سريع على الجهاز قبل وبعد الجلسة.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      authoring_notes_ar: [
        "قالب مستقل عن Pilot GYM 3D — لا يستبدل Intermediate HOME.",
        "كارديو عبر ADD_TREADMILL_BRISK_WALK — ممنوع استخدام CR-001 كبديل.",
      ],
      sessions: fillWeek([
        gymBriskCardioSession(1, "UPPER_A", "علوي أ", "Upper A", "دفع/سحب تأسيسي", "upper", 65, ["WU-001", "WU-010"], ["CH-012", "BA-006", "SH-002", "BA-016", "BI-002", "TR-001"], "8 min", "12 min", { reps: [10, 12], sets: 3, rest: 75 }),
        gymBriskCardioSession(2, "LOWER_A", "سفلي أ", "Lower A", "أرجل/ألوية", "lower", 65, ["WU-002", "WU-003"], ["LE-003", "BA-023", "LE-004", "GL-002", "LE-009", "AB-011"], "8 min", "12 min", { reps: [10, 12], sets: 3, rest: 75 }),
        gymBriskCardioSession(4, "UPPER_B", "علوي ب", "Upper B", "تنويع علوي", "upper", 65, ["WU-013", "WU-021"], ["CH-003", "BA-010", "SH-005", "BA-017", "BI-001", "TR-002"], "8 min", "12 min", { reps: [10, 12], sets: 3, rest: 75 }),
        gymBriskCardioSession(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع سفلي", "lower", 65, ["WU-002", "WU-020"], ["LE-007", "LE-005", "GL-001", "LE-010", "GL-007", "AB-001"], "8 min", "12 min", { reps: [10, 12], sets: 3, rest: 75 }),
      ]),
    }),
  );

  // ─── FAT LOSS HOME 3D (04) ───
  packs.push(
    baseMeta({
      template_key: "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "FAT_LOSS",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Full Body A/B/C",
      target_audience_ar: "مبتدئ منزلي هدفه خسارة الدهون مع مقاومة آمنة وكارديو منخفض الأثر.",
      template_purpose_ar: "تأسيس مقاومة كاملة الجسم + مشي سريع منزلي دون جهاز مشي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      authoring_notes_ar: [
        "كارديو منزلي عبر ADD_HOME_BRISK_WALK — لا إجبار على جهاز مشي.",
        "تمارين Core 100 / مكتبة منزلية متوافقة.",
      ],
      sessions: fillWeek([
        homePostWalkSession(1, "FB_A", "جسم كامل أ", "Full Body A", "مقاومة شاملة + مشي", "full_body", 60, ["WU-023", "WU-001", "WU-003"], ["LE-003", "CH-004", "BA-013", "SH-002", "GL-002", "BI-002"], "15 min", { reps: [10, 12], rest: 75 }, true, "8 min"),
        homePostWalkSession(3, "FB_B", "جسم كامل ب", "Full Body B", "تنويع أنماط الحركة", "full_body", 60, ["WU-023", "WU-002", "WU-017"], ["LE-008", "CH-007", "BA-014", "SH-005", "GL-008", "TR-003"], "15 min", { reps: [10, 12], rest: 75 }, true, "8 min"),
        homePostWalkSession(5, "FB_C", "جسم كامل ج", "Full Body C", "تغطية عضلية متوازنة", "full_body", 60, ["WU-015", "WU-001", "WU-020"], ["LE-007", "CH-013", "BA-021", "SH-007", "GL-004", "AB-006"], "15 min", { reps: [10, 12], rest: 75 }, false),
      ]),
    }),
  );

  // ─── FAT LOSS INT GYM 4D ───
  packs.push(
    baseMeta({
      template_key: "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "FAT_LOSS",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "متوسط صالة يهدف لخسارة الدهون مع حجم مقاومة أعلى.",
      template_purpose_ar: "تقدّم مقاومة Upper/Lower مع مشي سريع 10+15 كل جلسة.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        gymBriskCardioSession(1, "UPPER_A", "علوي أ", "Upper A", "دفع/سحب علوي", "upper", 75, ["WU-001", "WU-010"], ["CH-001", "BA-006", "SH-001", "BA-016", "BI-001", "TR-001"], "10 min", "15 min", { reps: [8, 10], sets: 3, rest: 90 }),
        gymBriskCardioSession(2, "LOWER_A", "سفلي أ", "Lower A", "رباعية/خلفية/ألوية", "lower", 75, ["WU-002", "WU-003"], ["LE-001", "BA-023", "LE-004", "GL-001", "LE-009", "AB-011"], "10 min", "15 min", { reps: [8, 10], sets: 3, rest: 90 }),
        gymBriskCardioSession(4, "UPPER_B", "علوي ب", "Upper B", "تنويع زوايا", "upper", 75, ["WU-013", "WU-021"], ["CH-002", "BA-010", "SH-005", "BA-017", "BI-002", "TR-002"], "10 min", "15 min", { reps: [8, 10], sets: 3, rest: 90 }),
        gymBriskCardioSession(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع أنماط", "lower", 75, ["WU-002", "WU-020"], ["LE-005", "LE-007", "GL-003", "LE-010", "GL-007", "AB-001"], "10 min", "15 min", { reps: [8, 12], sets: 3, rest: 90 }),
      ]),
    }),
  );

  // FAT_LOSS_PROGRESS_INTERMEDIATE_HOME_4D removed — not in Locked Product Master

  // ─── MUSCLE GAIN BEG GYM 3D ───
  packs.push(
    baseMeta({
      template_key: "MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "MUSCLE_GAIN",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Full Body A/B/C",
      target_audience_ar: "مبتدئ صالة لبناء العضلات.",
      template_purpose_ar: "تأسيس تضخيم بجسم كامل دون كارديو إلزامي ودون فشل إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "FB_A", "جسم كامل أ", "Full Body A", "مركّبات أساسية", "full_body", 55, [...wu3("WU-001", "WU-002", "WU-003"), ...mains(["LE-003", "CH-012", "BA-006", "SH-002", "GL-001", "BI-002"], { reps: [8, 12], rest: 90 })]),
        session(3, "FB_B", "جسم كامل ب", "Full Body B", "تنويع أنماط", "full_body", 55, [...wu3("WU-013", "WU-010", "WU-017"), ...mains(["LE-004", "CH-003", "BA-016", "SH-005", "GL-002", "TR-001"], { reps: [8, 12], rest: 90 })]),
        session(5, "FB_C", "جسم كامل ج", "Full Body C", "توازن عضلي", "full_body", 55, [...wu3("WU-001", "WU-002", "WU-020"), ...mains(["LE-007", "CH-007", "BA-010", "SH-007", "AB-011", "BI-001"], { reps: [8, 12], rest: 90 })]),
      ]),
    }),
  );

  // ─── MUSCLE GAIN INT HOME 4D ───
  packs.push(
    baseMeta({
      template_key: "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "MUSCLE_GAIN",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "متوسط منزلي لبناء العضلات.",
      template_purpose_ar: "حجم تضخيم منزلي أعلى بدون كارديو إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "UPPER_A", "علوي أ", "Upper A", "دفع/سحب", "upper", 55, [...wu3("WU-001", "WU-010", "WU-021"), ...mains(["CH-007", "BA-013", "SH-019", "BA-014", "BI-003", "TR-003"], { reps: [8, 12], sets: 3, rest: 90 })]),
        session(2, "LOWER_A", "سفلي أ", "Lower A", "أرجل/ألوية", "lower", 55, [...wu3("WU-002", "WU-003", "WU-017"), ...mains(["LE-003", "GL-002", "LE-008", "GL-008", "LE-013", "AB-006"], { reps: [8, 12], sets: 3, rest: 90 })]),
        session(4, "UPPER_B", "علوي ب", "Upper B", "تنويع علوي", "upper", 55, [...wu3("WU-013", "WU-001", "WU-019"), ...mains(["CH-004", "BA-021", "SH-005", "SH-007", "BI-002", "TR-006"], { reps: [8, 12], sets: 3, rest: 90 })]),
        session(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع سفلي", "lower", 55, [...wu3("WU-002", "WU-020", "WU-022"), ...mains(["LE-007", "GL-004", "LE-016", "GL-017", "GL-009", "AB-011"], { reps: [8, 12], sets: 3, rest: 90 })]),
      ]),
    }),
  );

  // ─── 06A MUSCLE GAIN UPPER/LOWER INT GYM 4D ───
  packs.push(
    baseMeta({
      template_key: "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D",
      primary_strategy: "MUSCLE_GAIN",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "متوسط صالة لتضخيم بنمط Upper/Lower (06A).",
      template_purpose_ar: "قالب مستقل عن 06B — حجم تضخيم 4 أيام بلا كارديو إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      authoring_notes_ar: ["هوية تاريخية 06A — لا تُدمج مع Advanced Split 06B."],
      sessions: fillWeek([
        session(1, "UPPER_A", "علوي أ", "Upper A", "دفع/سحب", "upper", 60, [...wu3("WU-001", "WU-010", "WU-021"), ...mains(["CH-001", "BA-006", "SH-001", "BA-016", "BI-001", "TR-001"], { reps: [8, 10], sets: 3, rest: 90 })]),
        session(2, "LOWER_A", "سفلي أ", "Lower A", "أرجل/ألوية", "lower", 60, [...wu3("WU-002", "WU-003", "WU-017"), ...mains(["LE-001", "BA-022", "LE-004", "GL-001", "LE-009", "AB-001"], { reps: [8, 10], sets: 3, rest: 120 })]),
        session(4, "UPPER_B", "علوي ب", "Upper B", "تنويع علوي", "upper", 60, [...wu3("WU-013", "WU-010", "WU-019"), ...mains(["CH-002", "BA-010", "SH-005", "BA-017", "BI-002", "TR-002"], { reps: [8, 12], sets: 3, rest: 90 })]),
        session(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع سفلي", "lower", 60, [...wu3("WU-002", "WU-020", "WU-003"), ...mains(["LE-005", "LE-007", "GL-003", "LE-010", "GL-007", "AB-011"], { reps: [8, 12], sets: 3, rest: 90 })]),
      ]),
    }),
  );

  // ─── 06B MUSCLE GAIN ADVANCED SPLIT INT GYM 5D ───
  packs.push(
    baseMeta({
      template_key: "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D",
      primary_strategy: "MUSCLE_GAIN",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 5,
      weekly_split: "Push / Pull / Legs / Upper / Lower",
      target_audience_ar: "متوسط صالة لتقسيم متقدم 5 أيام (06B).",
      template_purpose_ar: "قالب مستقل عن 06A — تغطية عضلية أوسع بلا كارديو إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      authoring_notes_ar: ["هوية تاريخية 06B — Advanced Split — لا تُختزل إلى مفتاح Progress عام."],
      sessions: fillWeek([
        session(1, "PUSH", "دفع", "Push", "صدر/كتف/تراي", "push", 60, [...wu3("WU-001", "WU-013", "WU-021"), ...mains(["CH-001", "CH-002", "SH-001", "SH-005", "TR-001", "TR-005"], { reps: [8, 10], sets: 3, rest: 90 })]),
        session(2, "PULL", "سحب", "Pull", "ظهر/باي", "pull", 60, [...wu3("WU-010", "WU-001", "WU-019"), ...mains(["BA-006", "BA-010", "BA-016", "BA-023", "BI-001", "BI-006"], { reps: [8, 10], sets: 3, rest: 90 })]),
        session(3, "LEGS", "أرجل", "Legs", "سفلي مركّب", "legs", 60, [...wu3("WU-002", "WU-003", "WU-017"), ...mains(["LE-001", "BA-022", "LE-004", "GL-001", "LE-009", "LE-010"], { reps: [8, 10], sets: 3, rest: 120 })]),
        session(4, "UPPER", "علوي", "Upper", "علوي مكمّل", "upper", 55, [...wu3("WU-013", "WU-010", "WU-021"), ...mains(["CH-012", "BA-017", "SH-010", "BA-018", "BI-002", "TR-002"], { reps: [8, 12], sets: 3, rest: 90 })]),
        session(5, "LOWER", "سفلي", "Lower", "سفلي مكمّل", "lower", 55, [...wu3("WU-002", "WU-020", "WU-003"), ...mains(["LE-005", "LE-007", "GL-003", "GL-007", "LE-028", "AB-001"], { reps: [8, 12], sets: 3, rest: 90 })]),
      ]),
    }),
  );

  // ─── BODY RECOMP ───
  packs.push(
    baseMeta({
      template_key: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "BODY_RECOMPOSITION",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Full Body A/B/C",
      target_audience_ar: "مبتدئ صالة لإعادة التركيب (مقاومة + كارديو معتمد).",
      template_purpose_ar: "مقاومة كاملة + 10 دقائق كارديو بعد كل جلسة (30 د/أسبوع).",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      authoring_notes_ar: ["كارديو بعدي عبر دراجة ثابتة CR-002 — موجود ومعتمد."],
      sessions: fillWeek([
        gymExistingCardioSession(1, "FB_A", "جسم كامل أ", "Full Body A", "مقاومة + كارديو معتدل", "full_body", 60, ["WU-015", "WU-001", "WU-003"], ["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "BI-002"], "CR-002", "10 min"),
        gymExistingCardioSession(3, "FB_B", "جسم كامل ب", "Full Body B", "تنويع", "full_body", 60, ["WU-001", "WU-002", "WU-017"], ["LE-004", "CH-003", "BA-016", "SH-005", "GL-001", "TR-001"], "CR-002", "10 min"),
        gymExistingCardioSession(5, "FB_C", "جسم كامل ج", "Full Body C", "توازن", "full_body", 60, ["WU-013", "WU-010", "WU-020"], ["LE-007", "CH-007", "BA-010", "SH-007", "AB-011", "BI-001"], "CR-001", "10 min", "POST_WORKOUT_CARDIO", { reps: [8, 12], rest: 75 }),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "BODY_RECOMPOSITION",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Full Body A/B/C",
      target_audience_ar: "مبتدئ منزلي لإعادة التركيب.",
      template_purpose_ar: "مقاومة منزلية + مشي سريع 10 د بعد كل جلسة.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        homePostWalkSession(1, "FB_A", "جسم كامل أ", "Full Body A", "مقاومة + مشي", "full_body", 55, ["WU-023", "WU-001", "WU-003"], ["LE-003", "CH-004", "BA-013", "SH-002", "GL-002", "BI-002"], "10 min"),
        homePostWalkSession(3, "FB_B", "جسم كامل ب", "Full Body B", "تنويع", "full_body", 55, ["WU-001", "WU-002", "WU-017"], ["LE-008", "CH-007", "BA-014", "SH-005", "GL-008", "TR-003"], "10 min"),
        homePostWalkSession(5, "FB_C", "جسم كامل ج", "Full Body C", "توازن", "full_body", 55, ["WU-013", "WU-010", "WU-020"], ["LE-007", "CH-013", "BA-021", "SH-007", "AB-006", "BI-003"], "10 min"),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "BODY_RECOMPOSITION",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "متوسط صالة لإعادة التركيب.",
      template_purpose_ar: "Upper/Lower + 10 د كارديو/جلسة (40 د/أسبوع).",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        gymExistingCardioSession(1, "UPPER_A", "علوي أ", "Upper A", "علوي + كارديو", "upper", 65, ["WU-001", "WU-010", "WU-021"], ["CH-001", "BA-006", "SH-001", "BA-016", "BI-001", "TR-001"], "CR-002", "10 min"),
        gymExistingCardioSession(2, "LOWER_A", "سفلي أ", "Lower A", "سفلي + كارديو", "lower", 65, ["WU-002", "WU-003", "WU-017"], ["LE-001", "BA-023", "GL-001", "LE-004", "LE-009", "AB-011"], "CR-002", "10 min"),
        gymExistingCardioSession(4, "UPPER_B", "علوي ب", "Upper B", "تنويع علوي", "upper", 65, ["WU-013", "WU-001", "WU-019"], ["CH-002", "BA-010", "SH-005", "BA-017", "BI-002", "TR-002"], "CR-001", "10 min"),
        gymExistingCardioSession(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع سفلي", "lower", 65, ["WU-002", "WU-020", "WU-003"], ["LE-005", "LE-007", "GL-003", "LE-010", "GL-007", "AB-001"], "CR-002", "10 min"),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "BODY_RECOMPOSITION",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "متوسط منزلي لإعادة التركيب.",
      template_purpose_ar: "Upper/Lower منزلي + مشي 10 د بعد كل جلسة.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        homePostWalkSession(1, "UPPER_A", "علوي أ", "Upper A", "علوي", "upper", 60, ["WU-001", "WU-010", "WU-021"], ["CH-007", "BA-013", "SH-002", "BA-014", "BI-003", "TR-003"], "10 min"),
        homePostWalkSession(2, "LOWER_A", "سفلي أ", "Lower A", "سفلي", "lower", 60, ["WU-002", "WU-003", "WU-017"], ["LE-003", "GL-002", "LE-008", "GL-008", "LE-013", "AB-006"], "10 min"),
        homePostWalkSession(4, "UPPER_B", "علوي ب", "Upper B", "تنويع", "upper", 60, ["WU-013", "WU-001", "WU-019"], ["CH-004", "BA-021", "SH-005", "SH-007", "BI-002", "TR-006"], "10 min"),
        homePostWalkSession(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع", "lower", 60, ["WU-002", "WU-020", "WU-022"], ["LE-007", "GL-004", "LE-016", "GL-017", "GL-009", "AB-011"], "10 min"),
      ]),
    }),
  );

  // ─── GENERAL FITNESS ───
  packs.push(
    baseMeta({
      template_key: "GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "GENERAL_FITNESS",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Full Body A/B/C",
      target_audience_ar: "مبتدئ صالة للياقة العامة.",
      template_purpose_ar: "إحماء 5–10 + مقاومة + كارديو معتدل 10 — بلا HIIT إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        gymExistingCardioSession(1, "FB_A", "جسم كامل أ", "Full Body A", "لياقة متوازنة", "full_body", 55, ["WU-015", "WU-001", "WU-003"], ["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "AB-006"], "CR-002", "10 min"),
        gymExistingCardioSession(3, "FB_B", "جسم كامل ب", "Full Body B", "تنويع", "full_body", 55, ["WU-001", "WU-002", "WU-017"], ["LE-004", "CH-003", "BA-016", "SH-005", "BI-002", "TR-001"], "CR-002", "10 min"),
        gymExistingCardioSession(5, "FB_C", "جسم كامل ج", "Full Body C", "توازن", "full_body", 55, ["WU-013", "WU-010", "WU-020"], ["LE-007", "CH-004", "BA-010", "SH-007", "GL-001", "AB-011"], "CR-001", "10 min"),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "GENERAL_FITNESS",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Full Body A/B/C",
      target_audience_ar: "مبتدئ منزلي للياقة العامة.",
      template_purpose_ar: "مقاومة منزلية + مشي/منخفض الأثر 10 د.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        homePostWalkSession(1, "FB_A", "جسم كامل أ", "Full Body A", "لياقة", "full_body", 50, ["WU-023", "WU-001", "WU-003"], ["LE-003", "CH-004", "BA-013", "SH-002", "GL-002", "AB-006"], "10 min", undefined, true, "5 min"),
        homePostWalkSession(3, "FB_B", "جسم كامل ب", "Full Body B", "تنويع", "full_body", 50, ["WU-001", "WU-002", "WU-017"], ["LE-008", "CH-007", "BA-014", "SH-005", "BI-002", "TR-003"], "10 min"),
        // Day C: March in Place as existing low-impact finish (still need walk addition on other days)
        session(5, "FB_C", "جسم كامل ج", "Full Body C", "توازن + مشي في المكان كمكمّل منخفض الأثر", "full_body", 50, [
          ...wu3("WU-013", "WU-010", "WU-020"),
          ...mains(["LE-007", "CH-013", "BA-021", "SH-007", "GL-004", "AB-011"]),
          existingSlot("WU-023", "POST_WORKOUT_CARDIO", {
            reps: "10 min",
            sets: 1,
            rest: 0,
            slot_key: "POST_WORKOUT_CARDIO",
            smart: false,
            notes_ar: "بديل منخفض الأثر موجود — المشي الخارجي يبقى الإضافة المعتمدة للأيام الأخرى",
          }),
        ]),
      ]),
    }),
  );

  // GENERAL_FITNESS Intermediate removed — NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY

  return packs.concat(buildRemainingPart2());
}

function buildRemainingPart2(): TemplateSequencePack[] {
  const packs: TemplateSequencePack[] = [];

  // ─── GLUTE GYM ───
  packs.push(
    baseMeta({
      template_key: "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "GLUTE_FOCUS",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Glute Priority Full Body A/B/C",
      target_audience_ar: "مبتدئة/مبتدئ صالة لتركيز الألوية مع توازن سفلي.",
      template_purpose_ar: "مقاومة تركز الألوية مع دعم سفلي وجذع — بلا ادعاءات حرق موضعي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE",
      preferred_demonstrator: "FEMALE",
      preferred_media_variant: "FEMALE",
      client_compatibility_review_required: false,
      authoring_notes_ar: ["تسلسل من المكتبة الحالية — جاهز للاستيراد؛ الإطلاق يتطلب ميديا أنثوية."],
      sessions: fillWeek([
        session(1, "GLUTE_A", "ألوية أ", "Glute A", "دفع ورك + رباعية", "glute", 55, [...wu3("WU-003", "WU-022", "WU-002"), ...mains(["GL-001", "LE-003", "GL-003", "LE-007", "GL-002", "AB-011"], { reps: [10, 12], rest: 75 })]),
        session(3, "GLUTE_B", "ألوية ب", "Glute B", "مفصلة خلفية + تباعد", "glute", 55, [...wu3("WU-020", "WU-003", "WU-017"), ...mains(["BA-023", "GL-007", "LE-004", "GL-004", "GL-015", "AB-006"], { reps: [10, 12], rest: 75 })]),
        session(5, "GLUTE_C", "ألوية ج", "Glute C", "توازن سفلي وعلوي خفيف", "glute", 55, [...wu3("WU-001", "WU-022", "WU-002"), ...mains(["GL-001", "LE-008", "GL-006", "CH-012", "BA-016", "GL-009"], { reps: [10, 12], rest: 75 })]),
      ]),
    }),
  );

  // Glute HOME omitted — NON_EXISTENT_VARIANT_BY_PRODUCT_POLICY (not in canonical master)

  packs.push(
    baseMeta({
      template_key: "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "GLUTE_FOCUS",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Glute Lower / Upper Support ×2",
      target_audience_ar: "متوسط صالة لتركيز الألوية بحجم أعلى.",
      template_purpose_ar: "تقدم حجم ألوية مع دعم علوي متوازن.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "FEMALE_MEDIA_COMPLETENESS_REQUIRED_BEFORE_RELEASE",
      preferred_demonstrator: "FEMALE",
      preferred_media_variant: "FEMALE",
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "GLUTE_LOWER_A", "سفلي ألوية أ", "Glute Lower A", "دفع ورك ثقيل", "glute_lower", 60, [...wu3("WU-003", "WU-022", "WU-002"), ...mains(["GL-001", "BA-023", "LE-001", "GL-003", "LE-009", "GL-007"], { reps: [8, 12], sets: 3, rest: 90 })]),
        session(2, "UPPER_SUPPORT_A", "علوي داعم أ", "Upper Support A", "توازن علوي", "upper", 55, [...wu3("WU-001", "WU-010", "WU-021"), ...mains(["CH-003", "BA-006", "SH-002", "BA-016", "BI-002", "TR-001"], { reps: [8, 12], rest: 90 })]),
        session(4, "GLUTE_LOWER_B", "سفلي ألوية ب", "Glute Lower B", "تنويع ألوية", "glute_lower", 60, [...wu3("WU-020", "WU-003", "WU-017"), ...mains(["GL-006", "LE-005", "GL-004", "LE-007", "GL-015", "AB-011"], { reps: [8, 12], rest: 90 })]),
        session(5, "UPPER_SUPPORT_B", "علوي داعم ب", "Upper Support B", "تنويع علوي", "upper", 55, [...wu3("WU-013", "WU-001", "WU-019"), ...mains(["CH-012", "BA-010", "SH-005", "BA-017", "BI-001", "TR-002"], { reps: [8, 12], rest: 90 })]),
      ]),
    }),
  );

  // ─── ATHLETIC remaining ───
  packs.push(
    baseMeta({
      template_key: "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "ATHLETIC_PERFORMANCE",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Full Body + Power Skill",
      target_audience_ar: "مبتدئ صالة لأداء رياضي تأسيسي.",
      template_purpose_ar: "مهارة قوة منخفضة التعقيد + 6 مقاومة — بلا قفز/أولمبي إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "ATH_A", "رياضي أ", "Athletic A", "جودة حركة + قوة", "athletic", 60, [
          ...wu3("WU-001", "WU-002", "WU-003"),
          power("FO-003", "20 m × 3", "حمل مزارعين — مهارة قوة/ثبات — خارج الـ6 الرئيسية"),
          ...mains(["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "AB-011"], { reps: [6, 10], rest: 90 }),
        ]),
        session(3, "ATH_B", "رياضي ب", "Athletic B", "تنويع", "athletic", 60, [
          ...wu3("WU-013", "WU-010", "WU-017"),
          power("GL-017", [6, 8], "أرجحة كيتل بيل بجودة — جاهزية منخفضة/متوسطة"),
          ...mains(["LE-007", "CH-003", "BA-016", "SH-005", "BA-023", "AB-006"], { reps: [6, 10], rest: 90 }),
        ]),
        session(5, "ATH_C", "رياضي ج", "Athletic C", "توازن", "athletic", 60, [
          ...wu3("WU-001", "WU-002", "WU-020"),
          power("CH-004", [5, 8], "ضغط أرضي بجودة كمهارة تحكم — بلا قفز إلزامي"),
          ...mains(["LE-004", "CH-007", "BA-010", "SH-007", "GL-001", "BI-002"], { reps: [6, 10], rest: 90 }),
        ]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "ATHLETIC_PERFORMANCE",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Upper/Lower + Power",
      target_audience_ar: "متوسط صالة لأداء رياضي.",
      template_purpose_ar: "قوة مهارة + مقاومة أعلى — بلا أولمبي إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "UPPER_A", "علوي أ", "Upper A", "علوي + قوة", "upper", 65, [...wu3("WU-001", "WU-010", "WU-021"), power("FO-003", "30 m × 3", "حمل مزارعين"), ...mains(["CH-001", "BA-006", "SH-001", "BA-016", "BI-001", "TR-001"], { reps: [5, 8], sets: 3, rest: 120 })]),
        session(2, "LOWER_A", "سفلي أ", "Lower A", "سفلي + قوة", "lower", 65, [...wu3("WU-002", "WU-003", "WU-017"), power("GL-017", [5, 8], "أرجحة كيتل بيل"), ...mains(["LE-001", "BA-023", "LE-004", "GL-001", "LE-009", "AB-011"], { reps: [5, 8], sets: 3, rest: 150 })]),
        session(4, "UPPER_B", "علوي ب", "Upper B", "تنويع", "upper", 65, [...wu3("WU-013", "WU-001", "WU-019"), power("CH-004", [5, 8], "جودة دفع"), ...mains(["CH-002", "BA-010", "SH-005", "BA-017", "BI-002", "TR-002"], { reps: [6, 10], rest: 120 })]),
        session(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع", "lower", 65, [...wu3("WU-002", "WU-020", "WU-003"), power("LE-007", [6, 8], "اندفاع بجودة — ليس سباق"), ...mains(["LE-005", "BA-022", "GL-003", "LE-010", "GL-007", "AB-006"], { reps: [6, 10], rest: 120 })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "ATHLETIC_PERFORMANCE",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Upper/Lower + Power",
      target_audience_ar: "متوسط منزلي لأداء رياضي.",
      template_purpose_ar: "مهارة قوة منزلية بلا قفز إلزامي + مقاومة.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "UPPER_A", "علوي أ", "Upper A", "علوي", "upper", 55, [...wu3("WU-001", "WU-010", "WU-021"), power("FO-003", "20 m × 3", "حمل مزارعين — مساحة مطلوبة"), ...mains(["CH-007", "BA-013", "SH-002", "BA-014", "BI-003", "TR-003"], { reps: [6, 10], rest: 90 })]),
        session(2, "LOWER_A", "سفلي أ", "Lower A", "سفلي", "lower", 55, [...wu3("WU-002", "WU-003", "WU-017"), power("GL-017", [6, 8], "أرجحة كيتل بيل"), ...mains(["LE-003", "GL-002", "LE-008", "GL-008", "LE-013", "AB-006"], { reps: [6, 10], rest: 90 })]),
        session(4, "UPPER_B", "علوي ب", "Upper B", "تنويع", "upper", 55, [...wu3("WU-013", "WU-001", "WU-019"), power("CH-004", [5, 8], "جودة دفع"), ...mains(["CH-013", "BA-021", "SH-005", "SH-007", "BI-002", "TR-006"], { reps: [6, 10], rest: 90 })]),
        session(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع", "lower", 55, [...wu3("WU-002", "WU-020", "WU-022"), power("LE-007", [6, 8], "اندفاع بجودة"), ...mains(["LE-007", "GL-004", "LE-016", "GL-017", "GL-009", "AB-011"], { reps: [6, 10], rest: 90 })]),
      ]),
    }),
  );

  // ─── STRENGTH ───
  packs.push(
    baseMeta({
      template_key: "STRENGTH_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "STRENGTH",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Full Body Strength A/B/C",
      target_audience_ar: "مبتدئ صالة للقوة.",
      template_purpose_ar: "3 إحماءات عامة + ramp-up عند الحاجة + 6 رئيسية — بلا كارديو إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "STR_A", "قوة أ", "Strength A", "قرفصاء/ضغط/سحب", "strength", 60, [...wu3("WU-001", "WU-002", "WU-003"), ramp("LE-003"), ...mains(["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "AB-011"], { reps: [5, 8], sets: 3, rest: 150 })]),
        session(3, "STR_B", "قوة ب", "Strength B", "تنويع أساسي", "strength", 60, [...wu3("WU-013", "WU-010", "WU-017"), ramp("CH-003"), ...mains(["CH-003", "BA-016", "LE-004", "SH-001", "BA-023", "TR-001"], { reps: [5, 8], sets: 3, rest: 150 })]),
        session(5, "STR_C", "قوة ج", "Strength C", "توازن", "strength", 60, [...wu3("WU-001", "WU-002", "WU-020"), ramp("BA-010"), ...mains(["BA-010", "LE-007", "CH-007", "SH-005", "GL-001", "BI-001"], { reps: [5, 8], sets: 3, rest: 150 })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "STRENGTH_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "STRENGTH",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Full Body Strength A/B/C",
      target_audience_ar: "مبتدئ منزلي للقوة.",
      template_purpose_ar: "3 إحماءات + ramp-up عند الحاجة + 6 رئيسية منزلية — بلا كارديو إلزامي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "STR_A", "قوة أ", "Strength A", "قرفصاء/ضغط/سحب", "strength", 55, [...wu3("WU-001", "WU-002", "WU-003"), ramp("LE-003"), ...mains(["LE-003", "CH-007", "BA-013", "SH-002", "GL-002", "AB-011"], { reps: [5, 8], sets: 3, rest: 150 })]),
        session(3, "STR_B", "قوة ب", "Strength B", "تنويع", "strength", 55, [...wu3("WU-013", "WU-010", "WU-017"), ramp("CH-004"), ...mains(["CH-004", "BA-014", "LE-008", "SH-019", "GL-008", "TR-003"], { reps: [5, 8], sets: 3, rest: 150 })]),
        session(5, "STR_C", "قوة ج", "Strength C", "توازن", "strength", 55, [...wu3("WU-001", "WU-002", "WU-020"), ramp("BA-021"), ...mains(["BA-021", "LE-007", "CH-013", "SH-005", "GL-004", "BI-002"], { reps: [5, 8], sets: 3, rest: 150 })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "STRENGTH_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "STRENGTH",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Upper / Lower ×2",
      target_audience_ar: "متوسط منزلي للقوة.",
      template_purpose_ar: "Upper/Lower منزلي مع ramp-up — Progress GYM 4D هو Pilot المستورد.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "UPPER_A", "علوي أ", "Upper A", "دفع/سحب", "upper", 60, [...wu3("WU-001", "WU-010", "WU-021"), ramp("CH-007"), ...mains(["CH-007", "BA-013", "SH-002", "BA-014", "BI-003", "TR-003"], { reps: [4, 6], sets: 4, rest: 180 })]),
        session(2, "LOWER_A", "سفلي أ", "Lower A", "أرجل", "lower", 60, [...wu3("WU-002", "WU-003", "WU-017"), ramp("LE-003"), ...mains(["LE-003", "GL-002", "LE-008", "GL-008", "LE-013", "AB-011"], { reps: [4, 6], sets: 4, rest: 180 })]),
        session(4, "UPPER_B", "علوي ب", "Upper B", "تنويع", "upper", 60, [...wu3("WU-013", "WU-001", "WU-019"), ramp("SH-019"), ...mains(["SH-019", "CH-004", "BA-021", "SH-005", "BI-002", "TR-006"], { reps: [5, 8], sets: 3, rest: 150 })]),
        session(5, "LOWER_B", "سفلي ب", "Lower B", "تنويع", "lower", 60, [...wu3("WU-002", "WU-020", "WU-022"), ramp("LE-007"), ...mains(["LE-007", "GL-004", "LE-016", "GL-017", "GL-009", "AB-006"], { reps: [5, 8], sets: 3, rest: 150 })]),
      ]),
    }),
  );

  // STRENGTH_PROGRESS_INTERMEDIATE_GYM_5D removed — NON_EXISTENT; Pilot owns GYM_4D

  // ─── ENDURANCE ───
  packs.push(
    baseMeta({
      template_key: "ENDURANCE_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "ENDURANCE",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Resistance + Aerobic",
      target_audience_ar: "مبتدئ صالة للتحمّل.",
      template_purpose_ar: "مقاومة خفيفة-متوسطة + 15 د هوائي بعدي/جلسة — ليس HIIT.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "END_A", "تحمّل أ", "Endurance A", "مقاومة + هوائي", "endurance", 55, [...wu3("WU-015", "WU-001", "WU-003"), ...mains(["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "AB-006"], { reps: [10, 12], rest: 60 }), existingSlot("CR-002", "AEROBIC_ENDURANCE_BLOCK", { reps: "15 min", sets: 1, rest: 0, slot_key: "AEROBIC_ENDURANCE_BLOCK", smart: false, notes_ar: "هوائي ثابت — تحت سيطرة المدرب" })]),
        session(3, "END_B", "تحمّل ب", "Endurance B", "تنويع", "endurance", 55, [...wu3("WU-001", "WU-002", "WU-017"), ...mains(["LE-004", "CH-003", "BA-016", "SH-005", "BI-002", "TR-001"], { reps: [10, 12], rest: 60 }), existingSlot("CR-001", "AEROBIC_ENDURANCE_BLOCK", { reps: "15 min", sets: 1, rest: 0, slot_key: "AEROBIC_ENDURANCE_BLOCK", smart: false })]),
        session(5, "END_C", "تحمّل ج", "Endurance C", "توازن", "endurance", 55, [...wu3("WU-013", "WU-010", "WU-020"), ...mains(["LE-007", "CH-007", "BA-010", "SH-007", "GL-001", "AB-011"], { reps: [10, 12], rest: 60 }), existingSlot("CR-002", "AEROBIC_ENDURANCE_BLOCK", { reps: "15 min", sets: 1, rest: 0, slot_key: "AEROBIC_ENDURANCE_BLOCK", smart: false })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "ENDURANCE",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Resistance + Aerobic Walk",
      target_audience_ar: "مبتدئ منزلي للتحمّل بلا آلات.",
      template_purpose_ar: "مقاومة منزلية + مشي سريع 15 د ككتلة هوائية.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "END_A", "تحمّل أ", "Endurance A", "مقاومة + مشي", "endurance", 50, [...wu3("WU-023", "WU-001", "WU-003"), ...mains(["LE-003", "CH-004", "BA-013", "SH-002", "GL-002", "AB-006"]), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "15 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
        session(3, "END_B", "تحمّل ب", "Endurance B", "تنويع", "endurance", 50, [...wu3("WU-001", "WU-002", "WU-017"), ...mains(["LE-008", "CH-007", "BA-014", "SH-005", "BI-002", "TR-003"]), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "15 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
        session(5, "END_C", "تحمّل ج", "Endurance C", "توازن", "endurance", 50, [...wu3("WU-013", "WU-010", "WU-020"), ...mains(["LE-007", "CH-013", "BA-021", "SH-007", "GL-004", "AB-011"]), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "15 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "ENDURANCE",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Resistance + Aerobic / Controlled Intervals",
      target_audience_ar: "متوسط صالة للتحمّل.",
      template_purpose_ar: "مقاومة + هوائي بإجمالي ~75 د/أسبوع بعدي/كتل — فواصل مضبوطة ≠ HIIT.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      authoring_notes_ar: ["توزيع الكارديو الأسبوعي: 20+20+20+15 = 75 دقيقة."],
      qa_flags: ["RUNTIME_CONTROLLED_AEROBIC_INTERVAL_BLOCK_GENERIC_OR_UNSUPPORTED"],
      sessions: fillWeek([
        session(1, "END_A", "تحمّل أ", "Endurance A", "مقاومة + هوائي", "endurance", 60, [...wu3("WU-015", "WU-001", "WU-003"), ...mains(["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "AB-006"], { reps: [10, 12], rest: 60 }), existingSlot("CR-002", "AEROBIC_ENDURANCE_BLOCK", { reps: "20 min", sets: 1, rest: 0, slot_key: "AEROBIC_ENDURANCE_BLOCK", smart: false })]),
        session(2, "END_B", "تحمّل ب", "Endurance B", "مقاومة + فواصل مضبوطة", "endurance", 60, [...wu3("WU-001", "WU-002", "WU-017"), ...mains(["LE-004", "CH-003", "BA-016", "SH-005", "BI-002", "TR-001"], { reps: [10, 12], rest: 60 }), existingSlot("CR-001", "CONTROLLED_AEROBIC_INTERVAL_BLOCK", { reps: "20 min (1:1 easy/moderate)", sets: 1, rest: 0, slot_key: "CONTROLLED_AEROBIC_INTERVAL_BLOCK", smart: false, notes_ar: "فواصل مضبوطة — ليست HIIT — تحت سيطرة المدرب" })]),
        session(4, "END_C", "تحمّل ج", "Endurance C", "مقاومة + هوائي", "endurance", 60, [...wu3("WU-013", "WU-010", "WU-020"), ...mains(["LE-007", "CH-007", "BA-010", "SH-007", "GL-001", "AB-011"], { reps: [10, 12], rest: 60 }), existingSlot("CR-002", "AEROBIC_ENDURANCE_BLOCK", { reps: "20 min", sets: 1, rest: 0, slot_key: "AEROBIC_ENDURANCE_BLOCK", smart: false })]),
        session(5, "END_D", "تحمّل د", "Endurance D", "مقاومة + هوائي", "endurance", 55, [...wu3("WU-015", "WU-002", "WU-003"), ...mains(["LE-001", "CH-001", "BA-017", "SH-001", "BA-023", "BI-001"], { reps: [8, 10], rest: 75 }), existingSlot("CR-001", "AEROBIC_ENDURANCE_BLOCK", { reps: "15 min", sets: 1, rest: 0, slot_key: "AEROBIC_ENDURANCE_BLOCK", smart: false })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "ENDURANCE",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Resistance + Aerobic Walk Progress",
      target_audience_ar: "متوسط منزلي للتحمّل.",
      template_purpose_ar: "مقاومة منزلية + مشي سريع بإجمالي ~75 د/أسبوع (20+20+20+15).",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      authoring_notes_ar: ["كارديو منزلي عبر ADD_HOME_BRISK_WALK — 75 د/أسبوع حسب سياسة التحمّل المتوسط."],
      sessions: fillWeek([
        session(1, "END_A", "تحمّل أ", "Endurance A", "مقاومة + مشي", "endurance", 55, [...wu3("WU-023", "WU-001", "WU-003"), ...mains(["LE-003", "CH-004", "BA-013", "SH-002", "GL-002", "AB-006"], { reps: [10, 12], rest: 60 }), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "20 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
        session(2, "END_B", "تحمّل ب", "Endurance B", "تنويع + مشي", "endurance", 55, [...wu3("WU-001", "WU-002", "WU-017"), ...mains(["LE-008", "CH-007", "BA-014", "SH-005", "BI-002", "TR-003"], { reps: [10, 12], rest: 60 }), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "20 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
        session(4, "END_C", "تحمّل ج", "Endurance C", "توازن + مشي", "endurance", 55, [...wu3("WU-013", "WU-010", "WU-020"), ...mains(["LE-007", "CH-013", "BA-021", "SH-007", "GL-004", "AB-011"], { reps: [10, 12], rest: 60 }), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "20 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
        session(5, "END_D", "تحمّل د", "Endurance D", "مكمّل + مشي", "endurance", 50, [...wu3("WU-023", "WU-002", "WU-003"), ...mains(["LE-016", "CH-007", "BA-013", "SH-019", "GL-008", "AB-006"], { reps: [8, 12], rest: 75 }), additionSlot("ADD_HOME_BRISK_WALK", "AEROBIC_ENDURANCE_BLOCK", "15 min", { slot_key: "AEROBIC_ENDURANCE_BLOCK" })]),
      ]),
    }),
  );

  // ─── MOBILITY ───
  packs.push(
    baseMeta({
      template_key: "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "MOBILITY_FUNCTIONAL",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Mobility + Functional Strength",
      target_audience_ar: "مبتدئ منزلي لحركة وظيفية ومدى حركة قابل للاستخدام.",
      template_purpose_ar: "جودة حركة + أنماط وظيفية — بلا إنهاك وبلا تمدد ثابت إلزامي كختام.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "MOB_A", "حركة أ", "Mobility A", "ورك/عمود/ثبات", "mobility", 45, [...wu3("WU-008", "WU-003", "WU-001"), ...mains(["GL-002", "AB-011", "LE-003", "CH-004", "BA-021", "AB-006"], { reps: [8, 12], rest: 60 }), existingSlot("MO-009", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(3, "MOB_B", "حركة ب", "Mobility B", "كتف/صدر/ورك", "mobility", 45, [...wu3("WU-013", "WU-010", "WU-020"), ...mains(["SH-014", "GL-010", "LE-008", "BA-013", "SH-007", "AB-007"], { reps: [8, 12], rest: 60 }), existingSlot("MO-002", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(5, "MOB_C", "حركة ج", "Mobility C", "توازن وظيفي", "mobility", 45, [...wu3("WU-009", "WU-002", "WU-017"), ...mains(["LE-016", "CH-013", "GL-009", "FO-003", "AB-012", "GL-004"], { reps: [8, 12], rest: 60 }), existingSlot("MO-007", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "MOBILITY_FUNCTIONAL",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Mobility + Functional Strength",
      target_audience_ar: "مبتدئ صالة لحركة وظيفية.",
      template_purpose_ar: "مدى حركة قابل للاستخدام + أنماط وظيفية في الصالة.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "MOB_A", "حركة أ", "Mobility A", "ورك/ثبات", "mobility", 45, [...wu3("WU-008", "WU-003", "WU-001"), ...mains(["GL-002", "AB-011", "LE-003", "CH-012", "BA-016", "AB-006"], { reps: [8, 12], rest: 60 }), existingSlot("MO-009", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(3, "MOB_B", "حركة ب", "Mobility B", "كتف/ظهر", "mobility", 45, [...wu3("WU-013", "WU-010", "WU-020"), ...mains(["SH-014", "GL-010", "LE-007", "BA-006", "SH-007", "AB-007"], { reps: [8, 12], rest: 60 }), existingSlot("MO-011", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(5, "MOB_C", "حركة ج", "Mobility C", "وظيفي", "mobility", 45, [...wu3("WU-009", "WU-002", "WU-017"), ...mains(["LE-016", "CH-004", "GL-015", "FO-003", "AB-012", "GL-001"], { reps: [8, 12], rest: 60 }), existingSlot("MO-015", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "MOBILITY_FUNCTIONAL",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Mobility + Functional Strength Progress A–D",
      target_audience_ar: "متوسط صالة لجودة حركة أعلى.",
      template_purpose_ar: "تقدم أنماط وظيفية ومدى حركة مضبوط في الصالة — 4 أيام.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        session(1, "MOB_A", "حركة أ", "Mobility A", "ورك متقدم", "mobility", 50, [...wu3("WU-008", "WU-003", "WU-009"), ...mains(["GL-008", "AB-011", "LE-003", "CH-012", "BA-016", "AB-023"], { reps: [8, 12], rest: 60 }), existingSlot("MO-010", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(2, "MOB_B", "حركة ب", "Mobility B", "كتف/صدر", "mobility", 50, [...wu3("WU-013", "WU-010", "WU-021"), ...mains(["SH-014", "GL-010", "LE-007", "BA-006", "SH-007", "AB-012"], { reps: [8, 12], rest: 60 }), existingSlot("MO-018", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(4, "MOB_C", "حركة ج", "Mobility C", "وظيفي", "mobility", 50, [...wu3("WU-009", "WU-002", "WU-020"), ...mains(["LE-016", "CH-004", "GL-015", "FO-003", "AB-006", "GL-001"], { reps: [8, 12], rest: 60 }), existingSlot("MO-015", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(5, "MOB_D", "حركة د", "Mobility D", "ثبات وتوازن", "mobility", 50, [...wu3("WU-008", "WU-001", "WU-017"), ...mains(["GL-002", "AB-011", "LE-005", "CH-003", "BA-010", "AB-007"], { reps: [8, 12], rest: 60 }), existingSlot("MO-011", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
      ]),
    }),
  );

  // ─── MOBILITY PROGRESS HOME ───

  packs.push(
    baseMeta({
      template_key: "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "MOBILITY_FUNCTIONAL",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Mobility + Functional Strength Progress A–D",
      target_audience_ar: "متوسط منزلي لجودة حركة أعلى.",
      template_purpose_ar: "تقدم أنماط وظيفية ومدى حركة مضبوط — 4 أيام حسب الماستر.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        session(1, "MOB_A", "حركة أ", "Mobility A", "ورك متقدم مضبوط", "mobility", 50, [...wu3("WU-008", "WU-003", "WU-009"), ...mains(["GL-008", "AB-011", "LE-003", "CH-007", "BA-013", "AB-023"], { reps: [8, 12], rest: 60 }), existingSlot("MO-010", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(2, "MOB_B", "حركة ب", "Mobility B", "كتف/صدر", "mobility", 50, [...wu3("WU-013", "WU-010", "WU-021"), ...mains(["SH-014", "GL-010", "LE-008", "BA-021", "SH-007", "AB-012"], { reps: [8, 12], rest: 60 }), existingSlot("MO-018", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(4, "MOB_C", "حركة ج", "Mobility C", "وظيفي", "mobility", 50, [...wu3("WU-009", "WU-002", "WU-020"), ...mains(["LE-016", "CH-013", "GL-017", "FO-003", "AB-006", "GL-004"], { reps: [8, 12], rest: 60 }), existingSlot("MO-015", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
        session(5, "MOB_D", "حركة د", "Mobility D", "ثبات وتوازن", "mobility", 50, [...wu3("WU-008", "WU-001", "WU-017"), ...mains(["GL-002", "AB-011", "LE-013", "CH-004", "BA-014", "AB-007"], { reps: [8, 12], rest: 60 }), existingSlot("MO-007", "MOBILITY_ACTIVITY", { reps: "2 min controlled", sets: 1, rest: 0, slot_key: "MOBILITY_ACTIVITY", smart: false })]),
      ]),
    }),
  );

  // ─── HEALTHY AGING ───
  packs.push(
    baseMeta({
      template_key: "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D",
      primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE",
      level: "BEGINNER",
      environment: "HOME",
      days_per_week: 3,
      weekly_split: "Full Body Function + Aerobic",
      target_audience_ar: "مبتدئ منزلي لحياة نشطة صحية — مقاومة ذات معنى.",
      template_purpose_ar: "قوة وظيفية + ثبات + 10 د هوائي بعدي — الدعم ≠ فشل.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      sessions: fillWeek([
        homePostWalkSession(1, "HA_A", "حياة نشطة أ", "Active Life A", "قوة ووظيفة", "full_body", 50, ["WU-023", "WU-001", "WU-003"], ["LE-003", "CH-004", "BA-013", "SH-002", "GL-002", "AB-006"], "10 min", { reps: [8, 12], rest: 75 }),
        homePostWalkSession(3, "HA_B", "حياة نشطة ب", "Active Life B", "توازن وثبات", "full_body", 50, ["WU-001", "WU-002", "WU-017"], ["LE-008", "CH-007", "BA-014", "SH-005", "GL-008", "AB-011"], "10 min", { reps: [8, 12], rest: 75 }),
        homePostWalkSession(5, "HA_C", "حياة نشطة ج", "Active Life C", "وظيفة يومية", "full_body", 50, ["WU-013", "WU-010", "WU-020"], ["LE-013", "CH-013", "BA-021", "FO-003", "GL-004", "AB-007"], "10 min", { reps: [8, 12], rest: 75 }),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D",
      primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE",
      level: "BEGINNER",
      environment: "GYM",
      days_per_week: 3,
      weekly_split: "Full Body Function + Aerobic",
      target_audience_ar: "مبتدئ صالة لحياة نشطة صحية.",
      template_purpose_ar: "مقاومة ذات معنى + 10 د هوائي بعدي.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      sessions: fillWeek([
        gymExistingCardioSession(1, "HA_A", "حياة نشطة أ", "Active Life A", "قوة", "full_body", 55, ["WU-015", "WU-001", "WU-003"], ["LE-003", "CH-012", "BA-006", "SH-002", "GL-002", "AB-006"], "CR-002", "10 min"),
        gymExistingCardioSession(3, "HA_B", "حياة نشطة ب", "Active Life B", "ثبات", "full_body", 55, ["WU-001", "WU-002", "WU-017"], ["LE-004", "CH-003", "BA-016", "SH-005", "GL-001", "AB-011"], "CR-002", "10 min"),
        gymExistingCardioSession(5, "HA_C", "حياة نشطة ج", "Active Life C", "وظيفة", "full_body", 55, ["WU-013", "WU-010", "WU-020"], ["LE-007", "CH-007", "BA-010", "FO-003", "GL-007", "AB-007"], "CR-001", "10 min"),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
      primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE",
      level: "INTERMEDIATE",
      environment: "GYM",
      days_per_week: 4,
      weekly_split: "Full Body Progress + Aerobic A–D",
      target_audience_ar: "متوسط صالة لحياة نشطة — 4 أيام.",
      template_purpose_ar: "مقاومة ذات معنى + 15 د هوائي بعدي/جلسة = 60 د/أسبوع.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: false,
      authoring_notes_ar: ["كارديو 15×4=60 عبر دراجة/جري موجود — ليس مشي سريع مطلوبًا."],
      sessions: fillWeek([
        gymExistingCardioSession(1, "HA_A", "حياة نشطة أ", "Active Life A", "قوة متقدمة", "full_body", 60, ["WU-015", "WU-001", "WU-003"], ["LE-003", "CH-012", "BA-006", "SH-002", "GL-001", "AB-006"], "CR-002", "15 min"),
        gymExistingCardioSession(2, "HA_B", "حياة نشطة ب", "Active Life B", "ثبات", "full_body", 60, ["WU-001", "WU-002", "WU-017"], ["LE-004", "CH-003", "BA-016", "SH-005", "GL-002", "AB-011"], "CR-002", "15 min"),
        gymExistingCardioSession(4, "HA_C", "حياة نشطة ج", "Active Life C", "وظيفة", "full_body", 60, ["WU-013", "WU-010", "WU-020"], ["LE-007", "CH-007", "BA-010", "FO-003", "GL-007", "AB-007"], "CR-001", "15 min"),
        gymExistingCardioSession(5, "HA_D", "حياة نشطة د", "Active Life D", "توازن أسبوعي", "full_body", 60, ["WU-015", "WU-002", "WU-003"], ["LE-001", "CH-001", "BA-017", "SH-001", "GL-003", "AB-006"], "CR-002", "15 min"),
      ]),
    }),
  );

  packs.push(
    baseMeta({
      template_key: "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D",
      primary_strategy: "HEALTHY_AGING_ACTIVE_LIFE",
      level: "INTERMEDIATE",
      environment: "HOME",
      days_per_week: 4,
      weekly_split: "Full Body Progress + Aerobic A–D",
      target_audience_ar: "متوسط منزلي لحياة نشطة — 4 أيام حسب الماستر.",
      template_purpose_ar: "مقاومة ذات معنى + 15 د هوائي بعدي/جلسة = 60 د/أسبوع.",
      content_status: "CONTENT_APPROVED_FOR_IMPORT",
      female_media_policy: "STANDARD_OK",
      preferred_demonstrator: null,
      preferred_media_variant: null,
      client_compatibility_review_required: true,
      authoring_notes_ar: ["أيام القالب 4 حسب الماستر؛ كارديو 15×4=60."],
      sessions: fillWeek([
        homePostWalkSession(1, "HA_A", "حياة نشطة أ", "Active Life A", "قوة متقدمة", "full_body", 55, ["WU-023", "WU-001", "WU-003"], ["LE-003", "CH-007", "BA-013", "SH-019", "GL-008", "AB-006"], "15 min", { reps: [8, 12], rest: 75 }),
        homePostWalkSession(2, "HA_B", "حياة نشطة ب", "Active Life B", "ثبات", "full_body", 55, ["WU-001", "WU-002", "WU-017"], ["LE-008", "CH-004", "BA-014", "SH-005", "GL-002", "AB-011"], "15 min", { reps: [8, 12], rest: 75 }),
        homePostWalkSession(4, "HA_C", "حياة نشطة ج", "Active Life C", "وظيفة", "full_body", 55, ["WU-013", "WU-010", "WU-020"], ["LE-013", "CH-013", "BA-021", "FO-003", "GL-004", "AB-007"], "15 min", { reps: [8, 12], rest: 75 }),
        homePostWalkSession(5, "HA_D", "حياة نشطة د", "Active Life D", "توازن أسبوعي", "full_body", 55, ["WU-023", "WU-002", "WU-003"], ["LE-007", "CH-007", "BA-013", "SH-007", "GL-009", "AB-006"], "15 min", { reps: [8, 12], rest: 75 }),
      ]),
    }),
  );

  for (const pack of packs) {
    const needsAddition = pack.sessions.some((s) =>
      s.exercises.some((e) => e.content_status === "EXERCISE_LIBRARY_ADDITION_REQUIRED"),
    );
    if (!needsAddition && pack.content_status === "CONTENT_APPROVED_FOR_IMPORT") {
      pack.content_status = "CONTENT_APPROVED_FOR_IMPORT";
    }
  }

  return packs;
}

export const REMAINING_CANONICAL_EXPECTED_KEYS = [
  "FAT_LOSS_FOUNDATION_BEGINNER_GYM_4D",
  "FAT_LOSS_PROGRESS_INTERMEDIATE_GYM_4D",
  "FAT_LOSS_FOUNDATION_BEGINNER_HOME_3D",
  "MUSCLE_GAIN_FOUNDATION_BEGINNER_GYM_3D",
  "MUSCLE_GAIN_UPPER_LOWER_INTERMEDIATE_GYM_4D",
  "MUSCLE_GAIN_ADVANCED_SPLIT_INTERMEDIATE_GYM_5D",
  "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_GYM_3D",
  "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_GYM_4D",
  "GENERAL_FITNESS_FOUNDATION_BEGINNER_GYM_3D",
  "GENERAL_FITNESS_FOUNDATION_BEGINNER_HOME_3D",
  "STRENGTH_FOUNDATION_BEGINNER_GYM_3D",
  "GLUTE_FOCUS_FOUNDATION_BEGINNER_GYM_3D",
  "GLUTE_FOCUS_PROGRESS_INTERMEDIATE_GYM_4D",
  "ENDURANCE_FOUNDATION_BEGINNER_GYM_3D",
  "ENDURANCE_PROGRESS_INTERMEDIATE_GYM_4D",
  "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_GYM_3D",
  "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_GYM_4D",
  "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_GYM_3D",
  "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_GYM_4D",
  "ATHLETIC_PERFORMANCE_FOUNDATION_BEGINNER_GYM_3D",
  "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_GYM_4D",
  "MUSCLE_GAIN_PROGRESS_INTERMEDIATE_HOME_4D",
  "BODY_RECOMPOSITION_FOUNDATION_BEGINNER_HOME_3D",
  "BODY_RECOMPOSITION_PROGRESS_INTERMEDIATE_HOME_4D",
  "STRENGTH_FOUNDATION_BEGINNER_HOME_3D",
  "STRENGTH_PROGRESS_INTERMEDIATE_HOME_4D",
  "ENDURANCE_FOUNDATION_BEGINNER_HOME_3D",
  "ENDURANCE_PROGRESS_INTERMEDIATE_HOME_4D",
  "MOBILITY_FUNCTIONAL_FOUNDATION_BEGINNER_HOME_3D",
  "MOBILITY_FUNCTIONAL_PROGRESS_INTERMEDIATE_HOME_4D",
  "HEALTHY_AGING_ACTIVE_LIFE_FOUNDATION_BEGINNER_HOME_3D",
  "HEALTHY_AGING_ACTIVE_LIFE_PROGRESS_INTERMEDIATE_HOME_4D",
  "ATHLETIC_PERFORMANCE_PROGRESS_INTERMEDIATE_HOME_4D",
] as const;

/** @deprecated use REMAINING_CANONICAL_EXPECTED_KEYS */
export const REMAINING_32_EXPECTED_KEYS = REMAINING_CANONICAL_EXPECTED_KEYS;
