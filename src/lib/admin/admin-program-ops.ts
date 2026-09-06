import { summarizeSessionMuscles } from "@/lib/platform/session-muscle-presentation";
import { WEEKDAY_CALENDAR_ORDER } from "@/lib/platform/strategy-matrix/weekdays";
import { WEEKDAY_LABELS_AR } from "@/lib/admin/coach-override-form";
import type { AdminProgramDay, AdminProgramDetail, AdminProgramListItem, AdminProgramWeek } from "@/lib/admin/admin-programs-api";

export const PROGRAM_LOCATIONS = ["HOME", "GYM", "BOTH"] as const;
export type ProgramLocation = (typeof PROGRAM_LOCATIONS)[number];

export type TemplateCompatibilityStatus = "SAFE" | "REVIEW" | "HIGH_IMPACT";

export type TemplateCompatibilityResult = {
  status: TemplateCompatibilityStatus;
  reasons: string[];
  recommendations: string[];
};

export function programLocationLabel(location: ProgramLocation | null | undefined): string {
  if (location === "HOME") return "منزل";
  if (location === "GYM") return "نادي";
  if (location === "BOTH") return "منزل ونادي";
  return "غير محدد";
}

export function templateLocationFromMetadata(metadata: unknown): ProgramLocation | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = String((metadata as { training_location?: unknown }).training_location ?? "")
    .trim()
    .toUpperCase();
  if (value === "HOME" || value === "GYM" || value === "BOTH") return value;
  return null;
}

export function sessionMinutesFromMetadata(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = Number((metadata as { session_minutes?: unknown }).session_minutes);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function equipmentFromMetadata(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const value = (metadata as { equipment?: unknown }).equipment;
  return typeof value === "string" ? value : "";
}

export function versionGroupIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as { version_group_id?: unknown }).version_group_id;
  return typeof value === "string" && value.trim() ? value : null;
}

export function countWorkoutDays(days: Array<{ day_type: string }>): number {
  return days.filter((day) => day.day_type === "workout").length;
}

export function weekMatchesDaysPerWeek(
  days: Array<{ day_type: string }>,
  daysPerWeek: number,
): boolean {
  return countWorkoutDays(days) === daysPerWeek;
}

export function buildSevenDayWeek(daysPerWeek: number): AdminProgramDay[] {
  const target = Math.min(Math.max(Math.trunc(daysPerWeek) || 3, 2), 5);
  const workoutSlots = new Set(
    WEEKDAY_CALENDAR_ORDER.filter((_, index) => {
      if (target === 2) return index === 1 || index === 4;
      if (target === 3) return index === 1 || index === 3 || index === 5;
      if (target === 4) return index === 1 || index === 2 || index === 4 || index === 5;
      return index >= 1 && index <= 5;
    }),
  );

  return WEEKDAY_CALENDAR_ORDER.map((weekday, index) => {
    const workout = workoutSlots.has(weekday);
    return {
      day_number: index + 1,
      day_type: workout ? "workout" : "rest",
      title_ar: workout ? WEEKDAY_LABELS_AR[weekday] : `${WEEKDAY_LABELS_AR[weekday]} — راحة`,
      muscle_focus: workout ? "" : null,
      estimated_minutes: workout ? 45 : 0,
      estimated_calories: null,
      exercises: [],
    };
  });
}

export function sessionPresentationForDay(day: {
  day_type: string;
  title_ar?: string | null;
  muscle_focus?: string | null;
  exercises: Array<{ exercise_external_id?: string | null; exercise_name_ar?: string | null }>;
}): { displayNameAr: string; visualKey: string; exerciseCount: number } {
  if (day.day_type !== "workout") {
    return { displayNameAr: "راحة", visualKey: "REST", exerciseCount: 0 };
  }
  const summary = summarizeSessionMuscles({
    externalIds: day.exercises
      .map((exercise) => exercise.exercise_external_id)
      .filter((id): id is string => Boolean(id)),
    muscleFocus: day.muscle_focus,
  });
  return {
    displayNameAr: summary.displayNameAr || day.title_ar || "حصة تدريب",
    visualKey: summary.visualKey,
    exerciseCount: day.exercises.length,
  };
}

