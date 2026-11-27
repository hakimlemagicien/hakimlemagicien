/**
 * Guide chat — instant answers about using the app, with suggested questions
 * that depend on the page the client opened it from. Pure data + matching so
 * it can be tested without React. Answers are about the app itself; anything
 * personal goes to the coach (VIP chat) or the support page.
 */
import { SUPPORT_FAQS } from "@/lib/platform/support-faq";

export type GuideAction = { label: string; to: string };

export type GuideAnswer = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  action?: GuideAction;
};

export type GuidePage = {
  id: string;
  /** Route prefixes (longest match wins). "/app" matches only the home page. */
  match: string[];
  intro: string;
  suggestions: string[];
};

const ANSWERS: GuideAnswer[] = [
  {
    id: "hello",
    question: "مرحباً",
    answer: "أهلاً بك 👋 اختر سؤالاً من الأسفل، أو اكتب سؤالك عن التطبيق وسأجيبك فوراً.",
    keywords: ["مرحبا", "السلام", "سلام", "هلا", "اهلا", "مساء الخير", "صباح الخير", "hi", "hello"],
  },
  // Home
  {
    id: "home-path",
    question: "ماذا تعني «الخطوة التالية»؟",
    answer:
      "بطاقة الرئيسية هي مسار يومك: الوزن الأسبوعي، التمرين، الوجبات، الماء. الشارة البرتقالية «الخطوة التالية» هي أهم شيء تفعله الآن، والزر البرتقالي أسفل البطاقة يأخذك إليها مباشرة.",
    keywords: ["الخطوه التاليه", "التالية", "مسار", "بطاقه", "الرئيسيه", "يومي", "ابدا يومي"],
  },
  {
    id: "home-water",
    question: "كيف أسجّل الماء؟",
    answer:
      "في بطاقة الرئيسية، بجانب «الماء» يوجد زر ➕ أزرق. كل لمسة تضيف كوباً وتتحرك النسبة فوراً، بدون أن تغادر الصفحة.",
    keywords: ["ماء", "مياه", "كوب", "اشرب", "شرب"],
  },
  {
    id: "home-streak",
    question: "ما هي السلسلة 🔥؟",
    answer:
      "السلسلة هي عدد الأيام المتتالية التي أنجزت فيها شيئاً من خطتك. خطوة واحدة في اليوم (كوب ماء، وجبة، تمرين) تكفي لتستمر. المس 🔥 في أعلى البطاقة لترى أسبوعك.",
    keywords: ["سلسله", "سلسلة", "ايام متتاليه", "نار", "streak"],
  },
  {
    id: "home-weigh",
    question: "متى أسجّل وزني؟",
    answer:
      "مرة واحدة في الأسبوع تكفي، صباحاً على الريق وقبل الأكل. عندما يحين موعده يظهر «الوزن الأسبوعي» في مسار يومك. الوزن يتغيّر يومياً بسبب الماء والأكل، لذلك نتابع الاتجاه الأسبوعي لا الرقم اليومي.",
    keywords: ["وزن", "وزني", "ميزان", "اوزن", "متى"],
    action: { label: "تسجيل الوزن", to: "/app/progress" },
  },
  // Workout
  {
    id: "workout-start",
    question: "كيف أبدأ تمرين اليوم؟",
    answer:
      "من «تماريني» افتح تمرين اليوم واضغط ابدأ. ستظهر لك التمارين بالترتيب، مع عدد المجموعات والتكرارات وطريقة الأداء لكل تمرين.",
    keywords: ["ابدا تمرين", "تمرين اليوم", "ابدأ", "كيف اتمرن", "تمارين"],
    action: { label: "تمرين اليوم", to: "/app/program/workout" },
  },
  {
    id: "workout-sets",
    question: "ما معنى المجموعات والتكرارات؟",
    answer:
      "التكرار هو حركة واحدة كاملة، والمجموعة هي عدد من التكرارات متتالية. مثلاً «3 × 12» تعني 3 مجموعات، في كل مجموعة 12 تكراراً، مع راحة قصيرة بين المجموعات.",
    keywords: ["مجموعات", "تكرارات", "مجموعه", "تكرار", "sets", "reps", "3x12"],
  },
  {
    id: "workout-weight",
    question: "كيف أختار الوزن المناسب؟",
    answer:
      "اختر وزناً تستطيع به إكمال كل التكرارات بأداء صحيح، وتكون آخر 2 أو 3 تكرارات صعبة. إذا أكملتها بسهولة زِد الوزن قليلاً المرة القادمة، وإذا خرب الأداء خفّفه.",
    keywords: ["وزن مناسب", "ثقل", "اي وزن", "دمبل", "حديد", "اثقال", "كيلو"],
  },
  {
    id: "workout-missed",
    question: "فاتني تمرين، ماذا أفعل؟",
    answer:
      "لا مشكلة. لا تحاول تعويض تمرينين في يوم واحد. أكمل من تمرين اليوم كالمعتاد، والمهم أن تحافظ على الاستمرارية خلال الأسبوع.",
    keywords: ["فاتني", "فات", "ما تمرنت", "نسيت", "تعويض", "غبت"],
  },
  {
    id: "workout-pain",
    question: "أشعر بألم أثناء التمرين",
    answer:
      "توقّف عن التمرين الذي يسبب الألم فوراً. الإرهاق العضلي طبيعي، أما الألم الحاد أو في المفصل فليس طبيعياً. إذا استمر الألم راجع مختصاً، وأخبرنا لنعدّل برنامجك.",
    keywords: ["الم", "ألم", "اصابه", "إصابة", "يوجعني", "توجعني", "يوجع", "توجع", "وجع", "مفصل", "ركبه", "ركبتي", "ظهري", "كتفي"],
  },
  {
    id: "exercise-howto",
    question: "كيف أعرف طريقة أداء التمرين؟",
    answer:
      "افتح أي تمرين لترى صوره أو الفيديو وشرح الأداء الصحيح خطوة بخطوة. خذ دقيقة لمشاهدته قبل أول مجموعة.",
    keywords: ["طريقه الاداء", "طريقة", "فيديو", "شرح", "كيف العب", "اداء"],
    action: { label: "مكتبة التمارين", to: "/app/exercises" },
  },
  // Nutrition
  {
    id: "nutrition-how",
    question: "كيف تعمل خطتي الغذائية؟",
    answer:
      "في «تغذيتي» تجد وجبات يومك مرتبة، مع السعرات لكل وجبة. اتبع الوجبات بالترتيب، وسجّل كل وجبة بعد أن تأكلها ليتحدّث تقدمك في الرئيسية.",
    keywords: ["خطه غذائيه", "تغذيه", "تغذية", "وجبات", "سعرات", "اكل"],
    action: { label: "تغذيتي", to: "/app/nutrition" },
  },
  {
    id: "nutrition-swap",
    question: "هل يمكنني استبدال وجبة؟",
    answer:
      "نعم، يمكنك اختيار بديل قريب في السعرات والبروتين من البدائل المتاحة للوجبة. المهم أن يبقى مجموع يومك قريباً من هدفك.",
    keywords: ["استبدال", "بديل", "بدائل", "ما احب", "غير الوجبه"],
    action: { label: "البدائل", to: "/app/nutrition/alternatives" },
  },
  {
    id: "nutrition-offplan",
    question: "أكلت خارج الخطة، ماذا أفعل؟",
    answer:
      "لا تقلق ولا تعاقب نفسك بترك الوجبات التالية. وجبة واحدة لا تفسد تقدمك. ارجع للخطة في الوجبة القادمة واشرب ماءك، والأسبوع هو ما يصنع الفرق.",
    keywords: ["خارج الخطه", "اكلت", "غلطت", "حلويات", "مطعم", "عزومه", "cheat"],
  },
  // Progress
  {
    id: "progress-log",
    question: "كيف أسجّل وزني وقياساتي؟",
    answer:
      "من صفحة التقدم سجّل وزنك الأسبوعي وقياساتك. يمكنك أيضاً إضافة صور التحوّل لتقارن نفسك مع الوقت.",
    keywords: ["سجل وزني", "قياسات", "قياس", "صور", "تحول", "تقدم"],
    action: { label: "صفحة التقدم", to: "/app/progress" },
  },
  {
    id: "progress-plateau",
    question: "لماذا لم ينزل وزني هذا الأسبوع؟",
    answer:
      "الوزن يتأثر بالماء والملح والنوم والدورة الشهرية، فقد يثبت أسبوعاً رغم أنك تتقدم. انظر للاتجاه خلال 2 إلى 3 أسابيع، وراقب القياسات والصور أيضاً. إذا ثبت أكثر من 3 أسابيع نعدّل الخطة.",
    keywords: ["ما نزل", "ثابت", "ثبات", "لم ينزل", "زاد وزني", "ما تغير"],
  },
  // Membership
  {
    id: "billing-manage",
    question: "كيف أدير اشتراكي أو ألغيه؟",
    answer:
      "من صفحة الاشتراك ترى باقتك وموعد التجديد، ويمكنك إدارة التجديد أو إلغاؤه من هناك.",
    keywords: ["الغاء", "إلغاء", "الغي", "تجديد", "اشتراكي", "فاتوره", "دفع"],
    action: { label: "صفحة الاشتراك", to: "/app/billing" },
  },
  {
    id: "billing-refund",
    question: "ما سياسة الاسترجاع؟",
    answer: "تجد شروط الاسترجاع كاملة في صفحة سياسة الاسترجاع.",
    keywords: ["استرجاع", "استرداد", "ارجاع", "refund", "فلوسي"],
    action: { label: "سياسة الاسترجاع", to: "/refund" },
  },
  // Profile
  {
    id: "profile-edit",
    question: "كيف أعدّل بياناتي أو صورتي؟",
    answer: "من الملف الشخصي يمكنك تعديل اسمك وصورتك وبياناتك.",
    keywords: ["بياناتي", "تعديل", "صورتي", "اسمي", "الملف الشخصي", "حسابي"],
    action: { label: "الملف الشخصي", to: "/app/profile" },
  },
  // Discover / tools
  {
    id: "discover-what",
    question: "ماذا أجد في «اكتشف»؟",
    answer: "مقالات ونصائح ووصفات وتمارين قصيرة مختارة حسب هدفك، لتتعلّم وتبقى متحمساً بين التمارين.",
    keywords: ["اكتشف", "مقالات", "وصفات", "محتوى"],
    action: { label: "اكتشف", to: "/app/discover" },
  },
  {
    id: "tools-what",
    question: "ما الأدوات المتاحة؟",
    answer: "في «الأدوات» تجد حاسبة السعرات لتعرف احتياجك اليومي، ومؤقتاً للراحة بين المجموعات أثناء التمرين.",
    keywords: ["ادوات", "أدوات", "حاسبه", "حساب السعرات", "سعره", "كم سعره", "احتياجي", "مؤقت", "تايمر"],
    action: { label: "الأدوات", to: "/app/tools" },
  },
  // Shared FAQ (support page), kept in one place.
  ...SUPPORT_FAQS.filter((f) => f.id !== "coach-chat" && f.id !== "start-day").map((f) => ({
    id: `faq-${f.id}`,
    question: f.question,
    answer: f.answer,
    keywords: f.keywords,
  })),
];

