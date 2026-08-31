import type { CoachOverridePayload, CoachOverrideType } from "@/lib/platform/coach-override/types";
import type { PreferredWeekdayId } from "@/lib/platform/strategy-matrix/weekdays";
import type { TrainingStrategyLocation } from "@/lib/platform/strategy-matrix/types";

export const COACH_OVERRIDE_EQUIPMENT_OPTIONS = [
  "DUMBBELLS",
  "RESISTANCE_BAND",
  "MAT",
  "PULL_UP_BAR",
  "KETTLEBELL",
  "BENCH",
  "BARBELL",
] as const;

export const WEEKDAY_LABELS_AR: Record<PreferredWeekdayId, string> = {
  sun: "الأحد",
  mon: "الاثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
  sat: "السبت",
};

export type CoachOverrideFormState = {
  overrideDays: string;
  overrideDuration: string;
  overrideExerciseFrom: string;
  overrideExerciseTo: string;
  overrideLocation: TrainingStrategyLocation;
  overridePreferredWeekdays: PreferredWeekdayId[];
  overrideEquipment: string[];
  overrideConstraintEnv: "home" | "gym" | "anywhere";
  overrideConstraintEquipment: string[];
  overrideConstraintUntil: string;
};

export function buildCoachOverridePayload(
  overrideType: CoachOverrideType,
  form: CoachOverrideFormState,
): CoachOverridePayload {
  const days = Number(form.overrideDays);
  switch (overrideType) {
    case "TRAINING_FREQUENCY_CHANGE":
    case "TRAINING_DAYS_CHANGE":
      return { trainingDaysPerWeek: Number.isFinite(days) ? days : 3 };
    case "SESSION_DURATION_CHANGE":
      return { sessionDurationMinutes: Number(form.overrideDuration) || 45 };
    case "EXERCISE_REPLACE":
      return { fromExternalId: form.overrideExerciseFrom, toExternalId: form.overrideExerciseTo };
    case "EXERCISE_EXCLUDE":
    case "EXERCISE_LOCK":
      return { externalId: form.overrideExerciseFrom };
    case "TRAINING_LOCATION_CHANGE":
      return { trainingLocation: form.overrideLocation };
    case "TEMPORARY_CONSTRAINT":
      return {
        trainingEnvironment: form.overrideConstraintEnv,
        availableEquipment: form.overrideConstraintEquipment.length
          ? form.overrideConstraintEquipment
          : null,
        validUntil: form.overrideConstraintUntil || null,
      };
    case "PREFERRED_WEEKDAYS_CHANGE":
      return { preferredWeekdays: form.overridePreferredWeekdays };
    case "AVAILABLE_EQUIPMENT_CHANGE":
      return {
        availableEquipment: form.overrideEquipment.length ? form.overrideEquipment : null,
      };
    default:
      return { sessionDurationMinutes: Number(form.overrideDuration) || 45 };
  }
}
