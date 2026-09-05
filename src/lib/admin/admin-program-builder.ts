import type {
  AdminProgramDay,
  AdminProgramDetail,
  AdminProgramExercise,
  AdminProgramWeek,
} from "@/lib/admin/admin-programs-api";
import {
  buildSevenDayWeek,
  countWorkoutDays,
  sessionPresentationForDay,
  weekMatchesDaysPerWeek,
} from "@/lib/admin/admin-program-ops";
import type { SessionMuscleRegion } from "@/lib/platform/session-muscle-presentation";
import { summarizeSessionMuscles } from "@/lib/platform/session-muscle-presentation";

export const EXERCISE_ROLES = ["warmup", "main", "accessory", "finisher"] as const;
export type ExerciseRole = (typeof EXERCISE_ROLES)[number];

export const EXERCISE_PATTERNS = ["none", "superset", "circuit", "dropset"] as const;
export type ExercisePattern = (typeof EXERCISE_PATTERNS)[number];

export const SECONDS_PER_REP = 3;

export type ExerciseAlternative = {
  exercise_id: string;
  name_ar: string;
  name_en?: string;
  external_id: string;
};

export type DayClipboard = {
  title_ar: string;
  muscle_focus: string | null;
  notes_ar: string | null;
  exercises: AdminProgramExercise[];
};

export type BuilderExerciseRecord = {
  week: number;
  day: number;
  sort: number;
  rir?: number | null;
  tempo?: string | null;
  role?: ExerciseRole | null;
  pattern?: ExercisePattern | null;
  pattern_group?: string | null;
  alternatives?: ExerciseAlternative[];
};

export type BuilderDayRecord = {
  week: number;
  day: number;
  notes_ar: string | null;
};

export type BuilderMetadata = {
  cover_image_url?: string;
  coach_notes?: string;
  progression_notes?: string;
  days?: BuilderDayRecord[];
  exercises?: BuilderExerciseRecord[];
};

const REGION_LABEL_AR: Record<SessionMuscleRegion, string> = {
  CHEST: "صدر",
  UPPER_BACK: "ظهر",
  LATS: "ظهر",
  SHOULDERS: "كتف",
  BICEPS: "باي",
  TRICEPS: "تراي",
  QUADRICEPS: "أرجل",
  HAMSTRINGS: "أرجل",
  GLUTES: "أرجل",
  CALVES: "أرجل",
  CORE: "بطن",
};

export function isExerciseRole(value: unknown): value is ExerciseRole {
  return EXERCISE_ROLES.includes(value as ExerciseRole);
}

export function isExercisePattern(value: unknown): value is ExercisePattern {
  return EXERCISE_PATTERNS.includes(value as ExercisePattern);
}

export function exerciseRoleLabel(role: ExerciseRole | null | undefined): string {
  if (role === "warmup") return "إحماء";
  if (role === "accessory") return "مساعد";
  if (role === "finisher") return "ختام";
  return "أساسي";
}

export function exercisePatternLabel(pattern: ExercisePattern | null | undefined): string {
  if (pattern === "superset") return "سوبرست";
  if (pattern === "circuit") return "دائرة";
  if (pattern === "dropset") return "دروب ست";
  return "عادي";
}

export function slugFromProgramName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const slug = trimmed
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `program-${Date.now().toString(36)}`;
}

export function parseRepsInput(raw: string): Pick<AdminProgramExercise, "reps_min" | "reps_max" | "reps_label"> {
  const value = raw.trim();
  if (!value) return { reps_min: null, reps_max: null, reps_label: "" };
  const range = value.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return { reps_min: min, reps_max: max, reps_label: `${min}-${max}` };
  }
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    return { reps_min: n, reps_max: n, reps_label: String(n) };
  }
  return { reps_min: null, reps_max: null, reps_label: value };
}

