/**
 * Coach Hakim during a workout session — one short, situational message per
 * moment of the real player (brief, set, logging, rest, next exercise, end),
 * reacting to the numbers the client just logged. Pure, testable.
 */
import type { EffortLevel } from "@/lib/platform/workout-session";

export type WorkoutCoachMoment =
  | "brief"
  | "exercise"
  | "set"
  | "log"
  | "rest-set"
  | "rest-exercise"
  | "complete";

export type WorkoutCoachActionId = "start" | "video" | "log" | "skip-rest" | "add-rest";

export type WorkoutCoachAction = { id: WorkoutCoachActionId; label: string };

export type WorkoutCoachMessage = {
  /** Changes whenever Hakim has something new to say. */
  key: string;
  moment: WorkoutCoachMoment;
  text: string;
  /** Optional second line (a cue or a number). */
  hint?: string;
  tone: "calm" | "push" | "cheer" | "care";
  actions: WorkoutCoachAction[];
};

export type WorkoutCoachInput = {
  firstName: string;
  female: boolean;
  phase: "exercise" | "set-sheet" | "rest" | "complete";
  setInProgress: boolean;
  exerciseIndex: number;
  totalExercises: number;
  exercise: {
    id: string;
    name: string;
    sets: number;
    repsMin: number | null;
    repsMax: number | null;
    weightKg: number | null;
    isTimed: boolean;
    /** Warm-up / ramp-up slot (the session already contains its own warm-up). */
    isWarmUp?: boolean;
  };
  completedSetsCurrent: number;
  currentSetNumber: number;
  lastLog: {
    exerciseId: string;
    setNumber: number;
    reps: number | null;
    weightKg: number | null;
    effort: EffortLevel | null;
  } | null;
  nextExerciseName: string | null;
  completedWorkingSets: number;
  durationMin: number;
  muscleTitle?: string | null;
  /** The client ended the session before every set was done. */
  partial?: boolean;
};

function pick<T>(options: readonly T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length]!;
}

const SET_CUES = [
  "نزول بطيء، صعود قوي، وتنفّس مع كل تكرار.",
  "ركّز على العضلة لا على الرقم.",
  "ثبّت جسمك قبل أول تكرار.",
  "الأداء الصحيح أهم من سرعة التكرار.",
];

/** «جولة واحدة / جولتان / 5 جولات / 14 جولة» */
function setsPhrase(n: number) {
  if (n === 1) return "جولة واحدة";
  if (n === 2) return "جولتان";
  if (n >= 3 && n <= 10) return `${n} جولات`;
  return `${n} جولة`;
}

