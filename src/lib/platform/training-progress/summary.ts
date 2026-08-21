import { resolveCanonicalGoal } from "@/lib/platform/prescription/goal-profile";
import { GOAL_COPY } from "@/lib/platform/goal-intelligence/explanations";
import {
  FORBIDDEN_CLIENT_PHRASES,
  GOAL_DISPLAY_NAMES,
  REGION_LABELS,
  goalDisplayName,
  goalSignals,
  mapContinuityAction,
  mapGoalStatus,
  mapProgressionAction,
  mapVolumeAction,
  reallocationCopy,
} from "./copy";
import {
  TRAINING_PROGRESS_VERSION,
  type ClientTrainingProgressSummary,
  type ExerciseTrendCard,
  type TrainingProgressInput,
} from "./types";

function formatLoad(value: number | null) {
  if (value == null) return null;
  return `${value} كجم`;
}

function formatReps(value: number | null) {
  if (value == null) return null;
  return `${value} تكرار`;
}

function formatDuration(value: number | null) {
  if (value == null) return null;
  return `${value} ث`;
}

export function getClientTrainingProgressSummary(input: TrainingProgressInput): ClientTrainingProgressSummary {
  if (input.loadError) {
    return emptySummary(true);
  }

  const canonical = resolveCanonicalGoal(input.goalId).canonicalId;
  const goalCard = mapGoalStatus(input.goalDecision?.goal_response ?? "INSUFFICIENT_DATA");
  if (canonical) {
    goalCard.optional_detail = GOAL_DISPLAY_NAMES[canonical];
  }

  if (input.goalDecision?.action === "REALLOCATE_TRAINING_EMPHASIS" && input.goalDecision.reallocation) {
    goalCard.short_reason = reallocationCopy(
      input.goalDecision.reallocation.from_region,
      input.goalDecision.reallocation.to_region,
      canonical,
    );
    goalCard.title = "قمنا بتعديل التركيز التدريبي";
  }

  const exercise_trends = (input.progressionSamples ?? []).slice(0, 4).map(toTrendCard);
  const wantedRegions = new Set(goalSignals(canonical).regional);
  const regional_cards = (input.regionalDecisions ?? [])
    .filter((row) => wantedRegions.size === 0 || wantedRegions.has(row.region) || [...wantedRegions].some((item) => row.region.includes(item)))
    .slice(0, 4)
    .map((row) => ({
      region: row.region,
      label_ar: REGION_LABELS[row.region] ?? row.region,
      summary: regionalSummary(row.response_state, canonical, row.region),
    }));

  const body_card = bodyCardFor(canonical, input);
  const consistency = input.continuity
    ? {
        completed: input.continuity.adherence.sessions_completed,
        prescribed: input.continuity.adherence.sessions_prescribed,
        partial: input.continuity.adherence.sessions_partial,
        missed: input.continuity.adherence.sessions_missed,
        summary: consistencyCopy(input.continuity.adherence),
      }
    : null;

  const recovery =
    input.volumeDecision?.recovery_state === "POOR" ||
    input.volumeDecision?.recovery_state === "LIMITED" ||
    input.volumeDecision?.action === "HOLD_VOLUME_PROGRESSION" ||
    input.goalDecision?.goal_response === "RECOVERY_LIMITED"
      ? mapVolumeAction("HOLD_VOLUME_PROGRESSION")
      : input.volumeDecision
        ? mapVolumeAction(input.volumeDecision.action)
        : input.continuity?.reconditioning_state
          ? mapVolumeAction("RECONDITIONING")
          : null;

  const adaptations: ClientTrainingProgressSummary["adaptations"] = [];
  if (input.programChange?.material) {
    adaptations.push({
      title: "تم تحديث خطتك",
      short_reason: programChangeReason(input, canonical),
      client_action: "ستلاحظ التركيز المحدّث في الحصص القادمة.",
      importance: "high",
    });
  }
  const volumeNote = input.volumeDecision ? mapVolumeAction(input.volumeDecision.action) : null;
  if (volumeNote && volumeNote.importance !== "low") adaptations.push(volumeNote);
  if (input.continuity && ["RESCHEDULE_SESSION", "DEFER_SESSION", "ENTER_RECONDITIONING", "ADVANCE_AFTER_PARTIAL"].includes(input.continuity.action)) {
    adaptations.push(mapContinuityAction(input.continuity.action));
  }
  const materialProgression = exercise_trends.find((item) => item.action === "INCREASE_LOAD" || item.action === "DECREASE_LOAD");
  if (materialProgression) adaptations.push(materialProgression.explanation);

  const nutrition_review =
    input.goalDecision?.nutrition_review_required || input.goalDecision?.goal_response === "NUTRITION_REVIEW_REQUIRED"
      ? {
          title: "جانب التغذية يحتاج مراجعة",
          short_reason: GOAL_COPY.NUTRITION,
          client_action: "هذا تنبيه للتنسيق مع خطة التغذية، وليس تعليمات سعرات أو وجبات.",
          importance: "normal" as const,
        }
      : null;

  const empty = !hasAnyHistory(input) && !input.goalDecision && !input.continuity;
  if (empty) {
    goalCard.title = "ابدأ أولى حصصك";
    goalCard.short_reason = "ابدأ أولى حصصك وسنبدأ بقياس تقدمك.";
    goalCard.client_action = "افتح برنامجك لبدء أول حصة.";
    goalCard.tone = "neutral";
    goalCard.status_key = "INSUFFICIENT_DATA";
  }

  return {
    version: TRAINING_PROGRESS_VERSION,
    empty,
    load_error: false,
    canonical_goal: canonical,
    goal_card: goalCard,
    exercise_trends,
    regional_cards,
    body_card,
    consistency,
    recovery,
    adaptations: dedupeAdaptations(adaptations),
    nutrition_review,
    review_flags: reviewFlags(input),
    forbidden_tokens: FORBIDDEN_CLIENT_PHRASES,
  };
}

