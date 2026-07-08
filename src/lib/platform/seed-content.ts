export type DailyFeedItem = {
  id: string;
  kind: "tip" | "recipe" | "video" | "challenge";
  title: string;
  body: string;
  pastel: string;
  iconBg: string;
  image?: string;
};

export type PremiumFeatureSeed = {
  id: string;
  title: string;
  description: string;
  imageGradient: string;
  freeCta: string;
  premiumCta: string;
  href: string;
};

export type ProgramCarouselItem = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export type FeatureGridItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: "coach" | "exercises" | "nutrition" | "progress";
  bg: string;
};

export const DAILY_GREETING_NAME_FALLBACK = "بطل";

export const HOME_GREETING_SUBTEXT = "مستعد لليوم الأفضل؟";

export type DailyTaskSeed = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: "workout" | "nutrition" | "water" | "measurements" | "calories" | "recipe" | "challenge";
  iconBg: string;
  iconColor: string;
  status: "done" | "arrow" | "progress";
  progress?: { current: number; total: number };
};

export type QuickGlanceSeed = {
  id: string;
  label: string;
  value: string;
  icon: "target" | "calendar" | "trend" | "scale";
  iconBg: string;
  iconColor: string;
};

export type FeaturedContentSeed = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  badge?: string;
  showPlay?: boolean;
};

export const DAILY_TASKS_SEED: DailyTaskSeed[] = [
  {
    id: "workout",
    title: "تمرين اليوم",
    subtitle: "اليوم 3 — الجزء العلوي",
    href: "/app/program",
    icon: "workout",
    iconBg: "bg-secondary-soft",
    iconColor: "text-success",
    status: "done",
  },
  {
    id: "nutrition",
    title: "خطة التغذية",
    subtitle: "سجل وجباتك اليومية",
    href: "/app/nutrition",
    icon: "nutrition",
    iconBg: "bg-[#FEF9C3]",
    iconColor: "text-[#CA8A04]",
    status: "arrow",
  },
  {
    id: "water",
    title: "شرب الماء",
    subtitle: "أكمل 2 لتر اليوم",
    href: "/app/progress",
    icon: "water",
    iconBg: "bg-[#DBEAFE]",
    iconColor: "text-[#2563EB]",
    status: "progress",
    progress: { current: 6, total: 8 },
  },
  {
    id: "measurements",
    title: "تسجيل القياسات",
    subtitle: "حدّث وزنك وقياساتك",
    href: "/app/progress",
    icon: "measurements",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
    status: "arrow",
  },
];

export const QUICK_GLANCE_SEED: QuickGlanceSeed[] = [
  {
    id: "goal",
    label: "الهدف",
    value: "65.0 كجم",
    icon: "target",
    iconBg: "bg-[#FEF9C3]",
    iconColor: "text-[#CA8A04]",
  },
  {
    id: "days",
    label: "منذ البداية",
    value: "18 يوم",
    icon: "calendar",
    iconBg: "bg-secondary-soft",
    iconColor: "text-success",
  },
  {
    id: "change",
    label: "منذ البداية",
    value: "-2.3",
    icon: "trend",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    id: "weight",
    label: "الوزن الحالي",
    value: "72.5 كجم",
    icon: "scale",
    iconBg: "bg-secondary-soft",
    iconColor: "text-success",
  },
];

export const FEATURED_CONTENT_SEED: FeaturedContentSeed[] = [
  {
    id: "recipes",
    title: "وصفات صحية",
    subtitle: "5 وصفات جديدة",
    image: "recipe",
    href: "/app/discover",
    badge: "جديد",
  },
  {
    id: "home-workout",
    title: "تمارين المنزل",
    subtitle: "10 تمارين",
    image: "workout",
    href: "/app/discover",
    showPlay: true,
  },
  {
    id: "flexibility",
    title: "جلسة مرونة",
    subtitle: "20 دقيقة",
    image: "flexibility",
    href: "/app/discover",
  },
];

