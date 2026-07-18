import type { TodayWorkoutPrescription } from "@/lib/platform/today-workout";
import { TODAY_WORKOUT_PRESCRIPTIONS } from "@/lib/platform/today-workout";
import { isWorkoutCompletedOnDate } from "@/lib/platform/platform-activity";

export type WeekdayId = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type WeekDayStatus = "done" | "today" | "upcoming" | "rest";

export type WeekDayEntry = {
  id: WeekdayId;
  shortName: string;
  dayName: string;
  dateLabel: string;
  dateKey: string;
  calendarDate: Date;
  targetMuscle: string;
  status: WeekDayStatus;
  isRestDay: boolean;
};

export type WeekdayWorkoutPlan = {
  id: WeekdayId;
  muscleTitle: string;
  targetMuscle: string;
  isRestDay: boolean;
  prescriptions: TodayWorkoutPrescription[];
  durationMin: number;
  calories: number;
  points: number;
};

const WEEKDAY_IDS: WeekdayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const WEEKDAY_NAMES: Record<WeekdayId, { shortName: string; dayName: string }> = {
  sun: { shortName: "الأحد", dayName: "الأحد" },
  mon: { shortName: "الإثنين", dayName: "الإثنين" },
  tue: { shortName: "الثلاثاء", dayName: "الثلاثاء" },
  wed: { shortName: "الأربعاء", dayName: "الأربعاء" },
  thu: { shortName: "الخميس", dayName: "الخميس" },
  fri: { shortName: "الجمعة", dayName: "الجمعة" },
  sat: { shortName: "السبت", dayName: "السبت" },
};

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

const LEG_DAY: TodayWorkoutPrescription[] = [
  { external_id: "CH-010", sets: 4, reps: "12 - 15", rest_seconds: 90, suggested_weight_kg: 50 },
  { external_id: "TR-001", sets: 3, reps: "10 - 12", rest_seconds: 75, suggested_weight_kg: 60 },
  { external_id: "CH-007", sets: 3, reps: "12", rest_seconds: 60, suggested_weight_kg: 20 },
];

const SHOULDER_DAY: TodayWorkoutPrescription[] = [
  { external_id: "CH-007", sets: 4, reps: "10 - 12", rest_seconds: 90, suggested_weight_kg: 14 },
  { external_id: "BI-002", sets: 3, reps: "12 - 15", rest_seconds: 75, suggested_weight_kg: 12 },
  { external_id: "TR-001", sets: 3, reps: "12", rest_seconds: 60, suggested_weight_kg: 16 },
];

const BACK_DAY: TodayWorkoutPrescription[] = [
  { external_id: "BI-003", sets: 4, reps: "8 - 10", rest_seconds: 90, suggested_weight_kg: 35 },
  { external_id: "TR-001", sets: 3, reps: "10 - 12", rest_seconds: 75, suggested_weight_kg: 22 },
  { external_id: "CH-001", sets: 3, reps: "12", rest_seconds: 60, suggested_weight_kg: 30 },
];

const ARMS_DAY: TodayWorkoutPrescription[] = [
  { external_id: "BI-002", sets: 4, reps: "10 - 12", rest_seconds: 75, suggested_weight_kg: 12 },
  { external_id: "BI-003", sets: 3, reps: "12 - 15", rest_seconds: 60, suggested_weight_kg: 10 },
  { external_id: "CH-010", sets: 3, reps: "12", rest_seconds: 60, suggested_weight_kg: 14 },
];

export const WEEKDAY_WORKOUT_PLANS: Record<WeekdayId, WeekdayWorkoutPlan> = {
  sun: {
    id: "sun",
    muscleTitle: "يوم راحة",
    targetMuscle: "راحة",
    isRestDay: true,
    prescriptions: [],
    durationMin: 0,
    calories: 0,
    points: 0,
  },
  mon: {
    id: "mon",
    muscleTitle: "صدر + بايسبس",
    targetMuscle: "صدر",
    isRestDay: false,
    prescriptions: TODAY_WORKOUT_PRESCRIPTIONS,
    durationMin: 45,
    calories: 450,
    points: 120,
  },
  tue: {
    id: "tue",
    muscleTitle: "رجل",
    targetMuscle: "رجل",
    isRestDay: false,
    prescriptions: LEG_DAY,
    durationMin: 50,
    calories: 520,
    points: 110,
  },
  wed: {
    id: "wed",
    muscleTitle: "أكتاف",
    targetMuscle: "أكتاف",
    isRestDay: false,
    prescriptions: SHOULDER_DAY,
    durationMin: 40,
    calories: 380,
    points: 100,
  },
  thu: {
    id: "thu",
    muscleTitle: "ظهر",
    targetMuscle: "ظهر",
    isRestDay: false,
    prescriptions: BACK_DAY,
    durationMin: 42,
    calories: 410,
    points: 105,
  },
  fri: {
    id: "fri",
    muscleTitle: "بايسبس + ترايسبس",
    targetMuscle: "بايسبس",
    isRestDay: false,
    prescriptions: ARMS_DAY,
    durationMin: 38,
    calories: 340,
    points: 95,
  },
  sat: {
    id: "sat",
    muscleTitle: "يوم راحة",
    targetMuscle: "راحة",
    isRestDay: true,
    prescriptions: [],
    durationMin: 0,
    calories: 0,
    points: 0,
  },
};

function dateKeyFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeekSunday(date: Date) {
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function getWeekdayIdFromDate(date = new Date()): WeekdayId {
  return WEEKDAY_IDS[date.getDay()] ?? "sun";
}

export function getWeekdayPlan(dayId: WeekdayId): WeekdayWorkoutPlan {
  return WEEKDAY_WORKOUT_PLANS[dayId];
}

/** First chest exercise — the only unlocked slot for free members. */
export const FREE_MEMBER_UNLOCKED_EXTERNAL_ID = "CH-001";

const FREE_CHEST_PREVIEW: TodayWorkoutPrescription = {
  external_id: FREE_MEMBER_UNLOCKED_EXTERNAL_ID,
  sets: 4,
  reps: "10 - 12",
  rest_seconds: 90,
  suggested_weight_kg: 40,
};

/**
 * Free members never see rest days: always a workout preview with chest first (unlocked).
 * Paid members get the canonical weekly plan including rest days.
 */
export function resolveWeekdayPlan(
  dayId: WeekdayId,
  hasWorkoutProgram: boolean,
): WeekdayWorkoutPlan {
  const base = WEEKDAY_WORKOUT_PLANS[dayId];
  if (hasWorkoutProgram) return base;

  const sourcePrescriptions =
    base.isRestDay || base.prescriptions.length === 0
      ? TODAY_WORKOUT_PRESCRIPTIONS
      : base.prescriptions;

  const tail = sourcePrescriptions.filter(
    (item) => item.external_id !== FREE_MEMBER_UNLOCKED_EXTERNAL_ID,
  );

  return {
    ...base,
    isRestDay: false,
    muscleTitle: base.isRestDay ? "صدر" : base.muscleTitle,
    targetMuscle: base.isRestDay ? "صدر" : base.targetMuscle,
    prescriptions: [FREE_CHEST_PREVIEW, ...tail].slice(0, 6),
    durationMin: base.isRestDay ? 45 : base.durationMin || 45,
    calories: base.isRestDay ? 450 : base.calories || 400,
    points: base.isRestDay ? 120 : base.points || 100,
  };
}

export function isFreeUnlockedExerciseIndex(orderIndex: number) {
  return orderIndex === 0;
}

export function formatWorkoutDayLabel(date: Date, dayName: string) {
  return `${dayName} ${date.getDate()} ${AR_MONTHS[date.getMonth()]}`;
}

export function buildWeeklySchedule(input?: {
  referenceDate?: Date;
  userId?: string;
  freeMember?: boolean;
}): WeekDayEntry[] {
  const referenceDate = input?.referenceDate ?? new Date();
  const todayKey = dateKeyFromDate(referenceDate);
  const weekStart = startOfWeekSunday(referenceDate);
  const userId = input?.userId ?? "guest";
  const freeMember = input?.freeMember ?? false;

  return WEEKDAY_IDS.map((id, index) => {
    const calendarDate = new Date(weekStart);
    calendarDate.setDate(weekStart.getDate() + index);
    const dateKey = dateKeyFromDate(calendarDate);
    const plan = WEEKDAY_WORKOUT_PLANS[id];
    const displayPlan = freeMember ? resolveWeekdayPlan(id, false) : plan;
    const names = WEEKDAY_NAMES[id];
    const isToday = dateKey === todayKey;
    const isPast = dateKey < todayKey;

    let status: WeekDayStatus = "upcoming";
    if (displayPlan.isRestDay) {
      status = "rest";
    } else if (isToday) {
      status = "today";
    } else if (isPast && isWorkoutCompletedOnDate(userId, dateKey)) {
      status = "done";
    } else if (isPast) {
      status = "upcoming";
    }

    return {
      id,
      shortName: names.shortName,
      dayName: names.dayName,
      dateLabel: String(calendarDate.getDate()),
      dateKey,
      calendarDate,
      targetMuscle: displayPlan.targetMuscle,
      status,
      isRestDay: displayPlan.isRestDay,
    };
  });
}
