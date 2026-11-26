import { Link } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronRight, Lock } from "lucide-react";
import coachAvatar from "@/assets/coach-avatar.webp";
import { supabase } from "@/integrations/supabase/client";
import { userHasOAuthIdentity } from "@/lib/auth-password-gate";
import { triggerSelectionHaptic } from "@/lib/haptic";
import {
  computeBmr,
  computeTargetCalories,
  computeTdee,
  type ActivityLevel,
  type CaloriePreviewGoal,
} from "@/lib/platform/calorie-calculator";

/* ───────────────────────── Types ───────────────────────── */

export type QuizChatAppStep =
  | "gender"
  | "goals"
  | "femaleGoals"
  | "age"
  | "measure"
  | "activity"
  | "challenge"
  | "femaleChallenge"
  | "injuries"
  | "investment"
  | "bodyType"
  | "femaleBodyType"
  | "trainingEnvironment"
  | "analysis"
  | "contact"
  | "congrats";

export const QUIZ_CHAT_STEPS: ReadonlySet<string> = new Set<QuizChatAppStep>([
  "gender",
  "goals",
  "femaleGoals",
  "age",
  "measure",
  "activity",
  "challenge",
  "femaleChallenge",
  "injuries",
  "investment",
  "bodyType",
  "femaleBodyType",
  "trainingEnvironment",
  "analysis",
  "contact",
  "congrats",
]);

export type QuizChatOption = { id: string; label: string; image?: string; desc?: string };
export type QuizChatCountry = { code: string; name: string; dial: string; flag: string };

export type QuizChatContact = {
  name: string;
  email: string;
  countryCode: string;
  customDial: string;
  phone: string;
};

type Gender = "male" | "female";

export type QuizChatProps = {
  step: QuizChatAppStep;
  goToStep: (step: QuizChatAppStep) => void;
  onFinish: () => void;
  submitContact: (contact: QuizChatContact) => Promise<void>;
  answers: {
    gender: Gender | null;
    goalId: string;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
    challengeId: string;
    injuryIds: string[];
    investment?: string;
    bodyType?: string;
    trainingEnvironment?: "home" | "gym" | "anywhere";
    userName: string;
  };
  setters: {
    setGender: (v: Gender) => void;
    setGoalId: (v: string) => void;
    setAge: (v: number) => void;
    setHeightCm: (v: number) => void;
    setWeightKg: (v: number) => void;
    setActivityLevel: (v: string) => void;
    setChallengeId: (v: string) => void;
    setInjuryIds: (v: string[]) => void;
    setInvestment: (v: string) => void;
    setBodyType: (v: string) => void;
    setTrainingEnvironment: (v: "home" | "gym") => void;
  };
  options: {
    genderImages: Record<Gender, string>;
    goals: Record<Gender, QuizChatOption[]>;
    challenges: Record<Gender, QuizChatOption[]>;
    bodyTypes: Record<Gender, QuizChatOption[]>;
    activities: QuizChatOption[];
    investment: QuizChatOption[];
    injuries: QuizChatOption[];
    environments: QuizChatOption[];
    countries: QuizChatCountry[];
    otherCountry: QuizChatCountry;
  };
};

/* ───────────────────────── Chat model ───────────────────────── */

type ChatStep =
  | "gender"
  | "goal"
  | "age"
  | "measure"
  | "activity"
  | "challenge"
  | "injuries"
  | "investment"
  | "body"
  | "env"
  | "analysis"
  | "contact"
  | "done";

const CHAT_ORDER: ChatStep[] = [
  "gender",
  "goal",
  "age",
  "measure",
  "activity",
  "challenge",
  "injuries",
  "investment",
  "body",
  "env",
  "analysis",
  "contact",
  "done",
];

/** Questions the visitor answers (for the «سؤال x من y» counter). */
const QUESTION_STEPS: ChatStep[] = [
  "gender",
  "goal",
  "age",
  "measure",
  "activity",
  "challenge",
  "injuries",
  "investment",
  "body",
  "env",
  "contact",
];

function toChat(step: QuizChatAppStep): ChatStep {
  switch (step) {
    case "goals":
    case "femaleGoals":
      return "goal";
    case "challenge":
    case "femaleChallenge":
      return "challenge";
    case "bodyType":
    case "femaleBodyType":
      return "body";
    case "trainingEnvironment":
      return "env";
    case "congrats":
      return "done";
    default:
      return step;
  }
}

function toApp(step: ChatStep, gender: Gender | null): QuizChatAppStep {
  const female = gender === "female";
  switch (step) {
    case "goal":
      return female ? "femaleGoals" : "goals";
    case "challenge":
      return female ? "femaleChallenge" : "challenge";
    case "body":
      return female ? "femaleBodyType" : "bodyType";
    case "env":
      return "trainingEnvironment";
    case "done":
      return "congrats";
    default:
      return step;
  }
}

type Item =
  | { key: string; kind: "coach"; text: ReactNode; question?: boolean }
  | { key: string; kind: "me"; text: string; image?: string }
  | { key: string; kind: "card"; tone?: "dark" | "soft" | "plain"; body: ReactNode };

type ContactPhase = "name" | "email" | "phone" | "saving";

const ACTIVITY_EMOJI: Record<string, string> = {
  sedentary: "🛋️",
  light: "🚶",
  moderate: "🏃",
  high: "🔥",
  veryhigh: "⚡",
  athlete: "🏆",
};
const INVESTMENT_EMOJI: Record<string, string> = { premium: "🏆", standard: "💰", budget: "🐷" };