export const DAILY_FEED_SEED: DailyFeedItem[] = [
  {
    id: "tip-today",
    kind: "tip",
    title: "نصيحة اليوم",
    body: "اشرب 2L ماء",
    pastel: "bg-[#DBEAFE]",
    iconBg: "bg-[#BFDBFE] text-[#2563EB]",
  },
  {
    id: "recipe-today",
    kind: "recipe",
    title: "وصفة اليوم",
    body: "سلطة بروتين",
    pastel: "bg-[#FFEDD5]",
    iconBg: "bg-[#FED7AA] text-[#EA580C]",
  },
  {
    id: "video-today",
    kind: "video",
    title: "فيديو اليوم",
    body: "5 أخطاء شائعة",
    pastel: "bg-[#F1F5F9]",
    iconBg: "bg-[#E2E8F0] text-[#475569]",
  },
  {
    id: "challenge-today",
    kind: "challenge",
    title: "تحدي اليوم",
    body: "20 دقيقة مشي",
    pastel: "bg-[#FCE7F3]",
    iconBg: "bg-[#FBCFE8] text-[#DB2777]",
  },
];

export const PROGRAM_CAROUSEL_SEED: ProgramCarouselItem[] = [
  {
    id: "transform-90",
    title: "برنامج التحول 90 يوم",
    description: "برنامج تدريبي متكامل مخصص لتحقيق أهدافك",
    ctaLabel: "افتح البرنامج",
    href: "/app/program",
  },
  {
    id: "strength-plan",
    title: "برنامج القوة والعضلات",
    description: "تمارين مركّزة لبناء الكتلة العضلية مع خطة تغذية عالية البروتين.",
    ctaLabel: "افتح البرنامج",
    href: "/app/program",
  },
  {
    id: "fat-loss",
    title: "برنامج حرق الدهون",
    description: "تمارين HIIT وخطة غذائية متوازنة لخسارة الدهون مع الحفاظ على العضلات.",
    ctaLabel: "افتح البرنامج",
    href: "/app/program",
  },
  {
    id: "lifestyle",
    title: "برنامج نمط الحياة",
    description: "عادات يومية بسيطة للطاقة والالتزام — مناسب للمبتدئين.",
    ctaLabel: "افتح البرنامج",
    href: "/app/program",
  },
];

export const FEATURE_GRID_SEED: FeatureGridItem[] = [
  {
    id: "coach",
    title: "تواصل مع المدرب",
    subtitle: "دعم ومتابعة مباشرة",
    href: "/app/support",
    icon: "coach",
    bg: "bg-primary-soft",
  },
  {
    id: "exercises",
    title: "التمارين",
    subtitle: "تمارين مخصصة",
    href: "/app/program",
    icon: "exercises",
    bg: "bg-[#DBEAFE]",
  },
  {
    id: "nutrition",
    title: "الخطة الغذائية",
    subtitle: "خطة مخصصة لك",
    href: "/app/nutrition",
    icon: "nutrition",
    bg: "bg-[#FFEDD5]",
  },
  {
    id: "progress",
    title: "تتبع التقدم",
    subtitle: "تقارير ورسوم بيانية",
    href: "/app/progress",
    icon: "progress",
    bg: "bg-[#E0F2FE]",
  },
];

export const PREMIUM_FEATURES_SEED: PremiumFeatureSeed[] = [
  {
    id: "program",
    title: "برنامجي التدريبي",
    description: "خطة أسبوعية مخصصة حسب هدفك وجسمك.",
    imageGradient: "from-[#FF6B00]/20 to-[#FAF6F2]",
    freeCta: "Unlock Program",
    premiumCta: "Start Program",
    href: "/app/program",
  },
  {
    id: "nutrition",
    title: "التغذية",
    description: "وجبات وmacros واضحة بدون تعقيد.",
    imageGradient: "from-[#22C55E]/15 to-[#FAF6F2]",
    freeCta: "Unlock Program",
    premiumCta: "Open Nutrition",
    href: "/app/nutrition",
  },
  {
    id: "progress",
    title: "التقدم",
    description: "رسوم بيانية، قياسات، وصور تطور الجسم.",
    imageGradient: "from-[#0F172A]/10 to-[#FAF6F2]",
    freeCta: "Unlock Program",
    premiumCta: "Track Progress",
    href: "/app/progress",
  },
  {
    id: "support",
    title: "دعم الكوتش",
    description: "تواصل مباشر مع الكوتش حكيم عبر واتساب.",
    imageGradient: "from-[#25D366]/15 to-[#FAF6F2]",
    freeCta: "Unlock Program",
    premiumCta: "Message Coach",
    href: "/app/support",
  },
];