export function formatReps(exercise: Pick<AdminProgramExercise, "reps_min" | "reps_max" | "reps_label">): string {
  if (exercise.reps_label?.trim() && (exercise.reps_min == null || exercise.reps_max == null)) {
    return exercise.reps_label.trim();
  }
  if (exercise.reps_min != null && exercise.reps_max != null && exercise.reps_min !== exercise.reps_max) {
    return `${exercise.reps_min}-${exercise.reps_max}`;
  }
  if (exercise.reps_min != null) return String(exercise.reps_min);
  if (exercise.reps_max != null) return String(exercise.reps_max);
  return exercise.reps_label?.trim() || "";
}

export function parseRestInput(raw: string): number {
  const value = raw.trim().replace(/s$/i, "").replace(/ث(انية)?$/, "").trim();
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function formatRest(seconds: number): string {
  return `${Math.max(0, seconds)}s`;
}

export function estimateExerciseSeconds(exercise: Pick<AdminProgramExercise, "sets" | "reps_min" | "reps_max" | "rest_seconds">): number {
  const reps = exercise.reps_max ?? exercise.reps_min ?? 10;
  const work = Math.max(1, reps) * SECONDS_PER_REP;
  const rest = Math.max(0, exercise.rest_seconds || 0);
  return Math.max(0, exercise.sets || 0) * (work + rest);
}

export function estimateDayMinutes(day: Pick<AdminProgramDay, "day_type" | "exercises">): number {
  if (day.day_type !== "workout") return 0;
  const seconds = day.exercises.reduce((sum, exercise) => sum + estimateExerciseSeconds(exercise), 0);
  return Math.round(seconds / 60);
}

export function totalSetsForDay(day: Pick<AdminProgramDay, "exercises">): number {
  return day.exercises.reduce((sum, exercise) => sum + Math.max(0, exercise.sets || 0), 0);
}

export function targetMuscleLabelsForDay(day: Pick<AdminProgramDay, "muscle_focus" | "exercises">): string[] {
  const summary = summarizeSessionMuscles({
    externalIds: day.exercises
      .map((exercise) => exercise.exercise_external_id)
      .filter((id): id is string => Boolean(id)),
    muscleFocus: day.muscle_focus,
  });
  return [...new Set(summary.regions.map((region) => REGION_LABEL_AR[region]))];
}

export function withSortOrder(exercises: AdminProgramExercise[]): AdminProgramExercise[] {
  return exercises.map((exercise, index) => ({ ...exercise, sort_order: index }));
}

export function withEstimatedMinutes(day: AdminProgramDay): AdminProgramDay {
  if (day.day_type !== "workout") return { ...day, estimated_minutes: 0 };
  return { ...day, estimated_minutes: estimateDayMinutes(day) };
}

export function moveItemToIndex<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const copy = items.slice();
  const [row] = copy.splice(from, 1);
  if (row === undefined) return items;
  copy.splice(to, 0, row);
  return copy;
}

export function duplicateExerciseAt(exercises: AdminProgramExercise[], index: number): AdminProgramExercise[] {
  const source = exercises[index];
  if (!source) return exercises;
  const copy: AdminProgramExercise = {
    ...source,
    id: undefined,
    alternatives: source.alternatives?.map((item) => ({ ...item })),
  };
  const next = exercises.slice();
  next.splice(index + 1, 0, copy);
  return withSortOrder(next);
}

export function duplicateWeek(week: AdminProgramWeek, weekNumber: number): AdminProgramWeek {
  return {
    ...week,
    id: undefined,
    week_number: weekNumber,
    title_ar: `الأسبوع ${weekNumber}`,
    days: week.days.map((day) => ({
      ...day,
      id: undefined,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        id: undefined,
        alternatives: exercise.alternatives?.map((item) => ({ ...item })),
      })),
    })),
  };
}

export function copyDayToClipboard(day: AdminProgramDay): DayClipboard {
  return {
    title_ar: day.title_ar,
    muscle_focus: day.muscle_focus,
    notes_ar: day.notes_ar ?? null,
    exercises: day.exercises.map((exercise) => ({
      ...exercise,
      id: undefined,
      alternatives: exercise.alternatives?.map((item) => ({ ...item })),
    })),
  };
}