const GOAL_REACT: Record<string, [string, string]> = {
  fat: ["🔥", "اختيار ذكي 🔥 خسارة الدهون بدون حرمان، هذا اللي نشتغل عليه."],
  muscle: ["💪", "هذا تخصصي 💪 سنبني عضلات حقيقية خطوة بخطوة."],
  fitness: ["⚡", "ممتاز ⚡ طاقة أعلى من أول أسبوعين، ستلاحظ الفرق."],
  athletic: ["🏆", "هدف جميل 🏆 نحرق الدهون ونبني العضل في نفس الوقت."],
  shape: ["✨", "تغيير كامل؟ أحب هذا ✨ سنمشي عليه بخطة واضحة."],
  gain: ["🍽️", "زيادة صحية بدون كرش 🍽️ سأهتم بأكلك جيداً."],
  glutes: ["🍑", "هدف واضح 🍑 تمارين مركّزة وأكل يدعم النتيجة."],
  waist: ["⏳", "خصر أنحف ⏳ نشتغل على الدهون والشد معاً."],
  body: ["✨", "جميل ✨ تناسق الجزء السفلي له تمارين خاصة."],
  fit: ["🏆", "هدف رائع 🏆 قوام أجمل وطاقة أعلى."],
  tone: ["💫", "تمام 💫 نقوّي الظهر والصدر لقوام أجمل."],
};
const ACTIVITY_REACT: Record<string, string> = {
  sedentary: "لا مشكلة أبداً 🙌 أغلب عملائي بدؤوا من هنا.",
  light: "بداية جيدة 👌 سنبني عليها تدريجياً.",
  moderate: "ممتاز 🏃 عندك أساس جيد.",
  high: "واو 🔥 أنت جاهز لخطة قوية.",
  veryhigh: "مستوى عالي ⚡ سنهتم بالاستشفاء أيضاً.",
  athlete: "رياضي محترف 🏆 خطتك ستكون على مستواك.",
};
const CHALLENGE_REACT: Record<string, string> = {
  commitment: "صراحة تُحترم 🤝 لهذا أنا معك: سأتابعك حتى يصبح الالتزام عادة.",
  goal: "لا تقلق 🎯 هذه مهمتي: أوضّح لك الطريق.",
  energy: "سنرفع طاقتك ⚡ بالأكل والنوم والتمرين الصحيح.",
  confidence: "هذا أهم سبب للبدء ❤️ والنتيجة ستظهر عليك وعلى ثقتك.",
  belly: "دهون البطن لها حل 🔥 أكل صحيح + تمرين ذكي.",
  muscle: "غالباً المشكلة في الخطة، لا فيك 💪 سنصلحها.",
  glutes: "تمارين مركّزة للجزء السفلي 🍑 ستلاحظين الفرق.",
  sagging: "الشد يحتاج تمارين مقاومة 💫 وسأعطيك الصحيحة.",
  weight: "الثبات له أسباب 📉 سنكتشفها ونكسره.",
  cravings: "التناسق يأتي بالتمرين الموجّه ✨ وهذا ما سنفعله.",
};
const INVESTMENT_REACT: Record<string, string> = {
  premium: "رائع 🏆 سأعطيك أفضل التنويع.",
  standard: "الأذكى 👌 تنويع بدون تكلفة عالية.",
  budget: "ممتاز 🐷 النتيجة لا تحتاج أكلاً غالياً.",
};

/** Feminine wording for coach lines when the visitor is a woman. */
const FEMININE: Array<[string, string]> = [
  ["لا تقلق", "لا تقلقي"],
  ["كن صريحاً", "كوني صريحة"],
  ["كم أنت مستعد تستثمر", "كم أنتِ مستعدة تستثمرين"],
  ["أنت جاهز", "أنتِ جاهزة"],
  ["ستلاحظ الفرق", "ستلاحظين الفرق"],
  ["عندك", "عندكِ"],
  ["خطتك", "خطتكِ"],
  ["طولك ووزنك", "طولكِ ووزنكِ"],
  ["نشاطك", "نشاطكِ"],
  ["احتياجك", "احتياجكِ"],
  ["أرسل لك", "أرسل لكِ"],
  ["بريدك", "بريدكِ"],
  ["رقمك", "رقمكِ"],
  ["ما اسمك", "ما اسمكِ"],
  ["معك", "معكِ"],
  ["بأكلك", "بأكلكِ"],
  ["سأعطيك", "سأعطيكِ"],
  ["مستواك", "مستواكِ"],
  ["أتابعك", "أتابعكِ"],
  ["لك ", "لكِ "],
  ["طاقتك", "طاقتكِ"],
  ["عليك", "عليكِ"],
  ["فيك", "فيكِ"],
  ["ثقتك", "ثقتكِ"],
  ["يعيقك", "يعيقكِ"],
  ["جسمك", "جسمكِ"],
  ["عمرك", "عمركِ"],
  ["هدفك", "هدفكِ"],
  ["ستتدرب", "ستتدربين"],
  ["اختر", "اختاري"],
];

function feminize(text: string): string {
  let out = text;
  for (const [from, to] of FEMININE) out = out.split(from).join(to);
  return out.replace(/كِِ/g, "كِ");
}

function mapActivity(id: string | undefined): ActivityLevel {
  if (id === "high") return "active";
  if (id === "veryhigh" || id === "athlete") return "very_active";
  if (id === "sedentary" || id === "light" || id === "moderate") return id;
  return "light";
}

function mapGoal(goalId: string): CaloriePreviewGoal {
  if (goalId === "fat" || goalId === "waist") return "cut";
  if (goalId === "muscle" || goalId === "gain" || goalId === "glutes") return "bulk";
  return "maintain";
}