export const WHATSAPP_COACH_URL = "https://wa.me/971505129019";

/* ──────────────────────────────────────────────────────────────────────────
 * Phase 2 — Placeholder data (UI only, no DB / no architecture changes)
 * ────────────────────────────────────────────────────────────────────────── */

export type ProgramDaySeed = {
  id: string;
  day: string;
  title: string;
  meta: string;
  status: "done" | "today" | "rest" | "locked";
};

export const PROGRAM_OVERVIEW_SEED = {
  name: "برنامج التحول 90 يوم",
  subtitle: "بناء العضلات · مستوى متوسط",
  currentDay: 12,
  totalDays: 90,
  weekLabel: "الأسبوع 2 من 13",
};

export const PROGRAM_DAYS_SEED: ProgramDaySeed[] = [
  { id: "d1", day: "اليوم 1", title: "الجزء العلوي", meta: "8 تمارين · 45 دقيقة", status: "done" },
  { id: "d2", day: "اليوم 2", title: "الجزء السفلي", meta: "7 تمارين · 50 دقيقة", status: "done" },
  { id: "d3", day: "اليوم 3", title: "الجزء العلوي", meta: "8 تمارين · 45 دقيقة", status: "today" },
  { id: "d4", day: "اليوم 4", title: "راحة نشطة", meta: "مشي 30 دقيقة", status: "rest" },
  { id: "d5", day: "اليوم 5", title: "الظهر والذراعين", meta: "9 تمارين · 50 دقيقة", status: "locked" },
  { id: "d6", day: "اليوم 6", title: "الأرجل والبطن", meta: "8 تمارين · 48 دقيقة", status: "locked" },
  { id: "d7", day: "اليوم 7", title: "راحة كاملة", meta: "استشفاء", status: "rest" },
];

export type WorkoutExerciseSeed = {
  id: string;
  name: string;
  detail: string;
  muscle: string;
  done: boolean;
};

export const WORKOUT_DAY_SEED = {
  title: "اليوم 3 — الجزء العلوي",
  meta: "8 تمارين · 45 دقيقة · 320 سعرة",
  exercisesCount: 8,
  durationMin: 45,
  calories: 320,
};

export const WORKOUT_EXERCISES_SEED: WorkoutExerciseSeed[] = [
  { id: "e1", name: "ضغط الصدر بالدمبل", detail: "4 مجموعات × 12 تكرار", muscle: "الصدر", done: true },
  { id: "e2", name: "التجديف بالبار", detail: "4 مجموعات × 10 تكرار", muscle: "الظهر", done: true },
  { id: "e3", name: "ضغط الكتف", detail: "3 مجموعات × 12 تكرار", muscle: "الأكتاف", done: false },
  { id: "e4", name: "تمرين العضلة ذات الرأسين", detail: "3 مجموعات × 12 تكرار", muscle: "الذراعين", done: false },
  { id: "e5", name: "تمرين الترايسبس", detail: "3 مجموعات × 15 تكرار", muscle: "الذراعين", done: false },
  { id: "e6", name: "الرفرفة الجانبية", detail: "3 مجموعات × 15 تكرار", muscle: "الأكتاف", done: false },
  { id: "e7", name: "السحب العلوي", detail: "4 مجموعات × 12 تكرار", muscle: "الظهر", done: false },
  { id: "e8", name: "تمرين البطن", detail: "3 مجموعات × 20 تكرار", muscle: "البطن", done: false },
];