const ANSWER_BY_ID = new Map(ANSWERS.map((a) => [a.id, a]));

export const GUIDE_PAGES: GuidePage[] = [
  {
    id: "home",
    match: ["/app"],
    intro: "أنت في الرئيسية 🏠 هنا مسار يومك. كيف أساعدك؟",
    suggestions: ["home-path", "home-water", "home-streak", "home-weigh"],
  },
  {
    id: "workout",
    match: ["/app/program"],
    intro: "أنت في التمارين 💪 اسألني عن أي شيء قبل أو أثناء التمرين.",
    suggestions: ["workout-start", "workout-sets", "workout-weight", "workout-missed", "workout-pain"],
  },
  {
    id: "exercises",
    match: ["/app/exercises"],
    intro: "هذه مكتبة التمارين 📚 كيف أساعدك؟",
    suggestions: ["exercise-howto", "workout-weight", "workout-pain"],
  },
  {
    id: "nutrition",
    match: ["/app/nutrition"],
    intro: "أنت في التغذية 🍽️ الأكل نصف النتيجة، اسألني.",
    suggestions: ["nutrition-how", "nutrition-swap", "nutrition-offplan", "home-water"],
  },
  {
    id: "progress",
    match: ["/app/progress", "/app/achievements"],
    intro: "هنا تقدمك 📈 كيف أساعدك؟",
    suggestions: ["progress-log", "home-weigh", "progress-plateau"],
  },
  {
    id: "discover",
    match: ["/app/discover"],
    intro: "أنت في «اكتشف» ✨",
    suggestions: ["discover-what", "nutrition-how"],
  },
  {
    id: "tools",
    match: ["/app/tools"],
    intro: "أنت في الأدوات 🧮",
    suggestions: ["tools-what", "nutrition-how"],
  },
  {
    id: "billing",
    match: ["/app/billing", "/app/upgrade"],
    intro: "أسئلة عن الاشتراك؟ 💳",
    suggestions: ["faq-membership", "billing-manage", "billing-refund"],
  },
  {
    id: "profile",
    match: ["/app/profile"],
    intro: "أنت في ملفك الشخصي 👤",
    suggestions: ["profile-edit", "faq-change-goal", "billing-manage"],
  },
];