export function pasteDayFromClipboard(day: AdminProgramDay, clipboard: DayClipboard): AdminProgramDay {
  return withEstimatedMinutes({
    ...day,
    day_type: "workout",
    title_ar: clipboard.title_ar,
    muscle_focus: clipboard.muscle_focus,
    notes_ar: clipboard.notes_ar,
    exercises: withSortOrder(clipboard.exercises.map((exercise) => ({ ...exercise, id: undefined }))),
  });
}

export function convertDayType(day: AdminProgramDay, nextType: "workout" | "rest", fallbackTitle: string): AdminProgramDay {
  if (nextType === "rest") {
    return {
      ...day,
      day_type: "rest",
      title_ar: fallbackTitle,
      muscle_focus: null,
      estimated_minutes: 0,
      exercises: [],
      notes_ar: day.notes_ar ?? null,
    };
  }
  return withEstimatedMinutes({
    ...day,
    day_type: "workout",
    title_ar: fallbackTitle,
    muscle_focus: day.muscle_focus ?? "",
    exercises: day.exercises,
  });
}

export function firstRestDayIndex(week: AdminProgramWeek): number {
  return week.days.findIndex((day) => day.day_type !== "workout");
}

export function workoutOrdinal(week: AdminProgramWeek, dayIndex: number): number {
  return week.days.slice(0, dayIndex + 1).filter((day) => day.day_type === "workout").length;
}

export function applyPatternToSelection(
  exercises: AdminProgramExercise[],
  selectedIndex: number,
  pattern: ExercisePattern,
): AdminProgramExercise[] {
  const selected = exercises[selectedIndex];
  if (!selected) return exercises;
  if (pattern === "none" || selected.pattern === pattern) {
    const group = selected.pattern_group;
    return exercises.map((exercise) =>
      exercise.pattern_group && group && exercise.pattern_group === group
        ? { ...exercise, pattern: "none", pattern_group: null }
        : exercise.pattern === pattern && !group
          ? { ...exercise, pattern: "none", pattern_group: null }
          : exercise,
    );
  }
  const group = `p-${pattern}-${selectedIndex}-${Date.now().toString(36)}`;
  return exercises.map((exercise, index) => {
    if (pattern === "dropset") {
      return index === selectedIndex ? { ...exercise, pattern, pattern_group: group } : exercise;
    }
    if (pattern === "superset") {
      if (index === selectedIndex || index === selectedIndex + 1) {
        return { ...exercise, pattern, pattern_group: group };
      }
      return exercise;
    }
    if (index >= selectedIndex) {
      return { ...exercise, pattern, pattern_group: group };
    }
    return exercise;
  });
}

export function builderMetadataFrom(metadata: Record<string, unknown> | null | undefined): BuilderMetadata {
  const raw = metadata?.builder;
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  return {
    cover_image_url: typeof value.cover_image_url === "string" ? value.cover_image_url : "",
    coach_notes: typeof value.coach_notes === "string" ? value.coach_notes : "",
    progression_notes: typeof value.progression_notes === "string" ? value.progression_notes : "",
    days: Array.isArray(value.days) ? (value.days as BuilderDayRecord[]) : [],
    exercises: Array.isArray(value.exercises) ? (value.exercises as BuilderExerciseRecord[]) : [],
  };
}

export function hydrateProgramBuilder(detail: AdminProgramDetail): AdminProgramDetail {
  const builder = builderMetadataFrom(detail.metadata);
  const extras = builder.exercises ?? [];
  const dayNotes = builder.days ?? [];
  return {
    ...detail,
    weeks: detail.weeks.map((week, weekIndex) => ({
      ...week,
      days: week.days.map((day, dayIndex) => {
        const note = dayNotes.find((row) => row.week === weekIndex && row.day === dayIndex);
        const exercises = day.exercises.map((exercise, exerciseIndex) => {
          const extra = extras.find(
            (row) => row.week === weekIndex && row.day === dayIndex && row.sort === (exercise.sort_order ?? exerciseIndex),
          );
          if (!extra) return exercise;
          return {
            ...exercise,
            rir: extra.rir ?? exercise.rir,
            tempo: extra.tempo ?? exercise.tempo,
            role: extra.role ?? exercise.role,
            pattern: extra.pattern ?? exercise.pattern,
            pattern_group: extra.pattern_group ?? exercise.pattern_group,
            alternatives: extra.alternatives ?? exercise.alternatives,
          };
        });
        return withEstimatedMinutes({
          ...day,
          notes_ar: note?.notes_ar ?? day.notes_ar ?? null,
          exercises,
        });
      }),
    })),
  };
}

