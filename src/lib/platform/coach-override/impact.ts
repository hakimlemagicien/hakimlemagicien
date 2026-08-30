import { WEEKDAY_TO_ISO, type WeekdayId } from "@/lib/platform/training-assignment";
import { normalizePreferredTrainingDays, sortWeekdays } from "@/lib/platform/strategy-matrix/weekdays";
import type { CoachOverrideRequest, OverrideImpactItem } from "./types";

function hasConsecutiveTrainingDays(days: WeekdayId[]): boolean {
  const sorted = sortWeekdays(days);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = WEEKDAY_TO_ISO[sorted[i - 1]!];
    const curr = WEEKDAY_TO_ISO[sorted[i]!];
    if (curr === prev + 1 || (prev === 7 && curr === 1)) return true;
  }
  return false;
}

export function analyzePreferredWeekdayImpact(
  request: CoachOverrideRequest,
  currentDays: WeekdayId[] | null | undefined,
): OverrideImpactItem[] {
  const impacts: OverrideImpactItem[] = [];
  if (request.overrideType !== "PREFERRED_WEEKDAYS_CHANGE") return impacts;

  const proposed = (request.payload as { preferredWeekdays: WeekdayId[] }).preferredWeekdays;
  const normalized = normalizePreferredTrainingDays(proposed);

  impacts.push({
    dimension: "RECOVERY_SPACING",
    severity: "INFO",
    code: "PREFERRED_WEEKDAYS_UPDATED",
    detail: `الأيام المقترحة: ${normalized.days.join(", ") || "—"}`,
  });

  for (const warning of normalized.warnings) {
    impacts.push({
      dimension: "RECOVERY_SPACING",
      severity: "WARNING",
      code: warning,
      detail: warning,
    });
  }

  if (hasConsecutiveTrainingDays(normalized.days)) {
    impacts.push({
      dimension: "RECOVERY_SPACING",
      severity: "WARNING",
      code: "CONSECUTIVE_TRAINING_DAYS",
      detail: "يوجد يومان تدريبيان متتاليان — قد يتأثر التعافي.",
    });
  }

  if (currentDays?.length && normalized.days.length !== currentDays.length) {
    impacts.push({
      dimension: "WEEKLY_FREQUENCY",
      severity: "WARNING",
      code: "WEEKDAY_COUNT_CHANGED",
      detail: "عدد أيام التفضيل يختلف عن التكرار الحالي — تحقق من عدد أيام الأسبوع.",
    });
  }

  return impacts;
}

export function analyzeFrequencyImpact(
  request: CoachOverrideRequest,
  currentFrequency: number | null | undefined,
): OverrideImpactItem[] {
  if (
    request.overrideType !== "TRAINING_FREQUENCY_CHANGE" &&
    request.overrideType !== "TRAINING_DAYS_CHANGE"
  ) {
    return [];
  }
  const next = (request.payload as { trainingDaysPerWeek: number }).trainingDaysPerWeek;
  const impacts: OverrideImpactItem[] = [
    {
      dimension: "WEEKLY_FREQUENCY",
      severity: "WARNING",
      code: "FREQUENCY_CHANGE_REQUIRES_REGENERATION",
      detail: `تغيير التكرار من ${currentFrequency ?? "—"} إلى ${next} أيام/أسبوع.`,
    },
    {
      dimension: "TOTAL_VOLUME",
      severity: "WARNING",
      code: "VOLUME_REDISTRIBUTION",
      detail: "إعادة توزيع الحجم الأسبوعي عبر الجلسات.",
    },
    {
      dimension: "GOAL_EMPHASIS",
      severity: "INFO",
      code: "GOAL_EMPHASIS_MAY_SHIFT",
      detail: "قد يتغيّر تركيز الهدف بعد إعادة التوليد.",
    },
    {
      dimension: "CONTINUITY",
      severity: "INFO",
      code: "CONTINUITY_PRESERVED",
      detail: "الجلسات المكتملة السابقة تبقى في السجل — لا دين تعويضي.",
    },
  ];
  return impacts;
}

export function analyzeDurationImpact(
  request: CoachOverrideRequest,
  currentMinutes: number | null | undefined,
): OverrideImpactItem[] {
  if (request.overrideType !== "SESSION_DURATION_CHANGE") return [];
  const next = (request.payload as { sessionDurationMinutes: number }).sessionDurationMinutes;
  const severity = next < (currentMinutes ?? next) ? "WARNING" : "INFO";
  return [
    {
      dimension: "SESSION_DURATION",
      severity,
      code: "SESSION_DURATION_CHANGE",
      detail: `مدة الجلسة: ${currentMinutes ?? "—"} → ${next} دقيقة.`,
    },
    {
      dimension: "MOVEMENT_COVERAGE",
      severity: "WARNING",
      code: "SESSION_TRIM_OR_REBUILD",
      detail: "المحرك يعيد بناء/التحقق من الجلسة وفق مدة الجلسة.",
    },
  ];
}

export function analyzeLocationImpact(request: CoachOverrideRequest): OverrideImpactItem[] {
  if (
    request.overrideType !== "TRAINING_LOCATION_CHANGE" &&
    request.overrideType !== "TEMPORARY_CONSTRAINT"
  ) {
    return [];
  }
  return [
    {
      dimension: "LOCATION_ELIGIBILITY",
      severity: "WARNING",
      code: "LOCATION_POOL_CHANGE",
      detail: "تغيير البيئة يعيد تصفية Core 100 حسب HOME/GYM.",
    },
    {
      dimension: "EQUIPMENT_ELIGIBILITY",
      severity: "WARNING",
      code: "EQUIPMENT_CONTEXT_REVIEW",
      detail: "يجب أن تتوافق المعدات مع البيئة الجديدة.",
    },
  ];
}

export function analyzeEquipmentImpact(request: CoachOverrideRequest): OverrideImpactItem[] {
  if (
    request.overrideType !== "AVAILABLE_EQUIPMENT_CHANGE" &&
    request.overrideType !== "TEMPORARY_CONSTRAINT"
  ) {
    return [];
  }
  return [
    {
      dimension: "EQUIPMENT_ELIGIBILITY",
      severity: "WARNING",
      code: "EQUIPMENT_OVERRIDE",
      detail: "تغيير المعدات المتاحة قد يستبعد أو يستبدل تماريناً.",
    },
    {
      dimension: "EXERCISE_SUBSTITUTION",
      severity: "INFO",
      code: "SUBSTITUTION_MAY_OCCUR",
      detail: "قد يقترح المحرك بدائل عند نقص التغطية.",
    },
  ];
}

export function analyzeExclusionImpact(request: CoachOverrideRequest): OverrideImpactItem[] {
  if (request.overrideType !== "EXERCISE_EXCLUDE") return [];
  const externalId = (request.payload as { externalId: string }).externalId;
  return [
    {
      dimension: "EXERCISE_SUBSTITUTION",
      severity: "WARNING",
      code: "EXERCISE_EXCLUDED",
      detail: `استبعاد ${externalId} — يجب الحفاظ على تغطية الحركة.`,
    },
    {
      dimension: "MOVEMENT_COVERAGE",
      severity: "WARNING",
      code: "MOVEMENT_REBALANCE_REQUIRED",
      detail: "إعادة التوليد مطلوبة لملء الفجوة.",
    },
  ];
}