export function mapClientTrainingLocation(trainingType: string | null | undefined): ProgramLocation {
  const value = String(trainingType ?? "").toLowerCase();
  if (value.includes("gym") && value.includes("home")) return "BOTH";
  if (value.includes("gym") || value === "gym_only") return "GYM";
  return "HOME";
}

export function mapClientGoalToProgramGoal(goal: string | null | undefined): string | null {
  const value = String(goal ?? "").toLowerCase();
  if (!value) return null;
  if (value.includes("cut") || value.includes("loss") || value.includes("fat") || value.includes("تنشيف")) return "cut";
  if (value.includes("bulk") || value.includes("gain") || value.includes("تضخيم")) return "bulk";
  if (value.includes("recomp") || value.includes("تركيب")) return "recomp";
  if (value.includes("fit") || value.includes("لياقة")) return "fitness";
  return value;
}

export function assessTemplateCompatibility(input: {
  template: Pick<AdminProgramListItem, "goal" | "level" | "days_per_week"> & {
    training_location?: ProgramLocation | null;
    weeks?: AdminProgramDetail["weeks"];
  };
  client: {
    goal?: string | null;
    level?: string | null;
    trainingType?: string | null;
    daysPerWeek?: number | null;
  };
}): TemplateCompatibilityResult {
  const reasons: string[] = [];
  const recommendations: string[] = [];
  const clientGoal = mapClientGoalToProgramGoal(input.client.goal);
  const clientLocation = mapClientTrainingLocation(input.client.trainingType);
  const templateLocation = input.template.training_location ?? null;
  const week = input.template.weeks?.[0]?.days ?? [];

  if (week.length > 0 && !weekMatchesDaysPerWeek(week, input.template.days_per_week)) {
    reasons.push("عدد أيام التدريب في الأسبوع المبني لا يطابق تعريف القالب.");
    recommendations.push("اضبط أيام التدريب/الراحة قبل التعيين.");
  }

  if (clientGoal && input.template.goal && clientGoal !== input.template.goal) {
    reasons.push("هدف القالب لا يطابق هدف العميل.");
    recommendations.push("اختر قالباً بنفس الهدف أو ولّد البرنامج من Strategy Matrix.");
  }

  const clientLevel = String(input.client.level ?? "").toLowerCase();
  const templateLevel = String(input.template.level ?? "").toLowerCase();
  if (clientLevel && templateLevel && !clientLevel.includes(templateLevel) && !templateLevel.includes(clientLevel.replace("unassessed", ""))) {
    if (clientLevel !== "unassessed") {
      reasons.push("مستوى القالب لا يطابق مستوى العميل.");
    }
  }

  if (
    typeof input.client.daysPerWeek === "number" &&
    input.client.daysPerWeek > 0 &&
    input.client.daysPerWeek !== input.template.days_per_week
  ) {
    reasons.push("عدد أيام التدريب في القالب لا يطابق تقويم العميل.");
    recommendations.push("لا تعيّن قالباً يخلق أيام تدريب إضافية. استخدم Matrix أو قالباً بنفس التكرار.");
  }

  if (templateLocation && templateLocation !== "BOTH" && templateLocation !== clientLocation && clientLocation !== "BOTH") {
    reasons.push("بيئة القالب (منزل/نادي) لا تطابق بيئة العميل.");
    recommendations.push("اختر قالباً متوافقاً مع معدات ومكان تدريب العميل.");
  }

  const highImpact = reasons.some(
    (reason) => reason.includes("أيام") || reason.includes("بيئة") || reason.includes("يخلق"),
  );
  const status: TemplateCompatibilityStatus = reasons.length === 0 ? "SAFE" : highImpact ? "HIGH_IMPACT" : "REVIEW";
  if (status === "SAFE") recommendations.push("القالب متوافق مع بيانات العميل الحالية.");
  return { status, reasons, recommendations };
}

