/**
 * Home "today" card — one source of truth for what the client should do today
 * and what coach Hakim says about it. Pure functions (no React) so every card
 * model renders the same content and the coach voice can be unit-tested.
 */
import type { NextSessionState } from "@/lib/platform/home-hub";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";

export type TodayTaskId = "workout" | "meals" | "water" | "weight";

export type TodayTask = {
  id: TodayTaskId;
  title: string;
  detail: string;
  /** 0..1 */
  progress: number;
  done: boolean;
  /** Rest day: the workout row is informative, not a to-do. */
  rest?: boolean;
  href: string;
};

export type TodayNextAction = {
  taskId: TodayTaskId | "all-done";
  label: string;
  href: string;
  /** Water is logged in place instead of navigating. */
  inline?: "water";
};

export type CoachMood =
  | "first"
  | "morning"
  | "push"
  | "cheer"
  | "rest"
  | "comeback"
  | "done"
  | "evening"
  | "water"
  | "weight";

export type CoachLine = { text: string; mood: CoachMood };

/** Something the client just did on the card — the coach reacts to it. */
export type CoachEvent = { type: "water"; leftGlasses: number; goalReached: boolean } | null;

export type TodayPlan = {
  firstName: string;
  female: boolean;
  dayNumber: number;
  goalLabel: string;
  streak: number;
  tasks: TodayTask[];
  doneCount: number;
  totalCount: number;
  /** 0..1 across the countable tasks. */
  progress: number;
  next: TodayNextAction;
  restDay: boolean;
  nextMealName: string | null;
  mealsDone: number;
  mealsTotal: number;
  waterLeftGlasses: number;
  workoutTitle: string;
  workoutMeta: string;
};

