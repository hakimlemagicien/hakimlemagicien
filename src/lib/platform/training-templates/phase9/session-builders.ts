/**
 * Phase 9 sequence builders — shared session patterns.
 */
import type { TemplateActivityRole } from "../activity-roles";
import {
  additionSlot,
  existingSlot,
  type SequenceExerciseSlot,
  type SequenceSession,
} from "./sequence-types";

export function wu3(
  general: string,
  t1: string,
  t2: string,
  labels: [string, string, string] = ["40 sec", "40 sec", "40 sec"],
): SequenceExerciseSlot[] {
  return [
    existingSlot(general, "GENERAL_WARM_UP", { reps: labels[0], sets: 1, rest: 0, slot_key: "GENERAL_WARM_UP" }),
    existingSlot(t1, "TARGETED_DYNAMIC_WARM_UP", { reps: labels[1], sets: 1, rest: 0, slot_key: "TARGETED_WARM_UP_1" }),
    existingSlot(t2, "TARGETED_DYNAMIC_WARM_UP", { reps: labels[2], sets: 1, rest: 0, slot_key: "TARGETED_WARM_UP_2" }),
  ];
}

export function mains(
  ids: string[],
  opts: { reps?: [number, number]; sets?: number; rest?: number } = {},
): SequenceExerciseSlot[] {
  return ids.map((id, i) =>
    existingSlot(id, "MAIN_RESISTANCE", {
      reps: opts.reps ?? [8, 12],
      sets: opts.sets ?? 3,
      rest: opts.rest ?? 90,
      slot_key: `MAIN_EXERCISE_${i + 1}`,
      smart: true,
    }),
  );
}

export function ramp(primaryId: string, reps: [number, number] = [5, 5], sets = 2, rest = 90): SequenceExerciseSlot {
  return existingSlot(primaryId, "EXERCISE_SPECIFIC_RAMP_UP", {
    reps,
    sets,
    rest,
    slot_key: "EXERCISE_SPECIFIC_RAMP_UP",
    smart: false,
    notes_ar: "تهيئة لنفس التمرين الأساسي — خارج حجم العمل وSmart Progression",
  });
}

export function power(id: string, reps: string | [number, number], notes_ar: string): SequenceExerciseSlot {
  return existingSlot(id, "POWER_SKILL_BLOCK", {
    reps,
    sets: typeof reps === "string" ? 1 : 3,
    rest: 90,
    slot_key: "POWER_SKILL_BLOCK",
    smart: false,
    notes_ar,
  });
}

export function session(
  day: number,
  key: string,
  nameAr: string,
  nameEn: string,
  purposeAr: string,
  focus: string,
  minutes: number,
  exercises: SequenceExerciseSlot[],
): SequenceSession {
  return {
    session_key: key,
    day_number: day,
    day_type: "workout",
    session_name_ar: nameAr,
    session_name_en: nameEn,
    session_purpose_ar: purposeAr,
    muscle_focus: focus,
    estimated_minutes: minutes,
    exercises,
  };
}

/** Fat Loss / Recomp / Fitness GYM: brisk walk addition + 2 targeted + 6 main + post */
export function gymBriskCardioSession(
  day: number,
  key: string,
  nameAr: string,
  nameEn: string,
  purposeAr: string,
  focus: string,
  minutes: number,
  targeted: [string, string],
  mainIds: string[],
  startMin: string,
  postMin: string,
  mainOpts?: { reps?: [number, number]; sets?: number; rest?: number },
): SequenceSession {
  return session(day, key, nameAr, nameEn, purposeAr, focus, minutes, [
    additionSlot("ADD_TREADMILL_BRISK_WALK", "GENERAL_WARM_UP", startMin, {
      slot_key: "GENERAL_WARM_UP",
      notes_ar: "مشي سريع على الجهاز — إحماء عام",
    }),
    existingSlot(targeted[0], "TARGETED_DYNAMIC_WARM_UP", {
      reps: "45 sec",
      sets: 1,
      rest: 0,
      slot_key: "TARGETED_WARM_UP_1",
    }),
    existingSlot(targeted[1], "TARGETED_DYNAMIC_WARM_UP", {
      reps: "45 sec",
      sets: 1,
      rest: 0,
      slot_key: "TARGETED_WARM_UP_2",
    }),
    ...mains(mainIds, mainOpts),
    additionSlot("ADD_TREADMILL_BRISK_WALK", "POST_WORKOUT_CARDIO", postMin, {
      slot_key: "POST_WORKOUT_CARDIO",
      notes_ar: "مشي سريع بعد المقاومة — كارديو تحت سيطرة المدرب",
    }),
  ]);
}

/** HOME: existing warmups + optional home brisk walk post */
export function homePostWalkSession(
  day: number,
  key: string,
  nameAr: string,
  nameEn: string,
  purposeAr: string,
  focus: string,
  minutes: number,
  warm: [string, string, string],
  mainIds: string[],
  postMin: string | null,
  mainOpts?: { reps?: [number, number]; sets?: number; rest?: number },
  generalIsAddition = false,
  generalDuration = "8 min",
): SequenceSession {
  const warmSlots: SequenceExerciseSlot[] = generalIsAddition
    ? [
        additionSlot("ADD_HOME_BRISK_WALK", "GENERAL_WARM_UP", generalDuration, {
          slot_key: "GENERAL_WARM_UP",
          notes_ar: "مشي سريع خفيف — إحماء عام منزلي",
        }),
        existingSlot(warm[1], "TARGETED_DYNAMIC_WARM_UP", {
          reps: "40 sec",
          sets: 1,
          rest: 0,
          slot_key: "TARGETED_WARM_UP_1",
        }),
        existingSlot(warm[2], "TARGETED_DYNAMIC_WARM_UP", {
          reps: "40 sec",
          sets: 1,
          rest: 0,
          slot_key: "TARGETED_WARM_UP_2",
        }),
      ]
    : wu3(warm[0], warm[1], warm[2]);

  const ex = [...warmSlots, ...mains(mainIds, mainOpts)];
  if (postMin) {
    ex.push(
      additionSlot("ADD_HOME_BRISK_WALK", "POST_WORKOUT_CARDIO", postMin, {
        slot_key: "POST_WORKOUT_CARDIO",
      }),
    );
  }
  return session(day, key, nameAr, nameEn, purposeAr, focus, minutes, ex);
}

export function gymExistingCardioSession(
  day: number,
  key: string,
  nameAr: string,
  nameEn: string,
  purposeAr: string,
  focus: string,
  minutes: number,
  warm: [string, string, string],
  mainIds: string[],
  cardioId: string,
  postMin: string,
  cardioRole: TemplateActivityRole = "POST_WORKOUT_CARDIO",
  mainOpts?: { reps?: [number, number]; sets?: number; rest?: number },
): SequenceSession {
  return session(day, key, nameAr, nameEn, purposeAr, focus, minutes, [
    ...wu3(warm[0], warm[1], warm[2]),
    ...mains(mainIds, mainOpts),
    existingSlot(cardioId, cardioRole, {
      reps: postMin,
      sets: 1,
      rest: 0,
      slot_key: cardioRole,
      smart: false,
      notes_ar: "كارديو تحت سيطرة المدرب",
    }),
  ]);
}