function emptySummary(loadError: boolean): ClientTrainingProgressSummary {
  return {
    version: TRAINING_PROGRESS_VERSION,
    empty: !loadError,
    load_error: loadError,
    canonical_goal: null,
    goal_card: {
      title: loadError ? "تعذر تحميل تقدمك الآن" : "ابدأ أولى حصصك",
      short_reason: loadError ? "تعذر تحميل تقدمك الآن." : "ابدأ أولى حصصك وسنبدأ بقياس تقدمك.",
      client_action: loadError ? "يمكنك متابعة التمرين كالمعتاد." : "افتح برنامجك لبدء أول حصة.",
      importance: "normal",
      tone: "neutral",
      status_key: loadError ? "LOAD_ERROR" : "INSUFFICIENT_DATA",
    },
    exercise_trends: [],
    regional_cards: [],
    body_card: null,
    consistency: null,
    recovery: null,
    adaptations: [],
    nutrition_review: null,
    review_flags: [],
    forbidden_tokens: FORBIDDEN_CLIENT_PHRASES,
  };
}

function hasAnyHistory(input: TrainingProgressInput) {
  const adherence = input.continuity?.adherence;
  return Boolean(
    (adherence && adherence.sessions_completed + adherence.sessions_partial > 0) ||
      (input.progressionSamples && input.progressionSamples.length > 0),
  );
}

function toTrendCard(sample: NonNullable<TrainingProgressInput["progressionSamples"]>[number]): ExerciseTrendCard {
  const explanation = sample.action
    ? mapProgressionAction(sample.action, sample.reason_code)
    : {
        title: "تغير مسجّل في الأداء",
        short_reason: "نعرض الحمل/التكرارات/المدة كما سُجّلت. قرار التقدّم يأتي من محرك الجلسة التالية.",
        client_action: "افتح الحصة القادمة للمتابعة.",
        importance: "low" as const,
      };
  if (sample.is_bodyweight || (sample.from_load == null && sample.to_load == null && sample.from_reps != null)) {
    return {
      external_id: sample.external_id,
      name_ar: sample.name_ar,
      kind: "bodyweight_reps",
      from_label: formatReps(sample.from_reps) ?? "—",
      to_label: formatReps(sample.to_reps) ?? formatReps(sample.from_reps) ?? "—",
      improved: (sample.to_reps ?? 0) > (sample.from_reps ?? 0),
      action: sample.action,
      explanation,
    };
  }
  if (sample.from_duration != null || sample.to_duration != null) {
    return {
      external_id: sample.external_id,
      name_ar: sample.name_ar,
      kind: "duration",
      from_label: formatDuration(sample.from_duration) ?? "—",
      to_label: formatDuration(sample.to_duration) ?? formatDuration(sample.from_duration) ?? "—",
      improved: (sample.to_duration ?? 0) > (sample.from_duration ?? 0),
      action: sample.action,
      explanation,
    };
  }
  if (sample.from_load != null && sample.to_load != null && sample.from_load !== sample.to_load) {
    return {
      external_id: sample.external_id,
      name_ar: sample.name_ar,
      kind: "load",
      from_label: formatLoad(sample.from_load) ?? "—",
      to_label: formatLoad(sample.to_load) ?? "—",
      improved: sample.to_load > sample.from_load,
      action: sample.action,
      explanation,
    };
  }
  return {
    external_id: sample.external_id,
    name_ar: sample.name_ar,
    kind: "reps",
    from_label: formatReps(sample.from_reps) ?? "—",
    to_label: formatReps(sample.to_reps) ?? formatReps(sample.from_reps) ?? "—",
    improved: (sample.to_reps ?? 0) > (sample.from_reps ?? 0),
    action: sample.action,
    explanation,
  };
}