const WEIGH_IN_EVERY_DAYS = 7;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromKey: string, toKey: string) {
  const a = new Date(`${fromKey}T12:00:00Z`).getTime();
  const b = new Date(`${toKey}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function glasses(n: number) {
  if (n === 1) return "كوب واحد";
  if (n === 2) return "كوبان";
  return `${n} ${n >= 3 && n <= 10 ? "أكواب" : "كوباً"}`;
}

function litres(ml: number) {
  const value = Math.round((ml / 1000) * 10) / 10;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function isWeighInDue(activity: PlatformActivitySnapshot, date = new Date()): boolean {
  if (!activity.lastWeighInDate) return true;
  return daysBetween(activity.lastWeighInDate, dayKey(date)) >= WEIGH_IN_EVERY_DAYS;
}

export function buildTodayPlan(input: {
  firstName: string;
  gender?: string | null;
  goalLabel?: string | null;
  activity: PlatformActivitySnapshot;
  session: NextSessionState;
  water: { totalMl: number; goalMl: number };
  nextMealName?: string | null;
  date?: Date;
}): TodayPlan {
  const { activity, session } = input;
  const date = input.date ?? new Date();
  const today = dayKey(date);
  const restDay = session.kind === "rest";

  const workout: TodayTask = restDay
    ? {
        id: "workout",
        title: "يوم راحة",
        detail: "استشفاء العضلات",
        progress: 1,
        done: true,
        rest: true,
        href: session.href,
      }
    : {
        id: "workout",
        title: session.kind === "workout" ? session.title : "تمرين اليوم",
        detail: session.kind === "workout" ? session.meta : "حسب برنامجك",
        progress: activity.workoutDone >= 1 ? 1 : 0,
        done: activity.workoutDone >= 1,
        href: session.kind === "workout" ? session.href : "/app/program/workout",
      };

  const mealsTotal = Math.max(activity.mealsTotal, 1);
  const mealsDone = Math.min(activity.mealsDone, mealsTotal);
  const meals: TodayTask = {
    id: "meals",
    title: "الوجبات",
    detail:
      mealsDone >= mealsTotal
        ? `${mealsTotal} من ${mealsTotal} ✓`
        : input.nextMealName
          ? `${mealsDone} من ${mealsTotal} · التالية: ${input.nextMealName}`
          : `${mealsDone} من ${mealsTotal}`,
    progress: mealsDone / mealsTotal,
    done: mealsDone >= mealsTotal,
    href: "/app/nutrition",
  };

  const goalMl = Math.max(input.water.goalMl, 1);
  const water: TodayTask = {
    id: "water",
    title: "الماء",
    detail: `${litres(input.water.totalMl)} / ${litres(goalMl)} لتر`,
    progress: Math.min(input.water.totalMl / goalMl, 1),
    done: input.water.totalMl >= goalMl,
    href: "/app",
  };

  const tasks: TodayTask[] = [workout, meals, water];

  const weighedToday = activity.lastWeighInDate === today;
  if (weighedToday || isWeighInDue(activity, date)) {
    tasks.push({
      id: "weight",
      title: "الوزن الأسبوعي",
      detail:
        weighedToday && activity.currentWeight != null
          ? `${activity.currentWeight} كغ ✓`
          : "على الريق، قبل الأكل",
      progress: weighedToday ? 1 : 0,
      done: weighedToday,
      href: "/app/progress",
    });
  }

  const countable = tasks.filter((t) => !t.rest);
  const doneCount = countable.filter((t) => t.done).length;
  const totalCount = countable.length;
  const progress = totalCount ? countable.reduce((sum, t) => sum + t.progress, 0) / totalCount : 0;

  return {
    firstName: input.firstName,
    female: input.gender === "female",
    dayNumber: Math.max(activity.daysIn, 1),
    goalLabel: input.goalLabel?.trim() || "برنامجك",
    streak: activity.activityStreak,
    tasks,
    doneCount,
    totalCount,
    progress,
    next: pickNextAction(tasks, session, date),
    restDay,
    nextMealName: input.nextMealName?.trim() || null,
    mealsDone,
    mealsTotal,
    waterLeftGlasses: Math.max(
      Math.ceil((goalMl - input.water.totalMl) / Math.max(activity.waterGlassMl || 250, 1)),
      0,
    ),
    workoutTitle: workout.rest ? "" : workout.title,
    workoutMeta: workout.rest || session.kind !== "workout" ? "" : workout.detail,
  };
}

function pickNextAction(
  tasks: TodayTask[],
  session: NextSessionState,
  date: Date,
): TodayNextAction {
  // On weigh-in mornings the scale comes first (before eating or training).
  const weighFirst =
    date.getHours() < 11 ? tasks.find((t) => t.id === "weight" && !t.done) : undefined;
  const pending = weighFirst ?? tasks.find((t) => !t.done && !t.rest);
  if (!pending) return { taskId: "all-done", label: "شاهد إنجاز اليوم", href: "/app/progress" };
  switch (pending.id) {
    case "workout":
      return {
        taskId: "workout",
        label:
          session.kind === "workout" && session.cta && session.cta !== "ابدأ الآن"
            ? session.cta
            : "ابدأ تمرين اليوم",
        href: pending.href,
      };
    case "meals":
      return { taskId: "meals", label: "سجّل وجبتك التالية", href: pending.href };
    case "water":
      return { taskId: "water", label: "اشرب كوب ماء الآن", href: pending.href, inline: "water" };
    case "weight":
      return { taskId: "weight", label: "سجّل وزنك الأسبوعي", href: pending.href };
  }
}

/* ───────────── Coach Hakim's voice ───────────── */

/** Stable pick per day so the line doesn't change on every render. */
function pick<T>(options: readonly T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length]!;
}

export function buildCoachLine(
  plan: TodayPlan,
  opts: { date?: Date; event?: CoachEvent } = {},
): CoachLine {
  const date = opts.date ?? new Date();
  const hour = date.getHours();
  const seed = dayKey(date);
  const f = plan.female;
  const g = (male: string, female: string) => (f ? female : male);
  const name = plan.firstName ? ` يا ${plan.firstName}` : "";
  const nextTask = plan.tasks.find((t) => !t.done && !t.rest);
  const workout = plan.tasks.find((t) => t.id === "workout");
  const water = plan.tasks.find((t) => t.id === "water");
  const weight = plan.tasks.find((t) => t.id === "weight");

  // 1) Instant reaction to what the client just did.
  if (opts.event?.type === "water") {
    if (opts.event.goalReached) {
      return { mood: "cheer", text: `هدف الماء اكتمل 💙 جسمك يشكرك${name}!` };
    }
    return {
      mood: "water",
      text: pick(
        [
          `ممتاز 💧 باقي ${glasses(opts.event.leftGlasses)} وتكمل هدفك.`,
          `كوب زيادة، طاقة زيادة 💧 باقي ${glasses(opts.event.leftGlasses)}.`,
          `هكذا أريد أن أراك 👌 باقي ${glasses(opts.event.leftGlasses)} فقط.`,
        ],
        `${seed}-${opts.event.leftGlasses}`,
      ),
    };
  }

  // 2) Whole day done.
  if (plan.totalCount > 0 && plan.doneCount === plan.totalCount) {
    return {
      mood: "done",
      text: pick(
        [
          `يوم كامل${name}! 🔥 فخور بك. ${g("ارتح", "ارتاحي")} الليلة ونكمل غداً.`,
          `${g("أنهيت", "أنهيتِ")} كل مهام اليوم 👏 هذا هو الالتزام الذي يصنع الفرق.`,
        ],
        seed,
      ),
    };
  }

  // 3) First day together.
  if (plan.dayNumber <= 1 && plan.doneCount === 0) {
    return {
      mood: "first",
      text: `أهلاً${name} 🤝 هذا أول يوم لنا معاً. نبدأ بخطوة بسيطة: ${nextTask ? nextTask.title : "تمرين اليوم"}، وأنا معك.`,
    };
  }

  // 4) Weekly weigh-in morning.
  if (weight && !weight.done && hour < 11 && plan.doneCount === 0) {
    return {
      mood: "weight",
      text: `اليوم موعد الوزن الأسبوعي ⚖️ ${g("قِف", "قِفي")} على الميزان قبل الأكل، ولا ${g("تقلق", "تقلقي")} من الرقم، نحن نتابع الاتجاه.`,
    };
  }

  // 5) Came back after a missed day.
  if (plan.streak === 0 && plan.dayNumber > 1 && plan.doneCount === 0) {
    return {
      mood: "comeback",
      text: pick(
        [
          `لا يهم ما فات${name}، المهم اليوم 💪 نبدأ بـ${nextTask?.title ?? "خطوة صغيرة"} وأنا معك.`,
          `${g("رجعت", "رجعتِ")} وهذا أهم شيء 🙌 خطوة واحدة اليوم تعيد السلسلة.`,
        ],
        seed,
      ),
    };
  }

  // 6) Rest day.
  if (plan.restDay && plan.doneCount === 0) {
    return {
      mood: "rest",
      text: `اليوم راحة لعضلاتك 😌 لكن الماء والأكل لا يرتاحان، ${g("ركّز", "ركّزي")} عليهما.`,
    };
  }

  // 7) Workout done, the rest is pending.
  if (workout && workout.done && !workout.rest && nextTask) {
    return {
      mood: "cheer",
      text: pick(
        [
          `تمرين اليوم في الجيب ✅ الآن دور ${nextTask.id === "meals" ? "الأكل الجيد" : nextTask.title}.`,
          `عمل رائع في التمرين 💪 لا ${g("تنسَ", "تنسي")} ${nextTask.id === "water" ? "الماء" : "وجبتك بعد التمرين"}.`,
        ],
        seed,
      ),
    };
  }

  // 8) Evening and the streak is at risk.
  if (hour >= 19 && plan.doneCount === 0 && plan.streak > 0) {
    return {
      mood: "evening",
      text: `بقيت ساعات على نهاية اليوم ⏳ لا ${g("تضيّع", "تضيّعي")} سلسلة ${plan.streak} أيام، خطوة واحدة تكفي.`,
    };
  }

  // 9) Afternoon, water clearly behind.
  if (water && !water.done && hour >= 14 && water.progress < 0.4) {
    return {
      mood: "water",
      text: `لاحظت أن الماء قليل اليوم 💧 كوب الآن؟ ${g("المسه", "المسيه")} من هنا مباشرة.`,
    };
  }

  // 10) Default by time of day.
  if (hour < 12) {
    return {
      mood: "morning",
      text: pick(
        [
          `صباح النشاط${name} ☀️ ${nextTask ? `أول شيء اليوم: ${nextTask.title}.` : ""} ${g("جاهز", "جاهزة")}؟`,
          `يوم جديد، فرصة جديدة${name} 💪 ${nextTask ? `نبدأ بـ${nextTask.title}.` : ""}`,
        ],
        seed,
      ).trim(),
    };
  }

  return {
    mood: "push",
    text: pick(
      [
        `${plan.doneCount > 0 ? `${plan.doneCount} من ${plan.totalCount} 👌 ` : ""}${nextTask ? `الخطوة التالية: ${nextTask.title}.` : ""} أنا أتابعك.`,
        `كل خطوة اليوم تقرّبك من ${plan.goalLabel} 🎯 ${nextTask ? `${g("كمّل", "كمّلي")} بـ${nextTask.title}.` : ""}`,
      ],
      seed,
    ).trim(),
  };
}

/* ───────────── Stage messages: Hakim speaks at the stage the client reached ───────────── */

export type StageId = TodayTaskId | "all-done";
export type StageLine = CoachLine & { stage: StageId };

export function buildStageLine(
  plan: TodayPlan,
  opts: { date?: Date; event?: CoachEvent } = {},
): StageLine {
  const date = opts.date ?? new Date();
  const hour = date.getHours();
  const seed = dayKey(date);
  const g = (male: string, female: string) => (plan.female ? female : male);
  const name = plan.firstName ? ` يا ${plan.firstName}` : "";
  const othersDone = (id: TodayTaskId) =>
    plan.tasks.filter((t) => t.id !== id && !t.rest).every((t) => t.done);

  // Reaction right where it happened.
  if (opts.event?.type === "water") {
    return { stage: "water", ...buildCoachLine(plan, opts) };
  }

  const stage = plan.next.taskId;

  if (stage === "all-done") {
    return { stage, ...buildCoachLine(plan, { date }) };
  }

  if (stage === "weight") {
    return {
      stage,
      mood: "weight",
      text: `صباح الخير${name} ☀️ أول محطة اليوم: الميزان. ${g("قِف", "قِفي")} عليه على الريق قبل الأكل، والرقم مجرد معلومة نتابع بها تقدمك، لا ${g("تقلق", "تقلقي")} منه.`,
    };
  }

  if (stage === "workout") {
    const what = plan.workoutMeta
      ? `${plan.workoutTitle} · ${plan.workoutMeta}`
      : plan.workoutTitle;
    if (plan.dayNumber <= 1 && plan.doneCount === 0) {
      return {
        stage,
        mood: "first",
        text: `أهلاً${name} 🤝 أول يوم لنا معاً! نبدأ بـ${plan.workoutTitle} بهدوء، وأنا معك خطوة بخطوة.`,
      };
    }
    if (plan.streak === 0 && plan.dayNumber > 1 && plan.doneCount === 0) {
      return {
        stage,
        mood: "comeback",
        text: `${g("رجعت", "رجعتِ")}${name} 🙌 لا يهم ما فات، المهم اليوم. ${plan.workoutTitle} يعيد سلسلتك من جديد، و${g("أنا معك", "أنا معكِ")}.`,
      };
    }
    if (hour >= 19 && plan.streak > 0) {
      return {
        stage,
        mood: "evening",
        text: `ما زال الوقت معك ⏳ ${plan.workoutTitle} اليوم يحمي سلسلة ${plan.streak} أيام. ${g("هيا يا بطل", "هيا يا بطلة")} 🔥`,
      };
    }
    return {
      stage,
      mood: "push",
      text: pick(
        [
          `وصلنا محطة التمرين 💪 ${what}. ${g("ركّز", "ركّزي")} على الأداء الصحيح قبل الوزن، وأنا أتابعك.`,
          `${g("جاهز يا بطل", "جاهزة يا بطلة")}؟ 🔥 ${what} ${g("ينتظرك", "ينتظركِ")}. كل تكرار يقرّبك من ${plan.goalLabel}.`,
          `الآن دورك${name} 💪 ${what}. ${g("ابدأ", "ابدئي")} بالإحماء، والباقي سيأتي.`,
        ],
        seed,
      ),
    };
  }

  if (stage === "meals") {
    const meal = plan.nextMealName
      ? `وجبتك التالية: ${plan.nextMealName}`
      : `${g("سجّل", "سجّلي")} وجبتك التالية`;
    if (plan.restDay && plan.doneCount === 0) {
      return {
        stage,
        mood: "rest",
        text: `اليوم راحة لعضلاتك${name} 😌 لكن الأكل والماء لا يرتاحان. ${meal}.`,
      };
    }
    const workout = plan.tasks.find((t) => t.id === "workout");
    if (workout?.done && !workout.rest) {
      return {
        stage,
        mood: "cheer",
        text: `تمرين ممتاز ✅ ${g("تعبت", "تعبتِ")} اليوم، والآن أهم محطة بعده: الأكل. ${meal}، البروتين يبني ما ${g("اشتغلت", "اشتغلتِ")} عليه.`,
      };
    }
    if (othersDone("meals")) {
      return {
        stage,
        mood: "push",
        text: `بقيت محطة الأكل فقط وتكمل يومك كاملاً 🔥 ${meal}.`,
      };
    }
    return {
      stage,
      mood: "push",
      text: pick(
        [
          `محطة الأكل 🍽️ ${plan.mealsDone} من ${plan.mealsTotal} وجبات. ${meal}. الأكل الجيد نصف النتيجة.`,
          `لا ${g("تنسَ", "تنسي")} أكلك${name} 🍽️ ${meal}. جسمك يحتاج وقوداً ليتغيّر.`,
        ],
        seed,
      ),
    };
  }

  // water
  const left = Math.max(plan.waterLeftGlasses, 1);
  if (othersDone("water")) {
    return {
      stage,
      mood: "water",
      text: `آخر محطة اليوم 💧 باقي ${glasses(left)} وتكمل يومك كاملاً. ${g("المس", "المسي")} ➕ بعد كل كوب.`,
    };
  }
  return {
    stage,
    mood: "water",
    text: `محطة الماء 💧 باقي ${glasses(left)} اليوم. كوب الآن؟ ${g("المس", "المسي")} ➕ وسأحسب لك.`,
  };
}

/** A short word from Hakim on a stage the client already finished. */
export function stageCheer(id: TodayTaskId, female: boolean): string {
  const g = (male: string, female2: string) => (female ? female2 : male);
  switch (id) {
    case "weight":
      return "سجّلناه 👌";
    case "workout":
      return `${g("بطل", "بطلة")} 💪`;
    case "meals":
      return "أكل نظيف 👏";
    case "water":
      return "ارتواء 💙";
  }
}