export function buildWorkoutCoachMessage(input: WorkoutCoachInput): WorkoutCoachMessage {
  const g = (male: string, female: string) => (input.female ? female : male);
  const name = input.firstName ? ` يا ${input.firstName}` : "";
  const ex = input.exercise;
  const target =
    ex.isTimed || ex.repsMin == null
      ? null
      : ex.repsMax != null && ex.repsMax !== ex.repsMin
        ? `${ex.repsMin}–${ex.repsMax}`
        : `${ex.repsMin}`;
  const isLastExercise = input.exerciseIndex >= input.totalExercises - 1;
  const base = `${input.exerciseIndex}-${input.completedSetsCurrent}`;

  if (input.phase === "complete" && input.partial) {
    return {
      key: "complete-partial",
      moment: "complete",
      tone: "cheer",
      text: `${input.completedWorkingSets > 0 ? `${setsPhrase(input.completedWorkingSets)} اليوم${name} 👏` : `لا بأس${name}.`} حفظتُ كل ما ${g("سجّلته", "سجّلتِه")}، وكل جولة تُحسب.`,
      hint: `${g("ارتح", "ارتاحي")} جيداً، ونكمل معاً في الحصة القادمة.`,
      actions: [],
    };
  }

  if (input.phase === "complete") {
    return {
      key: "complete",
      moment: "complete",
      tone: "cheer",
      text: `${g("أنهيت", "أنهيتِ")} الحصة${name}! 🎉 ${setsPhrase(input.completedWorkingSets)} في الجيب، وأنا فخور بك.`,
      hint: `${g("اشرب", "اشربي")} ماءً، و${g("تناول", "تناولي")} وجبتك خلال ساعة ليبني جسمك ما ${g("تعبت", "تعبتِ")} عليه.`,
      actions: [],
    };
  }

  // Logging the set: guide an honest log.
  if (input.phase === "set-sheet") {
    return {
      key: `log-${base}`,
      moment: "log",
      tone: "calm",
      text: target
        ? `كم تكراراً ${g("أكملت", "أكملتِ")}؟ الهدف ${target}. ${g("سجّل", "سجّلي")} بصدق، فأنا أضبط لك الوزن القادم من أرقامك.`
        : `${g("سجّل", "سجّلي")} ما ${g("أكملته", "أكملتِه")} بصدق، فأنا أضبط لك الجولة القادمة من أرقامك.`,
      hint: `إذا كانت آخر تكرارات سهلة جداً ${g("اختر", "اختاري")} «سهل» لأرفع لك الوزن.`,
      actions: [],
    };
  }

  // Resting: react to what was just logged, then prepare what's next.
  if (input.phase === "rest") {
    const log = input.lastLog;
    let reaction = `جولة ممتازة 👌`;
    let tone: WorkoutCoachMessage["tone"] = "cheer";
    if (log && log.reps != null && ex.repsMin != null) {
      const max = ex.repsMax ?? ex.repsMin;
      if (log.reps > max) {
        reaction = `${log.reps} تكراراً، فوق الهدف 🔥 ${g("أنت", "أنتِ")} أقوى من هذا الوزن، في الجولة القادمة ${g("زِد", "زيدي")} قليلاً.`;
      } else if (log.reps >= ex.repsMin) {
        reaction = pick(
          [
            `${log.reps} تكراراً، داخل الهدف تماماً 👌 هكذا نتقدم.`,
            `${log.reps} تكراراً بأداء ثابت 💪 استمر هكذا.`,
          ],
          base,
        );
      } else {
        tone = "care";
        reaction = `${log.reps} تكراراً، أقل من الهدف قليلاً. لا بأس، ${g("خفّف", "خفّفي")} الوزن في الجولة القادمة لتصل إلى ${target}.`;
      }
    }
    if (log?.effort === "hard") {
      tone = "care";
      reaction += ` كانت صعبة، فـ${g("خذ", "خذي")} الراحة كاملة.`;
    }
    // During rest the player may not have counted the set yet; trust the last log for this exercise.
    const loggedHere = log && log.exerciseId === ex.id ? log.setNumber : 0;
    const setsDone = Math.max(input.completedSetsCurrent, loggedHere);
    const exerciseDone = setsDone >= ex.sets;
    if (exerciseDone && input.nextExerciseName) {
      return {
        key: `rest-ex-${base}`,
        moment: "rest-exercise",
        tone: "cheer",
        text: `${g("أنهيت", "أنهيتِ")} ${ex.name} ✅ ${reaction.replace(/ في الجولة القادمة.*$/, "")}`.trim(),
        hint: `التالي: ${input.nextExerciseName}. ${g("جهّز", "جهّزي")} مكانك أثناء الراحة.`,
        actions: [
          { id: "skip-rest", label: g("أنا جاهز", "أنا جاهزة") },
          { id: "add-rest", label: "+30 ثانية" },
        ],
      };
    }
    return {
      key: `rest-${base}`,
      moment: "rest-set",
      tone,
      text: reaction,
      hint: `الجولة ${Math.min(setsDone + 1, ex.sets)} من ${ex.sets} بعد الراحة.`,
      actions: [
        { id: "skip-rest", label: g("أنا جاهز", "أنا جاهزة") },
        { id: "add-rest", label: "+30 ثانية" },
      ],
    };
  }

  // During a set.
  if (input.setInProgress) {
    const isLastSet = input.currentSetNumber >= ex.sets;
    return {
      key: `set-${base}`,
      moment: "set",
      tone: "push",
      text: isLastSet
        ? `آخر جولة في ${ex.name} 🔥 ${g("أعطها", "أعطيها")} كل ما ${g("بقي عندك", "بقي عندكِ")}.`
        : `الجولة ${input.currentSetNumber} من ${ex.sets}${target ? `: ${target} تكراراً` : ""}${ex.weightKg ? ` بـ${ex.weightKg} كغ` : ""}.`,
      hint: pick(SET_CUES, base),
      actions: [{ id: "log", label: g("أنهيت الجولة", "أنهيتُ الجولة") }],
    };
  }

  // Before the first set of an exercise.
  if (input.exerciseIndex === 0 && input.completedSetsCurrent === 0) {
    return {
      key: "brief",
      moment: "brief",
      tone: "calm",
      text: `جاهز${g("", "ة")}${name}؟ 💪 اليوم ${input.totalExercises} تمارين${input.muscleTitle ? ` لـ${input.muscleTitle}` : ""}، حوالي ${input.durationMin || 40} دقيقة.`,
      hint: ex.isWarmUp
        ? `نبدأ بالإحماء: ${ex.name}. ${g("خذ", "خذي")} الحركة بهدوء وتحكّم.`
        : `${g("ابدأ", "ابدئي")} بإحماء خفيف 5 دقائق، ثم ${ex.name}. ${g("شاهد", "شاهدي")} الفيديو قبل أول جولة.`,
      actions: [
        { id: "video", label: "شاهد الأداء" },
        { id: "start", label: "ابدأ الجولة" },
      ],
    };
  }

  return {
    key: `exercise-${base}`,
    moment: "exercise",
    tone: isLastExercise ? "push" : "calm",
    text: isLastExercise
      ? `آخر تمرين اليوم: ${ex.name} 🏁 ${g("أنهِه", "أنهيه")} بقوة.`
      : `التمرين ${input.exerciseIndex + 1} من ${input.totalExercises}: ${ex.name}.`,
    hint: `${ex.sets} جولات${target ? ` × ${target}` : ""}. ${pick(SET_CUES, `${base}-x`)}`,
    actions: [
      { id: "video", label: "شاهد الأداء" },
      { id: "start", label: "ابدأ الجولة" },
    ],
  };
}