export const EXERCISE_DETAIL_SEED = {
  name: "ضغط الصدر بالدمبل",
  muscle: "الصدر · الأكتاف الأمامية · الترايسبس",
  sets: "4",
  reps: "12",
  rest: "60 ثانية",
  steps: [
    "استلقِ على المقعد المستوي وأمسك الدمبل فوق صدرك.",
    "أنزل الدمبل ببطء حتى يصل مستوى الصدر.",
    "ادفع الدمبل للأعلى حتى تمتد الذراعان دون قفل المرفق.",
    "حافظ على شدّ عضلات الصدر طوال الحركة.",
  ],
  tips: [
    "لا تستخدم وزناً يفوق قدرتك على التحكم.",
    "تنفّس بانتظام: زفير عند الدفع، شهيق عند النزول.",
  ],
};

export type MealSeed = {
  id: string;
  name: string;
  kcal: number;
  meta: string;
  icon: "breakfast" | "lunch" | "dinner" | "snack";
  done: boolean;
};

export const NUTRITION_OVERVIEW_SEED = {
  calories: 1450,
  caloriesGoal: 2100,
  macros: [
    { id: "protein", label: "بروتين", value: 95, goal: 150, unit: "غ" },
    { id: "carbs", label: "كربوهيدرات", value: 160, goal: 230, unit: "غ" },
    { id: "fat", label: "دهون", value: 45, goal: 70, unit: "غ" },
  ],
};

export const MEALS_SEED: MealSeed[] = [
  { id: "breakfast", name: "الفطور", kcal: 420, meta: "بيض · شوفان · فاكهة", icon: "breakfast", done: true },
  { id: "lunch", name: "الغداء", kcal: 620, meta: "دجاج · أرز · سلطة", icon: "lunch", done: true },
  { id: "dinner", name: "العشاء", kcal: 410, meta: "سلمون · خضار", icon: "dinner", done: false },
  { id: "snack", name: "سناك", kcal: 0, meta: "لم يُسجّل بعد", icon: "snack", done: false },
];

export const MEAL_DETAIL_SEED = {
  name: "الفطور",
  kcal: 420,
  meta: "3 مكونات · 10 دقائق تحضير",
  macros: [
    { id: "protein", label: "بروتين", value: "28 غ" },
    { id: "carbs", label: "كربوهيدرات", value: "40 غ" },
    { id: "fat", label: "دهون", value: "14 غ" },
  ],
  ingredients: [
    { id: "i1", name: "بيض مسلوق", amount: "2 حبة" },
    { id: "i2", name: "شوفان", amount: "50 غ" },
    { id: "i3", name: "موز", amount: "1 حبة" },
    { id: "i4", name: "زبدة الفول السوداني", amount: "ملعقة" },
  ],
  steps: [
    "اسلق البيض لمدة 8 دقائق.",
    "حضّر الشوفان مع الحليب أو الماء.",
    "أضف الموز المقطّع وزبدة الفول السوداني.",
  ],
};

export const WATER_SEED = {
  current: 6,
  goal: 8,
  glassMl: 250,
};

export type ProgressPointSeed = { id: string; label: string; weight: number };

export const PROGRESS_SEED = {
  currentWeight: 72.5,
  startWeight: 74.8,
  goalWeight: 65,
  change: -2.3,
  daysIn: 18,
  history: [
    { id: "w1", label: "الأسبوع 1", weight: 74.8 },
    { id: "w2", label: "الأسبوع 2", weight: 74.1 },
    { id: "w3", label: "الأسبوع 3", weight: 73.4 },
    { id: "w4", label: "الأسبوع 4", weight: 72.5 },
  ] as ProgressPointSeed[],
  measurements: [
    { id: "m1", label: "الخصر", value: "84 سم", change: "-3 سم" },
    { id: "m2", label: "الصدر", value: "98 سم", change: "+1 سم" },
    { id: "m3", label: "الذراع", value: "36 سم", change: "+0.5 سم" },
  ],
};