function regionalSummary(state: string, goal: ReturnType<typeof resolveCanonicalGoal>["canonicalId"], region: string) {
  if (state === "POSITIVE_FAST" || state === "POSITIVE_NORMAL") {
    if (region.includes("GLUTE")) return "الأداء في تمارين المؤخرة يتحسن.";
    if (region.includes("CORE")) return "قوة وثبات الجذع يتحسنان.";
    if (region.includes("BICEP") || region.includes("TRICEP")) return "أداء تمارين الذراعين يتحسن.";
    if (region.includes("BACK") || region.includes("LAT")) return "أداء تمارين الظهر/السحب يتحسن. هذا ليس تصحيحاً طبياً للقوام.";
    return "أداؤك في تمارين هذه المنطقة يتحسن.";
  }
  if (state === "POSITIVE_SLOW" || state === "STAGNANT") {
    if (goal === "GLUTE_GROWTH") return "الاستجابة الحالية أبطأ من المتوقع، لذلك عدّلنا توزيع التمرين.";
    if (goal === "TONED_ARMS_UPPER_BODY") return "الذراعان يتقدمان بوتيرة أبطأ حاليًا، لذلك عدّلنا توزيع التمرين.";
    return "الاستجابة الحالية أبطأ من المتوقع.";
  }
  if (state === "RECOVERY_LIMITED") return "نحتاج إلى مزيد من التعافي قبل رفع التركيز.";
  if (state === "INSUFFICIENT_DATA") return "نحتاج حصصًا إضافية قبل تقييم هذه المنطقة.";
  return "المتابعة مستمرة بناءً على أداء التمارين.";
}

function bodyCardFor(goal: ReturnType<typeof resolveCanonicalGoal>["canonicalId"], input: TrainingProgressInput) {
  const signals = goalSignals(goal);
  if (!signals.body) return null;
  if (input.goalDecision?.body_composition_data_required || !input.bodyTrends?.has_valid_weight && !input.bodyTrends?.has_valid_waist) {
    if (goal === "GLUTE_GROWTH") {
      return {
        show: true,
        title: "تكوين الجسم",
        summary: "تقدم الأداء جيد، ونحتاج بيانات إضافية لتأكيد التغير الجسدي.",
      };
    }
    if (goal === "SLIM_TONED_WAIST" || goal === "FAT_LOSS") {
      return {
        show: true,
        title: "تكوين الجسم",
        summary: "تغير الخصر يحتاج إلى متابعة بيانات تكوين الجسم. هذا منفصل عن تقدم تدريب الجذع.",
      };
    }
  }
  if (input.bodyTrends?.has_valid_waist || input.bodyTrends?.has_valid_weight) {
    return {
      show: true,
      title: "تكوين الجسم",
      summary: "نعرض اتجاه القياسات المسجّلة فقط. تقلبات يومية للوزن ليست نجاحًا أو فشلاً.",
    };
  }
  return null;
}

function consistencyCopy(adherence: { sessions_completed: number; sessions_prescribed: number; sessions_partial: number }) {
  const done = adherence.sessions_completed;
  const total = Math.max(adherence.sessions_prescribed, done);
  if (adherence.sessions_partial > 0) {
    return `أكملت ${done} حصصًا كاملة، وحفظنا ${adherence.sessions_partial} حصة جزئية.`;
  }
  if (total === 0) return "لم نبدأ قياس الانتظام بعد.";
  return `أكملت ${done} من آخر ${total} حصص.`;
}

function programChangeReason(input: TrainingProgressInput, goal: ReturnType<typeof resolveCanonicalGoal>["canonicalId"]) {
  if (input.goalDecision?.reallocation) {
    return reallocationCopy(input.goalDecision.reallocation.from_region, input.goalDecision.reallocation.to_region, goal);
  }
  return `تم تحديث خطتك (${goalDisplayName(goal)}).`;
}

function reviewFlags(input: TrainingProgressInput): ClientTrainingProgressSummary["review_flags"] {
  const flags: ClientTrainingProgressSummary["review_flags"] = [];
  const push = (code: string, severity: "safety" | "high" | "normal", label_ar: string, open: boolean) => {
    if (open) flags.push({ code, severity, label_ar, open });
  };
  push("SAFETY_REVIEW_REQUIRED", "safety", "مراجعة سلامة", input.goalDecision?.limiting_factor === "SAFETY");
  push(
    "PROGRAM_REVIEW_REQUIRED",
    "high",
    "مراجعة برنامج",
    input.goalDecision?.action === "PROGRAM_REVIEW_REQUIRED" || input.continuity?.action === "PROGRAM_REVIEW_REQUIRED",
  );
  push("SCHEDULE_REVIEW_REQUIRED", "high", "مراجعة جدول", input.continuity?.action === "SCHEDULE_REVIEW_REQUIRED");
  push(
    "NUTRITION_REVIEW_REQUIRED",
    "normal",
    "مراجعة تغذية",
    Boolean(input.goalDecision?.nutrition_review_required) || input.goalDecision?.goal_response === "NUTRITION_REVIEW_REQUIRED",
  );
  push("COACH_REVIEW_REQUIRED", "high", "مراجعة مدرب", input.goalDecision?.action === "COACH_REVIEW_REQUIRED");
  return flags;
}

function dedupeAdaptations(rows: ClientTrainingProgressSummary["adaptations"]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.title}:${row.short_reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