export function compatibilityStatusLabel(status: TemplateCompatibilityStatus): string {
  if (status === "SAFE") return "متوافق";
  if (status === "REVIEW") return "يحتاج مراجعة";
  return "أثر مرتفع";
}

export function rebuildWeekKeepingWorkouts(week: AdminProgramWeek, daysPerWeek: number): AdminProgramWeek {
  const workouts = week.days.filter((day) => day.day_type === "workout");
  const skeleton = buildSevenDayWeek(daysPerWeek);
  let workoutIndex = 0;
  return {
    ...week,
    days: skeleton.map((day) => {
      if (day.day_type !== "workout") return day;
      const existing = workouts[workoutIndex++];
      if (!existing) return day;
      return {
        ...day,
        title_ar: existing.title_ar || day.title_ar,
        muscle_focus: existing.muscle_focus,
        estimated_minutes: existing.estimated_minutes ?? day.estimated_minutes,
        estimated_calories: existing.estimated_calories,
        exercises: existing.exercises,
      };
    }),
  };
}

export type ClientProgramEditImpact = {
  status: TemplateCompatibilityStatus;
  reasons: string[];
  replacements: Array<{ from: string; to: string }>;
  added: number;
  removed: number;
  emptyWorkoutDays: boolean;
};

export function assessClientProgramEditImpact(input: {
  beforeDays: Array<{
    day_type: string;
    exercises: Array<{ exercise_id: string | null; exercise_name_ar?: string | null; exercise_external_id?: string | null }>;
  }>;
  afterDays: Array<{
    day_type: string;
    exercises: Array<{ exercise_id: string | null; exercise_name_ar?: string | null; exercise_external_id?: string | null }>;
  }>;
}): ClientProgramEditImpact {
  const before = input.beforeDays.flatMap((day) => day.exercises);
  const after = input.afterDays.flatMap((day) => day.exercises);
  const beforeIds = before.map((row) => row.exercise_id).filter(Boolean) as string[];
  const afterIds = after.map((row) => row.exercise_id).filter(Boolean) as string[];
  const removed = beforeIds.filter((id) => !afterIds.includes(id)).length;
  const added = afterIds.filter((id) => !beforeIds.includes(id)).length;
  const replacements: Array<{ from: string; to: string }> = [];
  const pairCount = Math.min(input.beforeDays.length, input.afterDays.length);
  for (let i = 0; i < pairCount; i += 1) {
    const beforeEx = input.beforeDays[i]?.exercises ?? [];
    const afterEx = input.afterDays[i]?.exercises ?? [];
    const slots = Math.min(beforeEx.length, afterEx.length);
    for (let j = 0; j < slots; j += 1) {
      const fromId = beforeEx[j]?.exercise_id;
      const toId = afterEx[j]?.exercise_id;
      if (fromId && toId && fromId !== toId) {
        replacements.push({
          from: beforeEx[j]?.exercise_name_ar || beforeEx[j]?.exercise_external_id || fromId,
          to: afterEx[j]?.exercise_name_ar || afterEx[j]?.exercise_external_id || toId,
        });
      }
    }
  }
  const emptyWorkoutDays = input.afterDays.some((day) => day.day_type === "workout" && day.exercises.length === 0);
  const reasons: string[] = [];
  if (emptyWorkoutDays) reasons.push("حصة تدريب بلا تمارين.");
  if (removed) reasons.push("تم حذف تمرين من برنامج العميل.");
  if (added) reasons.push("تم إضافة تمرين إلى برنامج العميل.");
  if (replacements.length) reasons.push("تم استبدال تمرين داخل الحصة.");
  const highImpact = emptyWorkoutDays || removed > 1 || added > 1 || replacements.length >= 3;
  const status: TemplateCompatibilityStatus = emptyWorkoutDays
    ? "HIGH_IMPACT"
    : reasons.length === 0
      ? "SAFE"
      : highImpact
        ? "HIGH_IMPACT"
        : "REVIEW";
  return { status, reasons, replacements, added, removed, emptyWorkoutDays };
}