const FALLBACK_PAGE: GuidePage = {
  id: "general",
  match: [],
  intro: "أهلاً 👋 كيف أساعدك في التطبيق؟",
  suggestions: ["home-path", "workout-start", "nutrition-how", "progress-log"],
};

export function resolveGuidePage(pathname: string): GuidePage {
  const path = pathname.replace(/\/+$/, "") || "/";
  let best: { page: GuidePage; len: number } | null = null;
  for (const page of GUIDE_PAGES) {
    for (const prefix of page.match) {
      const hit = prefix === "/app" ? path === "/app" : path === prefix || path.startsWith(`${prefix}/`);
      if (hit && (!best || prefix.length > best.len)) best = { page, len: prefix.length };
    }
  }
  return best?.page ?? FALLBACK_PAGE;
}

export function guideSuggestions(page: GuidePage): GuideAnswer[] {
  return page.suggestions.map((id) => ANSWER_BY_ID.get(id)).filter(Boolean) as GuideAnswer[];
}

export function getGuideAnswer(id: string): GuideAnswer | null {
  return ANSWER_BY_ID.get(id) ?? null;
}

/** Arabic-friendly normalisation: no diacritics/tatweel, one form of alef/ya/ta marbuta. */
export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Best answer for a free-text question, preferring the current page's topics. */
export function matchGuideAnswer(text: string, page?: GuidePage): GuideAnswer | null {
  const q = normalizeArabic(text);
  if (q.length < 2) return null;
  const words = new Set(q.split(" "));
  let best: { a: GuideAnswer; score: number } | null = null;
  for (const a of ANSWERS) {
    let score = 0;
    for (const raw of a.keywords) {
      const k = normalizeArabic(raw);
      if (!k) continue;
      if (k.includes(" ")) {
        if (q.includes(k)) score += 4;
      } else if (words.has(k)) {
        score += 2;
      } else if (k.length >= 3 && q.includes(k)) {
        score += 1;
      }
    }
    if (score > 0 && page?.suggestions.includes(a.id)) score += 0.5;
    if (score > 0 && (!best || score > best.score)) best = { a, score };
  }
  return best && best.score >= 1.5 ? best.a : null;
}