export function serializeBuilderMetadata(draft: AdminProgramDetail): BuilderMetadata {
  const existing = builderMetadataFrom(draft.metadata);
  const exercises: BuilderExerciseRecord[] = [];
  const days: BuilderDayRecord[] = [];
  draft.weeks.forEach((week, weekIndex) => {
    week.days.forEach((day, dayIndex) => {
      if (day.notes_ar?.trim()) {
        days.push({ week: weekIndex, day: dayIndex, notes_ar: day.notes_ar });
      }
      day.exercises.forEach((exercise, exerciseIndex) => {
        const hasExtras =
          exercise.rir != null ||
          Boolean(exercise.tempo?.trim()) ||
          (exercise.role && exercise.role !== "main") ||
          (exercise.pattern && exercise.pattern !== "none") ||
          Boolean(exercise.pattern_group) ||
          Boolean(exercise.alternatives?.length);
        if (!hasExtras) return;
        exercises.push({
          week: weekIndex,
          day: dayIndex,
          sort: exercise.sort_order ?? exerciseIndex,
          rir: exercise.rir ?? null,
          tempo: exercise.tempo ?? "",
          role: exercise.role ?? "main",
          pattern: exercise.pattern ?? "none",
          pattern_group: exercise.pattern_group ?? null,
          alternatives: exercise.alternatives ?? [],
        });
      });
    });
  });
  return {
    cover_image_url: existing.cover_image_url ?? "",
    coach_notes: existing.coach_notes ?? "",
    progression_notes: existing.progression_notes ?? "",
    days,
    exercises,
  };
}

export function setBuilderField(
  draft: AdminProgramDetail,
  patch: Partial<Pick<BuilderMetadata, "cover_image_url" | "coach_notes" | "progression_notes">>,
): AdminProgramDetail {
  const current = builderMetadataFrom(draft.metadata);
  return {
    ...draft,
    metadata: {
      ...draft.metadata,
      builder: {
        ...current,
        ...patch,
      },
    },
  };
}

export function patchDay(
  draft: AdminProgramDetail,
  weekIndex: number,
  dayIndex: number,
  patch: Partial<AdminProgramDay>,
): AdminProgramWeek[] {
  return draft.weeks.map((week, i) =>
    i === weekIndex
      ? {
          ...week,
          days: week.days.map((day, j) => (j === dayIndex ? withEstimatedMinutes({ ...day, ...patch }) : day)),
        }
      : week,
  );
}

export function patchExercises(
  draft: AdminProgramDetail,
  weekIndex: number,
  dayIndex: number,
  exercises: AdminProgramExercise[],
): AdminProgramWeek[] {
  return patchDay(draft, weekIndex, dayIndex, { exercises: withSortOrder(exercises) });
}

export function patchExercise(
  draft: AdminProgramDetail,
  weekIndex: number,
  dayIndex: number,
  exerciseIndex: number,
  patch: Partial<AdminProgramExercise>,
): AdminProgramWeek[] {
  const current = draft.weeks[weekIndex]?.days[dayIndex]?.exercises ?? [];
  return patchExercises(
    draft,
    weekIndex,
    dayIndex,
    current.map((exercise, index) => (index === exerciseIndex ? { ...exercise, ...patch } : exercise)),
  );
}