function trainingDays(activity: string | undefined): number {
  if (activity === "sedentary" || activity === "light") return 3;
  if (activity === "moderate") return 4;
  return 5;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/* ───────────────────────── Component ───────────────────────── */

export function QuizChat(props: QuizChatProps) {
  const { step, answers, setters, options, goToStep } = props;
  const gender: Gender = answers.gender ?? "male";
  const female = answers.gender === "female";
  // Ref so lines queued right after the gender answer already use the right wording.
  const genderRef = useRef<Gender | null>(answers.gender);
  if (answers.gender) genderRef.current = answers.gender;
  const say = useCallback(
    (text: string) => (genderRef.current === "female" ? feminize(text) : text),
    [],
  );

  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  ).current;

  const [items, setItems] = useState<Item[]>([]);
  const [typing, setTyping] = useState(false);
  const [dock, setDock] = useState<ChatStep | null>(null);
  const [contactPhase, setContactPhase] = useState<ContactPhase>("name");
  const [contact, setContact] = useState<QuizChatContact>({
    name: answers.userName ?? "",
    email: "",
    countryCode: "ae",
    customDial: "",
    phone: "",
  });
  const [oauthEmail, setOauthEmail] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ id: number; emoji: string } | null>(null);
  const [confetti, setConfetti] = useState(0);

  const timers = useRef<number[]>([]);
  const askedRef = useRef<ChatStep | null>(null);
  const keyRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockHeight, setDockHeight] = useState(0);

  const chatStep = toChat(step);
  const nextKey = () => `m${++keyRef.current}`;
  const later = useCallback(
    (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, reduceMotion ? 0 : ms);
      timers.current.push(id);
    },
    [reduceMotion],
  );
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  // Unmount (incl. React StrictMode's dev remount): stop queued messages and rebuild on next mount.
  useEffect(
    () => () => {
      clearTimers();
      askedRef.current = null;
    },
    [],
  );

  // OAuth visitors already have an email — skip that question.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user || !userHasOAuthIdentity(data.user)) return;
      const email = (data.user.email ?? "").trim().toLowerCase();
      if (email) {
        setOauthEmail(email);
        setContact((prev) => ({ ...prev, email }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── content builders ── */
  const findOption = (list: QuizChatOption[], id: string | undefined) =>
    list.find((o) => o.id === id);

  const kcal = (activityId?: string) => {
    const { age, heightCm, weightKg } = answers;
    if (!age || !heightCm || !weightKg) return null;
    const bmr = computeBmr({ gender, age, heightCm, weightKg });
    const tdee = computeTdee(bmr, mapActivity(activityId ?? answers.activityLevel));
    return Math.round(computeTargetCalories(tdee, mapGoal(answers.goalId)) / 50) * 50;
  };

  const coach = (text: string, question = false): Item => ({
    key: nextKey(),
    kind: "coach",
    text: say(text),
    question,
  });

  const askFor = (cs: ChatStep, phase: ContactPhase = "name"): Item[] => {
    switch (cs) {
      case "gender":
        return [
          coach("أهلاً 👋 أنا حكيم، مدربك الشخصي."),
          coach("سأسألك 11 سؤالاً سريعاً، وبعدها أجهّز خطتك على مقاسك."),
          coach("نبدأ: هل أنت رجل أم امرأة؟", true),
        ];
      case "goal":
        return [coach("ما هو هدفك الأساسي؟", true)];
      case "age":
        return [coach("كم عمرك؟", true)];
      case "measure":
        return [
          coach("طولك ووزنك الحالي؟", true),
          coach("لا تقلق، الأرقام فقط لأحسب احتياجك بدقة 📏"),
        ];
      case "activity":
        return [coach("كيف هو نشاطك اليومي حالياً؟", true)];
      case "challenge":
        return [coach("ما أكبر شيء يعيقك حالياً؟", true)];
      case "injuries":
        return [
          coach("هل عندك أي إصابة؟", true),
          coach("اختر كل ما ينطبق عليك، حتى أتجنّب أي تمرين قد يؤذيك."),
        ];
      case "investment":
        return [coach("بخصوص الأكل: كم أنت مستعد تستثمر فيه؟", true)];
      case "body":
        return [coach("أي شكل أقرب لجسمك الآن؟", true), coach("كن صريحاً، لا أحد يرى هذا غيري 😉")];
      case "env":
        return [coach("وأخيراً للتمرين: أين ستتدرب؟", true)];
      case "contact":
        if (phase === "email")
          return [coach("بريدك الإلكتروني؟ أرسل لك عليه رمزاً لفتح خطتك.", true)];
        if (phase === "phone") return [coach("ورقمك؟ حتى أستطيع التواصل معك إذا احتجت 📱", true)];
        return [coach("آخر شيء قبل أن أرسل لك خطتك 🙂 ما اسمك؟", true)];
      default:
        return [];
    }
  };

  const meFor = (cs: ChatStep): Item | null => {
    const me = (text: string, image?: string): Item => ({
      key: nextKey(),
      kind: "me",
      text,
      image,
    });
    switch (cs) {
      case "gender":
        return answers.gender ? me(female ? "امرأة" : "رجل", options.genderImages[gender]) : null;
      case "goal": {
        const o = findOption(options.goals[gender], answers.goalId);
        return o ? me(o.label, o.image) : null;
      }
      case "age":
        return answers.age ? me(`${answers.age} سنة`) : null;
      case "measure":
        return answers.heightCm && answers.weightKg
          ? me(`${answers.heightCm} سم · ${answers.weightKg} كغ`)
          : null;
      case "activity": {
        const o = findOption(options.activities, answers.activityLevel);
        return o ? me(o.label) : null;
      }
      case "challenge": {
        const o = findOption(options.challenges[gender], answers.challengeId);
        return o ? me(o.label, o.image) : null;
      }
      case "injuries": {
        const ids = answers.injuryIds?.length ? answers.injuryIds : ["none"];
        return me(
          ids.includes("none")
            ? "لا أعاني من أي إصابة"
            : ids.map((id) => findOption(options.injuries, id)?.label ?? id).join("، "),
        );
      }
      case "investment": {
        const o = findOption(options.investment, answers.investment);
        return o ? me(o.label) : null;
      }
      case "body": {
        const o = findOption(options.bodyTypes[gender], answers.bodyType);
        return o ? me(o.label, o.image) : null;
      }
      case "env": {
        const o = findOption(options.environments, answers.trainingEnvironment);
        return o ? me(o.label, o.image) : null;
      }
      default:
        return null;
    }
  };

  const reactFor = (cs: ChatStep, value?: string): Item[] => {
    switch (cs) {
      case "gender":
        return [
          coach(
            value === "female"
              ? "تشرفت 🤝 خلّينا نبني خطتك يا بطلة."
              : "تشرفت 🤝 خلّينا نبني خطتك.",
          ),
        ];
      case "goal": {
        const id = value ?? answers.goalId;
        const o = findOption(options.goals[gender], id);
        return [
          coach(GOAL_REACT[id]?.[1] ?? "هدف رائع 💪"),
          {
            key: nextKey(),
            kind: "card",
            tone: "plain",
            body: (
              <>
                <span className="qchat-card__k">🎯 {say("خطتك ستركّز على")}</span>
                <strong className="qchat-card__title">{o?.label}</strong>
              </>
            ),
          },
        ];
      }
      case "age": {
        const a = Number(value ?? answers.age);
        return [
          coach(
            a < 25
              ? "عمر ذهبي للبناء 🚀 جسمك يستجيب بسرعة."
              : a < 40
                ? "عمر ممتاز 💪 النتائج هنا تكون قوية وثابتة."
                : "العمر رقم فقط 💪 والالتزام هو الفرق الحقيقي.",
          ),
        ];
      }
      case "measure":
        return [coach("تمام، سجّلت ✅")];
      case "activity": {
        const id = value ?? answers.activityLevel ?? "";
        const calories = kcal(id);
        const out: Item[] = [coach(ACTIVITY_REACT[id] ?? "تمام 👌")];
        if (calories) {
          out.push({
            key: nextKey(),
            kind: "card",
            tone: "dark",
            body: (
              <>
                <span className="qchat-card__k">🔥 حسبتها لك</span>
                <strong className="qchat-card__value">
                  {calories.toLocaleString("en-US")} <small>سعرة يومياً</small>
                </strong>
                <span className="qchat-card__s">
                  {say("احتياجك التقريبي حسب جسمك ونشاطك وهدفك")}
                </span>
              </>
            ),
          });
        }
        return out;
      }
      case "challenge":
        return [
          coach(CHALLENGE_REACT[value ?? answers.challengeId] ?? "مفهوم 🤝 سنشتغل عليه معاً."),
        ];
      case "injuries": {
        const none = (value ?? answers.injuryIds?.join(",") ?? "none").includes("none");
        return [
          coach(
            none
              ? "ممتاز 💚 خطة كاملة بدون قيود."
              : "شكراً على الصراحة 🙏 سأستبعد التمارين التي تضغط على هذه المنطقة.",
          ),
        ];
      }
      case "investment":
        return [coach(INVESTMENT_REACT[value ?? answers.investment ?? ""] ?? "تمام 👌")];
      case "body":
        return [coach("شكراً 🙏 هذه نقطة البداية، وبعد أسابيع سنقارن.")];
      case "env":
        return [
          coach(
            (value ?? answers.trainingEnvironment) === "home"
              ? "البيت ممتاز 🏠 سأعطيك تمارين بوزن الجسم وأدوات بسيطة."
              : "النادي 🏋️ سنستغل كل الأجهزة.",
          ),
        ];
      default:
        return [];
    }
  };

  const milestoneCard = (): Item => ({
    key: nextKey(),
    kind: "card",
    tone: "soft",
    body: (
      <>
        <strong className="qchat-card__mile">🔥 نصف الطريق!</strong>
        <span className="qchat-card__s">بقي 5 أسئلة فقط و{say("خطتك")} جاهزة</span>
      </>
    ),
  });

  const planCard = (name: string): Item[] => {
    const goal = findOption(options.goals[gender], answers.goalId)?.label ?? "";
    const calories = kcal();
    const place = answers.trainingEnvironment === "home" ? "المنزل" : "النادي";
    return [
      coach(`${say("خطتك")} جاهزة${name ? ` يا ${name}` : ""} 🎉`),
      {
        key: nextKey(),
        kind: "card",
        tone: "plain",
        body: (
          <div className="qchat-plan">
            <span className="qchat-card__k">📋 ملخص {say("خطتك")}</span>
            <div>
              <span>الهدف</span>
              <b>{goal}</b>
            </div>
            {calories ? (
              <div>
                <span>السعرات اليومية</span>
                <b>{calories.toLocaleString("en-US")} سعرة</b>
              </div>
            ) : null}
            <div>
              <span>أيام التمرين</span>
              <b>{trainingDays(answers.activityLevel)} أيام أسبوعياً</b>
            </div>
            <div>
              <span>المكان</span>
              <b>{place}</b>
            </div>
          </div>
        ),
      },
      coach(`أرسلت رمز التأكيد إلى ${say("بريدك")} 📩 أدخله وأبدأ ${say("معك")} من اليوم.`),
    ];
  };

  /* ── playback ── */
  const play = useCallback(
    (queue: Item[], done?: () => void) => {
      let i = 0;
      const next = () => {
        if (i >= queue.length) {
          setTyping(false);
          done?.();
          return;
        }
        const item = queue[i++];
        setTyping(true);
        const length =
          item.kind === "coach" && typeof item.text === "string" ? item.text.length : 40;
        later(
          () => {
            setTyping(false);
            setItems((prev) => [...prev, item]);
            later(next, 240);
          },
          Math.min(1050, 380 + length * 9),
        );
      };
      next();
    },
    [later],
  );

  const rebuildAndAsk = (target: ChatStep) => {
    clearTimers();
    setTyping(false);
    setDock(null);
    const history: Item[] = [];
    for (const cs of CHAT_ORDER) {
      if (cs === target) break;
      if (cs === "analysis") continue;
      if (cs === "contact") continue;
      history.push(...askFor(cs));
      const me = meFor(cs);
      if (me) history.push(me);
      history.push(...reactFor(cs));
      if (cs === "challenge") history.push(milestoneCard());
    }
    setItems(history);
    askedRef.current = target;
    if (target === "analysis") {
      runAnalysis();
      return;
    }
    if (target === "done") {
      setItems((prev) => [...prev, ...planCard(answers.userName)]);
      setDock("done");
      return;
    }
    if (target === "contact") setContactPhase("name");
    later(() => play(askFor(target), () => setDock(target)), history.length ? 150 : 350);
  };

  // Build (or rebuild after back / resume) whenever the app step changes outside the chat flow.
  useEffect(() => {
    if (askedRef.current === chatStep) return;
    rebuildAndAsk(chatStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatStep]);

  const advance = (from: ChatStep, genderOverride?: Gender) => {
    const next = CHAT_ORDER[CHAT_ORDER.indexOf(from) + 1];
    askedRef.current = next;
    goToStep(toApp(next, genderOverride ?? answers.gender));
    if (next === "analysis") {
      runAnalysis();
      return;
    }
    if (next === "contact") setContactPhase("name");
    play(askFor(next), () => setDock(next));
  };

  const runAnalysis = () => {
    play([coach("ممتاز 👏 عندي الآن كل ما أحتاجه للتمرين والأكل. لحظة أجهّز خطتك…")], () => {
      const id = nextKey();
      setItems((prev) => [
        ...prev,
        { key: id, kind: "card", tone: "plain", body: <AnalysisChecks /> },
      ]);
      later(() => {
        askedRef.current = "contact";
        setContactPhase("name");
        goToStep("contact");
        play(askFor("contact", "name"), () => setDock("contact"));
      }, 2700);
    });
  };

  const pop = (emoji: string) => setBurst({ id: Date.now(), emoji });

  const answer = (cs: ChatStep, value: string, label: string, image?: string, emoji?: string) => {
    triggerSelectionHaptic();
    setDock(null);
    setItems((prev) => [...prev, { key: nextKey(), kind: "me", text: label, image }]);
    if (emoji) pop(emoji);
    let g: Gender | undefined;
    switch (cs) {
      case "gender":
        g = value as Gender;
        genderRef.current = g;
        setters.setGender(g);
        break;
      case "goal":
        setters.setGoalId(value);
        break;
      case "age":
        setters.setAge(Number(value));
        break;
      case "activity":
        setters.setActivityLevel(value);
        break;
      case "challenge":
        setters.setChallengeId(value);
        break;
      case "investment":
        setters.setInvestment(value);
        break;
      case "body":
        setters.setBodyType(value);
        break;
      case "env":
        setters.setTrainingEnvironment(value as "home" | "gym");
        break;
    }
    later(() => {
      play(reactFor(cs, value), () => {
        if (cs === "challenge") {
          setConfetti(Date.now());
          setItems((prev) => [...prev, milestoneCard()]);
          later(() => advance(cs), 800);
          return;
        }
        advance(cs, g);
      });
    }, 420);
  };

  const answerMeasure = (h: number, w: number) => {
    setters.setHeightCm(h);
    setters.setWeightKg(w);
    triggerSelectionHaptic();
    setDock(null);
    setItems((prev) => [...prev, { key: nextKey(), kind: "me", text: `${h} سم · ${w} كغ` }]);
    pop("📏");
    later(() => play(reactFor("measure"), () => advance("measure")), 420);
  };

  const answerInjuries = (ids: string[]) => {
    setters.setInjuryIds(ids);
    triggerSelectionHaptic();
    setDock(null);
    const none = ids.includes("none");
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        kind: "me",
        text: none
          ? "لا أعاني من أي إصابة"
          : ids.map((id) => findOption(options.injuries, id)?.label ?? id).join("، "),
      },
    ]);
    pop(none ? "💚" : "🩹");
    later(() => play(reactFor("injuries", ids.join(",")), () => advance("injuries")), 420);
  };

  const submitContactStep = async (field: "name" | "email" | "phone", value: string) => {
    triggerSelectionHaptic();
    setDock(null);
    if (field === "name") {
      const name = value.trim();
      setContact((prev) => ({ ...prev, name }));
      setItems((prev) => [...prev, { key: nextKey(), kind: "me", text: name }]);
      pop("🤝");
      const nextPhase: ContactPhase = oauthEmail ? "phone" : "email";
      later(
        () =>
          play([coach(`تشرفت يا ${name} 🤝`), ...askFor("contact", nextPhase)], () => {
            setContactPhase(nextPhase);
            setDock("contact");
          }),
        420,
      );
      return;
    }
    if (field === "email") {
      const email = value.trim().toLowerCase();
      setContact((prev) => ({ ...prev, email }));
      setItems((prev) => [...prev, { key: nextKey(), kind: "me", text: email }]);
      later(
        () =>
          play(askFor("contact", "phone"), () => {
            setContactPhase("phone");
            setDock("contact");
          }),
        380,
      );
      return;
    }
    // phone → save lead + onboarding draft (same logic as the classic contact screen)
    const final = { ...contact, phone: value.trim() };
    setContact(final);
    const country =
      final.countryCode === "other"
        ? { ...options.otherCountry, dial: `+${final.customDial}` }
        : options.countries.find((c) => c.code === final.countryCode);
    setItems((prev) => [
      ...prev,
      { key: nextKey(), kind: "me", text: `${country?.dial ?? ""} ${final.phone}`.trim() },
    ]);
    setContactPhase("saving");
    setTyping(true);
    try {
      await props.submitContact(final);
      setTyping(false);
      setConfetti(Date.now());
      askedRef.current = "done";
      goToStep("congrats");
      play(planCard(final.name), () => setDock("done"));
    } catch (error) {
      console.error("[quiz-chat] contact save failed:", error);
      setTyping(false);
      play([coach("حدث خطأ بسيط أثناء الحفظ 🙏 حاول مرة أخرى.")], () => {
        setContactPhase("phone");
        setDock("contact");
      });
    }
  };

  const goBackOne = () => {
    if (contactPhase === "email" || contactPhase === "phone") {
      clearTimers();
      setTyping(false);
      const prevPhase: ContactPhase = contactPhase === "phone" && !oauthEmail ? "email" : "name";
      setContactPhase(prevPhase);
      setItems((prev) => [...prev, ...askFor("contact", prevPhase)]);
      setDock("contact");
      return;
    }
    const index = CHAT_ORDER.indexOf(chatStep);
    if (index <= 0 || chatStep === "done") return;
    let prev = CHAT_ORDER[index - 1];
    if (prev === "analysis") prev = "env";
    askedRef.current = null;
    goToStep(toApp(prev, answers.gender));
  };

  /* ── scrolling ── */
  useLayoutEffect(() => {
    const el = dockRef.current;
    setDockHeight(el && dock ? el.offsetHeight : 0);
  }, [dock, contactPhase]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = window.setTimeout(
      () => el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" }),
      40,
    );
    return () => window.clearTimeout(id);
  }, [items, typing, dockHeight, reduceMotion]);

  const questionIndex = Math.max(0, QUESTION_STEPS.indexOf(chatStep));
  const progress =
    chatStep === "done"
      ? 100
      : chatStep === "analysis"
        ? (10 / 11) * 100
        : ((questionIndex + 1) / QUESTION_STEPS.length) * 100;
  const counter =
    chatStep === "done"
      ? "✓"
      : chatStep === "analysis"
        ? "…"
        : `${questionIndex + 1} / ${QUESTION_STEPS.length}`;
  const canGoBack =
    chatStep !== "gender" && chatStep !== "done" && contactPhase !== "saving" && !typing;

  return (
    <div className={`qchat${typing ? " is-typing" : ""}`} dir="rtl">
      <header className="qchat-head">
        <div className="qchat-head__row">
          <button
            type="button"
            className="qchat-back"
            onClick={goBackOne}
            disabled={!canGoBack}
            aria-label="السؤال السابق"
          >
            <ChevronRight />
          </button>
          <div className="qchat-who">
            <span className="qchat-who__avatar">
              <img src={coachAvatar} alt="" width={42} height={42} />
            </span>
            <div>
              <strong>
                الكوتش حكيم
                <VerifiedMark />
              </strong>
              <small aria-live="polite">{typing ? "يكتب…" : "مدربك الشخصي"}</small>
            </div>
          </div>
          <Link to="/auth" search={{ view: "login", redirect: undefined }} className="qchat-login">
            لديك حساب؟ <b>دخول</b>
          </Link>
        </div>
        <div className="qchat-progress" aria-label={`التقدم ${counter}`}>
          <div className="qchat-progress__bar">
            <i style={{ width: `${progress}%` }} />
          </div>
          <span>{counter}</span>
        </div>
      </header>

      <div className="qchat-scroll" ref={scrollRef}>
        {items.map((item, index) => {
          if (item.kind === "me") {
            return (
              <div key={item.key} className="qchat-msg is-me">
                <div className="qchat-bubble">
                  {item.image ? <img src={item.image} alt="" /> : null}
                  {item.text}
                </div>
              </div>
            );
          }
          if (item.kind === "card") {
            return (
              <div key={item.key} className={`qchat-card is-${item.tone ?? "plain"}`}>
                {item.body}
              </div>
            );
          }
          const prev = items[index - 1];
          const firstInGroup = !prev || prev.kind !== "coach";
          return (
            <div key={item.key} className="qchat-msg">
              {firstInGroup ? (
                <img className="qchat-mini" src={coachAvatar} alt="" />
              ) : (
                <span className="qchat-mini is-space" />
              )}
              <div className={`qchat-bubble${item.question ? " is-question" : ""}`}>
                {item.text}
              </div>
            </div>
          );
        })}
        {typing ? (
          <div className="qchat-msg">
            <span className="qchat-mini is-space" />
            <div className="qchat-bubble qchat-typing" aria-hidden>
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
        <div style={{ height: dockHeight + 24 }} />
      </div>

      {burst ? (
        <span key={burst.id} className="qchat-burst" aria-hidden>
          {burst.emoji}
        </span>
      ) : null}
      {confetti ? <Confetti key={confetti} /> : null}

      <div ref={dockRef} className={`qchat-dock${dock ? " is-open" : ""}`}>
        {dock === "gender" ? (
          <>
            <div className="qchat-grid is-two">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  className="qchat-opt is-tall"
                  onClick={() =>
                    answer(
                      "gender",
                      g,
                      g === "male" ? "رجل" : "امرأة",
                      options.genderImages[g],
                      "👋",
                    )
                  }
                >
                  <span className="qchat-opt__img">
                    <img src={options.genderImages[g]} alt="" />
                  </span>
                  <span className="qchat-opt__label">{g === "male" ? "رجل" : "امرأة"}</span>
                </button>
              ))}
            </div>
            <PrivacyNote />
          </>
        ) : null}

        {dock === "goal" || dock === "challenge" || dock === "body" ? (
          <>
            <p className="qchat-hint">{female ? "اختاري واحداً" : "اختر واحداً"}</p>
            <div className="qchat-dock__scroll">
              <div className="qchat-grid">
                {(dock === "goal"
                  ? options.goals
                  : dock === "challenge"
                    ? options.challenges
                    : options.bodyTypes)[gender].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="qchat-opt"
                    onClick={() =>
                      answer(
                        dock,
                        o.id,
                        o.label,
                        o.image,
                        dock === "goal" ? GOAL_REACT[o.id]?.[0] : dock === "body" ? "📸" : "🤝",
                      )
                    }
                  >
                    <span className="qchat-opt__img">
                      {o.image ? <img src={o.image} alt="" loading="lazy" /> : null}
                    </span>
                    <span className="qchat-opt__label">{o.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {dock === "age" ? (
          <AgePicker
            initial={answers.age ?? (female ? 25 : 27)}
            onSubmit={(v) => answer("age", String(v), `${v} سنة`, undefined, "🎂")}
          />
        ) : null}

        {dock === "measure" ? (
          <MeasurePicker
            initialHeight={answers.heightCm ?? (female ? 162 : 176)}
            initialWeight={answers.weightKg ?? (female ? 62 : 78)}
            onSubmit={answerMeasure}
          />
        ) : null}

        {dock === "activity" || dock === "investment" ? (
          <div className="qchat-dock__scroll">
            <div className="qchat-list">
              {(dock === "activity" ? options.activities : options.investment).map((o) => {
                const emoji = dock === "activity" ? ACTIVITY_EMOJI[o.id] : INVESTMENT_EMOJI[o.id];
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="qchat-li"
                    onClick={() => answer(dock, o.id, o.label, undefined, emoji)}
                  >
                    <span className="qchat-li__emoji" aria-hidden>
                      {emoji}
                    </span>
                    <span>
                      <b>{o.label}</b>
                      {o.desc ? <small>{o.desc}</small> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {dock === "injuries" ? (
          <InjuryPicker
            options={options.injuries}
            initial={answers.injuryIds?.length ? answers.injuryIds : []}
            onSubmit={answerInjuries}
          />
        ) : null}

        {dock === "env" ? (
          <div className="qchat-grid is-two">
            {options.environments.map((o) => (
              <button
                key={o.id}
                type="button"
                className="qchat-opt is-tall is-cover"
                onClick={() => answer("env", o.id, o.label, o.image, o.id === "home" ? "🏠" : "🏋️")}
              >
                <span className="qchat-opt__img">
                  {o.image ? <img src={o.image} alt="" /> : null}
                </span>
                <span className="qchat-opt__label">{o.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        {dock === "contact" && contactPhase === "name" ? (
          <TextAnswer
            key="name"
            placeholder={female ? "اكتبي اسمك" : "اكتب اسمك"}
            initial={contact.name}
            autoComplete="name"
            valid={(v) => v.trim().length >= 2}
            onSubmit={(v) => void submitContactStep("name", v)}
          />
        ) : null}
        {dock === "contact" && contactPhase === "email" ? (
          <TextAnswer
            key="email"
            type="email"
            placeholder="example@email.com"
            initial={contact.email}
            autoComplete="email"
            ltr
            valid={isEmail}
            onSubmit={(v) => void submitContactStep("email", v)}
            footer={<PrivacyNote />}
          />
        ) : null}
        {dock === "contact" && contactPhase === "phone" ? (
          <PhoneAnswer
            countries={options.countries}
            otherCountry={options.otherCountry}
            contact={contact}
            onChange={setContact}
            onSubmit={(v) => void submitContactStep("phone", v)}
          />
        ) : null}

        {dock === "done" ? (
          <button type="button" className="qchat-send" onClick={props.onFinish}>
            أدخل الرمز وافتح {say("خطتك")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────────────────── Sub components ───────────────────────── */

function VerifiedMark() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-label="موثّق">
      <circle cx="12" cy="12" r="11" fill="#f97316" />
      <path
        d="m7 12.5 3 3 7-7"
        stroke="#fff"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrivacyNote() {
  return (
    <p className="qchat-privacy">
      <Lock aria-hidden />
      إجاباتك خاصة بيني وبينك
    </p>
  );
}

function AnalysisChecks() {
  const lines = [
    "أحسب سعراتك وبروتينك",
    "أختار تمارين تناسب مكانك",
    "أستبعد ما يضر إصاباتك",
    "أوزّع أيام التمرين على أسبوعك",
  ];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const ids = lines.map((_, i) => window.setTimeout(() => setDone(i + 1), 450 + i * 520));
    return () => ids.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="qchat-checks">
      <span className="qchat-card__k">⚙️ أجهّز خطتك</span>
      {lines.map((line, i) => (
        <div key={line} className={i < done ? "is-on" : undefined}>
          <i>✓</i>
          {line}
        </div>
      ))}
    </div>
  );
}

function Confetti() {
  const colors = ["#F97316", "#FDBA74", "#22C55E", "#1F1B18", "#FFD166"];
  const pieces = useRef(
    Array.from({ length: 34 }, (_, i) => ({
      color: colors[i % colors.length],
      x: Math.random() * 340 - 170,
      y: Math.random() * 420 - 120,
      r: Math.random() * 720,
      d: Math.random() * 0.15,
    })),
  ).current;
  return (
    <div className="qchat-confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={
            {
              background: p.color,
              animationDelay: `${p.d}s`,
              "--x": `${p.x}px`,
              "--y": `${p.y}px`,
              "--r": `${p.r}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function AgePicker({ initial, onSubmit }: { initial: number; onSubmit: (age: number) => void }) {
  const [age, setAge] = useState(initial);
  const set = (v: number) => setAge(Math.max(14, Math.min(80, v)));
  return (
    <div>
      <div className="qchat-num">
        <button type="button" onClick={() => set(age + 1)} aria-label="زيادة">
          +
        </button>
        <strong>
          {age}
          <small>سنة</small>
        </strong>
        <button type="button" onClick={() => set(age - 1)} aria-label="إنقاص">
          −
        </button>
      </div>
      <input
        className="qchat-range"
        type="range"
        min={14}
        max={80}
        value={age}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="العمر"
      />
      <button type="button" className="qchat-send" onClick={() => onSubmit(age)}>
        إرسال ✓
      </button>
    </div>
  );
}

function MeasurePicker({
  initialHeight,
  initialWeight,
  onSubmit,
}: {
  initialHeight: number;
  initialWeight: number;
  onSubmit: (h: number, w: number) => void;
}) {
  const [h, setH] = useState(initialHeight);
  const [w, setW] = useState(initialWeight);
  return (
    <div>
      <div className="qchat-measure">
        <span>📏 الطول</span>
        <strong>
          {h} <small>سم</small>
        </strong>
      </div>
      <input
        className="qchat-range"
        type="range"
        min={130}
        max={215}
        value={h}
        onChange={(e) => setH(Number(e.target.value))}
        aria-label="الطول"
      />
      <div className="qchat-measure">
        <span>⚖️ الوزن</span>
        <strong>
          {w} <small>كغ</small>
        </strong>
      </div>
      <input
        className="qchat-range"
        type="range"
        min={35}
        max={200}
        value={w}
        onChange={(e) => setW(Number(e.target.value))}
        aria-label="الوزن"
      />
      <button type="button" className="qchat-send" onClick={() => onSubmit(h, w)}>
        إرسال ✓
      </button>
    </div>
  );
}

function InjuryPicker({
  options,
  initial,
  onSubmit,
}: {
  options: QuizChatOption[];
  initial: string[];
  onSubmit: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const toggle = (id: string) => {
    if (id === "none") {
      setSelected(["none"]);
      return;
    }
    setSelected((prev) => {
      const base = prev.filter((x) => x !== "none");
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  };
  return (
    <>
      <div className="qchat-dock__scroll">
        <div className="qchat-list">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`qchat-li${selected.includes(o.id) ? " is-selected" : ""}`}
              onClick={() => toggle(o.id)}
              aria-pressed={selected.includes(o.id)}
            >
              <span className="qchat-li__emoji">
                {o.image ? <img src={o.image} alt="" /> : null}
              </span>
              <span>
                <b>{o.label}</b>
              </span>
              <span className="qchat-li__check">✓</span>
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="qchat-send"
        disabled={!selected.length}
        onClick={() => onSubmit(selected)}
      >
        تم ✓
      </button>
    </>
  );
}

function TextAnswer({
  placeholder,
  initial,
  type = "text",
  autoComplete,
  ltr,
  valid,
  onSubmit,
  footer,
}: {
  placeholder: string;
  initial: string;
  type?: string;
  autoComplete?: string;
  ltr?: boolean;
  valid: (value: string) => boolean;
  onSubmit: (value: string) => void;
  footer?: ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const ok = valid(value);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit(value);
      }}
    >
      <input
        className="qchat-input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        dir={ltr ? "ltr" : undefined}
        style={ltr ? { textAlign: "right" } : undefined}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button type="submit" className="qchat-send" disabled={!ok}>
        إرسال ✓
      </button>
      {footer}
    </form>
  );
}

function PhoneAnswer({
  countries,
  otherCountry,
  contact,
  onChange,
  onSubmit,
}: {
  countries: QuizChatCountry[];
  otherCountry: QuizChatCountry;
  contact: QuizChatContact;
  onChange: (next: QuizChatContact) => void;
  onSubmit: (phone: string) => void;
}) {
  const isOther = contact.countryCode === "other";
  const digits = contact.phone.replace(/\D/g, "");
  const ok = digits.length >= 7 && (!isOther || contact.customDial.trim().length >= 1);
  // Guide the eye: country first, then the number, then the send button.
  const [stage, setStage] = useState<"country" | "number">("country");
  const active = ok ? "done" : stage;
  const country = isOther
    ? otherCountry
    : (countries.find((c) => c.code === contact.countryCode) ?? countries[0]);
  const numberRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (ok) onSubmit(contact.phone);
      }}
    >
      <div className="qchat-steps" aria-hidden>
        <span className={active === "country" ? "is-active" : "is-done"}>
          <i>{active === "country" ? "1" : "✓"}</i> اختر دولتك
        </span>
        <span
          className={active === "number" ? "is-active" : active === "done" ? "is-done" : undefined}
        >
          <i>{active === "done" ? "✓" : "2"}</i> اكتب رقمك
        </span>
      </div>

      <div className={`qchat-phone is-${active}`} dir="ltr">
        <label className={`qchat-phone__country${active === "country" ? " is-attention" : ""}`}>
          <span className="qchat-phone__flag" aria-hidden>
            {country.flag}
          </span>
          {isOther ? (
            <span className="qchat-phone__dial">+</span>
          ) : (
            <span className="qchat-phone__dial">{country.dial}</span>
          )}
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <select
            value={contact.countryCode}
            onChange={(e) => {
              onChange({ ...contact, countryCode: e.target.value });
              setStage("number");
              if (e.target.value !== "other")
                window.setTimeout(() => numberRef.current?.focus(), 120);
            }}
            onFocus={() => setStage("country")}
            aria-label="الدولة"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            ))}
            <option value="other">
              {otherCountry.flag} {otherCountry.name}
            </option>
          </select>
        </label>
        {isOther ? (
          <input
            className="qchat-phone__custom"
            inputMode="numeric"
            placeholder="رمز"
            value={contact.customDial}
            onChange={(e) =>
              onChange({ ...contact, customDial: e.target.value.replace(/\D/g, "").slice(0, 4) })
            }
            onFocus={() => setStage("number")}
            aria-label="رمز الدولة"
          />
        ) : null}
        <span className={`qchat-phone__number${active === "number" ? " is-attention" : ""}`}>
          <input
            ref={numberRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="50 123 4567"
            value={contact.phone}
            onFocus={() => setStage("number")}
            onChange={(e) =>
              onChange({ ...contact, phone: e.target.value.replace(/[^\d\s]/g, "") })
            }
            aria-label="رقم الهاتف"
          />
          {ok ? (
            <span className="qchat-phone__ok" aria-hidden>
              ✓
            </span>
          ) : null}
        </span>
      </div>
      <p className="qchat-phone__help">
        {active === "country" ? "المس العلم لتغيير الدولة 👆" : "بدون الصفر في أول الرقم"}
      </p>

      <button type="submit" className={`qchat-send${ok ? " is-ready" : ""}`} disabled={!ok}>
        إرسال وتجهيز خطتي ✓
      </button>
      <PrivacyNote />
    </form>
  );
}