export function addWeekToDraft(draft: AdminProgramDetail): AdminProgramDetail {
  const nextNumber = draft.weeks.length + 1;
  const week: AdminProgramWeek = {
    week_number: nextNumber,
    title_ar: `الأسبوع ${nextNumber}`,
    notes_ar: "",
    days: buildSevenDayWeek(draft.days_per_week),
  };
  const weeks = [...draft.weeks, week];
  return {
    ...draft,
    duration_weeks: Math.max(draft.duration_weeks, weeks.length),
    weeks,
  };
}

export function duplicateWeekInDraft(draft: AdminProgramDetail, weekIndex: number): AdminProgramDetail {
  const source = draft.weeks[weekIndex];
  if (!source) return draft;
  const weeks = [...draft.weeks, duplicateWeek(source, draft.weeks.length + 1)];
  return {
    ...draft,
    duration_weeks: Math.max(draft.duration_weeks, weeks.length),
    weeks,
  };
}

export function addWorkoutDayInWeek(week: AdminProgramWeek, fallbackTitle: string): AdminProgramWeek {
  const restIndex = firstRestDayIndex(week);
  if (restIndex < 0) return week;
  return {
    ...week,
    days: week.days.map((day, index) => (index === restIndex ? convertDayType(day, "workout", fallbackTitle) : day)),
  };
}

export function validateProgramForPublish(draft: AdminProgramDetail): string[] {
  const issues: string[] = [];
  if (!draft.name_ar.trim()) issues.push("اسم البرنامج مطلوب.");
  if (!draft.weeks.length) issues.push("أضف أسبوعاً واحداً على الأقل.");
  draft.weeks.forEach((week, weekIndex) => {
    if (!weekMatchesDaysPerWeek(week.days, draft.days_per_week)) {
      issues.push(`الأسبوع ${weekIndex + 1}: عدد أيام التدريب لا يطابق ${draft.days_per_week} أيام/أسبوع.`);
    }
    week.days.forEach((day, dayIndex) => {
      if (day.day_type !== "workout") return;
      const label = day.title_ar || `اليوم ${dayIndex + 1}`;
      if (!day.exercises.length) {
        issues.push(`الأسبوع ${weekIndex + 1} — ${label}: يوم تدريب بدون تمارين.`);
        return;
      }
      day.exercises.forEach((exercise, exerciseIndex) => {
        const name = exercise.exercise_name_ar || `التمرين ${exerciseIndex + 1}`;
        if (!exercise.exercise_id) issues.push(`${label}: ${name} غير متاح في المكتبة.`);
        if (!(exercise.sets > 0)) issues.push(`${label}: ${name} ينقصه عدد المجموعات.`);
        if (exercise.reps_min == null && exercise.reps_max == null && !exercise.reps_label?.trim()) {
          issues.push(`${label}: ${name} ينقصه التكرارات.`);
        }
      });
    });
  });
  return issues;
}

export function summarizeProgramDraft(draft: AdminProgramDetail): {
  weeks: number;
  workoutDays: number;
  restDays: number;
  exercises: number;
  muscles: string[];
  equipment: string[];
} {
  const muscles = new Set<string>();
  const equipment = new Set<string>();
  let workoutDays = 0;
  let restDays = 0;
  let exercises = 0;
  draft.weeks.forEach((week) => {
    workoutDays += countWorkoutDays(week.days);
    restDays += week.days.filter((day) => day.day_type !== "workout").length;
    week.days.forEach((day) => {
      exercises += day.exercises.length;
      targetMuscleLabelsForDay(day).forEach((label) => muscles.add(label));
    });
  });
  if (draft.equipment.trim()) {
    draft.equipment
      .split(/[،,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => equipment.add(item));
  }
  return {
    weeks: draft.weeks.length,
    workoutDays,
    restDays,
    exercises,
    muscles: [...muscles],
    equipment: [...equipment],
  };
}

export function sessionSubtitle(day: AdminProgramDay): string {
  if (day.day_type !== "workout") return "راحة";
  const presentation = sessionPresentationForDay(day);
  const muscles = targetMuscleLabelsForDay(day);
  if (muscles.length) return muscles.join(" - ");
  return presentation.displayNameAr;
}

export function formatRir(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return String(value);
}

export function parseRir(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
}
