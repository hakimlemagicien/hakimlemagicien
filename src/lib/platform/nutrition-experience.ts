import nutritionHeroImg from "@/assets/home-nutrition-hero.webp";

export type MealStatus = "upcoming" | "current" | "completed" | "skipped";

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealIngredient = {
  id: string;
  name: string;
  amount: string;
};

export type MealAlternative = {
  id: string;
  name: string;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bestChoice?: boolean;
  ingredients: MealIngredient[];
  steps: string[];
};

export type MealSlot = {
  id: string;
  slotLabel: string;
  timeLabel: string;
  hour: number;
  minute: number;
  defaultMeal: MealAlternative;
  alternatives: MealAlternative[];
};

export type ShoppingCategoryId =
  | "protein"
  | "vegetables"
  | "fruits"
  | "dairy"
  | "grains"
  | "extras";

export type ShoppingItem = {
  id: string;
  name: string;
  quantity: string;
  category: ShoppingCategoryId;
};

export type NutritionWeekDay = {
  id: string;
  shortName: string;
  dateLabel: string;
  dateKey: string;
  isToday: boolean;
  isPast: boolean;
  commitmentPct: number;
};

export type NutritionDayPlan = {
  dateKey: string;
  goals: MacroTotals;
  meals: MealSlot[];
};

export type NutritionProgressDay = {
  id: string;
  label: string;
  commitmentPct: number;
  isFuture: boolean;
};

export const SHOPPING_CATEGORY_LABELS: Record<ShoppingCategoryId, string> = {
  protein: "بروتين",
  vegetables: "خضار",
  fruits: "فواكه",
  dairy: "ألبان",
  grains: "حبوب",
  extras: "إضافات",
};

export const MEAL_STATUS_LABELS: Record<MealStatus, string> = {
  upcoming: "لم يحن وقتها بعد",
  current: "الحالية",
  completed: "مكتملة",
  skipped: "لم يتم تناولها",
};

const AR_WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;
const AR_WEEKDAYS_SHORT = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] as const;

function dateKeyFromDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeekSunday(date: Date) {
  const start = new Date(date);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

const MEAL_IMG = nutritionHeroImg;

function meal(
  id: string,
  name: string,
  macros: MacroTotals,
  ingredients: MealIngredient[],
  steps: string[],
  bestChoice = false,
): MealAlternative {
  return {
    id,
    name,
    image: MEAL_IMG,
    ...macros,
    bestChoice,
    ingredients,
    steps,
  };
}

const BREAKFAST = meal(
  "bf-default",
  "شوفان بالبيض والموز",
  { calories: 420, protein: 28, carbs: 42, fat: 14 },
  [
    { id: "bf-i1", name: "بيض مسلوق", amount: "2 حبة" },
    { id: "bf-i2", name: "شوفان", amount: "50 غ" },
    { id: "bf-i3", name: "موز", amount: "1 حبة" },
    { id: "bf-i4", name: "زبدة فول سوداني", amount: "ملعقة" },
  ],
  [
    "اسلق البيض لمدة 8 دقائق.",
    "حضّر الشوفان مع الماء أو الحليب قليل الدسم.",
    "أضف الموز المقطّع وزبدة الفول السوداني وقدّم فوراً.",
  ],
);

const BREAKFAST_ALT = meal(
  "bf-alt-1",
  "توست أسمر مع بيض مخفوق",
  { calories: 390, protein: 26, carbs: 36, fat: 12 },
  [
    { id: "bf-a1", name: "خبز أسمر", amount: "شريحتان" },
    { id: "bf-a2", name: "بيض", amount: "2 حبة" },
    { id: "bf-a3", name: "خيار وطماطم", amount: "حسب الرغبة" },
  ],
  ["حمّص التوست.", "اخفق البيض وقدّمه مع الخضار."],
  true,
);

const SNACK = meal(
  "sn-default",
  "زبادي يوناني مع توت",
  { calories: 180, protein: 18, carbs: 16, fat: 4 },
  [
    { id: "sn-i1", name: "زبادي يوناني", amount: "150 غ" },
    { id: "sn-i2", name: "توت مشكل", amount: "40 غ" },
  ],
  ["اخلط الزبادي مع التوت وقدّم بارداً."],
);

const SNACK_ALT = meal(
  "sn-alt-1",
  "تفاحة مع لوز",
  { calories: 170, protein: 6, carbs: 20, fat: 8 },
  [
    { id: "sn-a1", name: "تفاحة", amount: "1 حبة" },
    { id: "sn-a2", name: "لوز نيء", amount: "10 حبات" },
  ],
  ["قطّع التفاحة وقدّمها مع اللوز."],
  true,
);

const LUNCH = meal(
  "ln-default",
  "صدر دجاج مشوي مع أرز بني وخضار",
  { calories: 650, protein: 45, carbs: 65, fat: 18 },
  [
    { id: "ln-i1", name: "صدر دجاج", amount: "150 غ" },
    { id: "ln-i2", name: "أرز بني مطبوخ", amount: "كوب" },
    { id: "ln-i3", name: "خضار مشوية", amount: "كوب" },
    { id: "ln-i4", name: "زيت زيتون", amount: "ملعقة صغيرة" },
  ],
  [
    "تبّل الدجاج بالبهارات واشوه لمدة 12–15 دقيقة.",
    "سخّن الأرز البني وقدّمه بجانب الخضار.",
    "رُشّ زيت الزيتون قبل التقديم.",
  ],
);

const LUNCH_ALT_BEST = meal(
  "ln-alt-1",
  "سلمون مشوي مع كينوا",
  { calories: 620, protein: 42, carbs: 48, fat: 22 },
  [
    { id: "ln-a1", name: "سلمون", amount: "140 غ" },
    { id: "ln-a2", name: "كينوا مطبوخة", amount: "كوب" },
    { id: "ln-a3", name: "بروكلي", amount: "كوب" },
  ],
  ["اشوِ السلمون 10 دقائق.", "قدّم مع الكينوا والبروكلي."],
  true,
);

const LUNCH_ALT_2 = meal(
  "ln-alt-2",
  "ديك رومي مع بطاطا حلوة",
  { calories: 600, protein: 40, carbs: 55, fat: 16 },
  [
    { id: "ln-b1", name: "ديك رومي", amount: "150 غ" },
    { id: "ln-b2", name: "بطاطا حلوة", amount: "200 غ" },
    { id: "ln-b3", name: "سلطة خضراء", amount: "طبق" },
  ],
  ["اشوِ الديك الرومي والبطاطا.", "قدّم مع السلطة."],
);

const DINNER = meal(
  "dn-default",
  "سلمون مشوي مع سلطة خضراء",
  { calories: 480, protein: 38, carbs: 18, fat: 26 },
  [
    { id: "dn-i1", name: "سلمون", amount: "140 غ" },
    { id: "dn-i2", name: "خضار ورقية", amount: "طبق كبير" },
    { id: "dn-i3", name: "زيت زيتون وليمون", amount: "حسب الرغبة" },
  ],
  ["اشوِ السلمون.", "حضّر السلطة وقدّم فوراً."],
);

const DINNER_ALT = meal(
  "dn-alt-1",
  "عجة خضار مع جبن قليل الدسم",
  { calories: 420, protein: 32, carbs: 14, fat: 24 },
  [
    { id: "dn-a1", name: "بيض", amount: "3 حبات" },
    { id: "dn-a2", name: "خضار مشكلة", amount: "كوب" },
    { id: "dn-a3", name: "جبن قليل الدسم", amount: "30 غ" },
  ],
  ["اخفق البيض مع الخضار.", "اخبز العجة وقدّم ساخنة."],
  true,
);

export const NUTRITION_GOALS: MacroTotals = {
  calories: 2200,
  protein: 160,
  carbs: 220,
  fat: 70,
};

export const NUTRITION_MEAL_SLOTS: MealSlot[] = [
  {
    id: "breakfast",
    slotLabel: "الفطور",
    timeLabel: "8:00 ص",
    hour: 8,
    minute: 0,
    defaultMeal: BREAKFAST,
    alternatives: [BREAKFAST_ALT],
  },
  {
    id: "snack",
    slotLabel: "سناك",
    timeLabel: "11:00 ص",
    hour: 11,
    minute: 0,
    defaultMeal: SNACK,
    alternatives: [SNACK_ALT],
  },
  {
    id: "lunch",
    slotLabel: "الغداء",
    timeLabel: "2:00 م",
    hour: 14,
    minute: 0,
    defaultMeal: LUNCH,
    alternatives: [LUNCH_ALT_BEST, LUNCH_ALT_2],
  },
  {
    id: "dinner",
    slotLabel: "العشاء",
    timeLabel: "8:00 م",
    hour: 20,
    minute: 0,
    defaultMeal: DINNER,
    alternatives: [DINNER_ALT],
  },
];

export const SHOPPING_LIST_SEED: ShoppingItem[] = [
  { id: "p1", name: "صدر دجاج", quantity: "1.5 كغ", category: "protein" },
  { id: "p2", name: "بيض", quantity: "12 حبة", category: "protein" },
  { id: "p3", name: "سلمون", quantity: "600 غ", category: "protein" },
  { id: "v1", name: "بروكلي", quantity: "500 غ", category: "vegetables" },
  { id: "v2", name: "سبانخ", quantity: "علبة", category: "vegetables" },
  { id: "v3", name: "طماطم وخيار", quantity: "1 كغ", category: "vegetables" },
  { id: "f1", name: "موز", quantity: "6 حبات", category: "fruits" },
  { id: "f2", name: "توت مشكل", quantity: "علبة", category: "fruits" },
  { id: "f3", name: "تفاح", quantity: "4 حبات", category: "fruits" },
  { id: "d1", name: "زبادي يوناني", quantity: "4 علب", category: "dairy" },
  { id: "d2", name: "جبن قليل الدسم", quantity: "علبة", category: "dairy" },
  { id: "g1", name: "أرز بني", quantity: "1 كغ", category: "grains" },
  { id: "g2", name: "شوفان", quantity: "500 غ", category: "grains" },
  { id: "g3", name: "كينوا", quantity: "400 غ", category: "grains" },
  { id: "e1", name: "زيت زيتون", quantity: "زجاجة صغيرة", category: "extras" },
  { id: "e2", name: "لوز نيء", quantity: "200 غ", category: "extras" },
];

export const WATER_TIP =
  "اشرب كوباً مع كل وجبة وبين الوجبات — الترطيب يرفع الطاقة والالتزام.";

/** First meal of the day — the only unlocked slot for free members (today only). */
export const FREE_MEMBER_UNLOCKED_MEAL_SLOT_ID = "breakfast";

export function getTodayDateKey(date = new Date()) {
  return dateKeyFromDate(date);
}

/**
 * Free members: only breakfast on today is interactive.
 * Other meals / other days are preview-locked (upgrade on locked controls).
 */
export function isFreeUnlockedMealSlot(input: {
  slotId: string;
  dateKey: string;
  hasNutritionPlan: boolean;
  todayKey?: string;
}) {
  if (input.hasNutritionPlan) return true;
  const today = input.todayKey ?? getTodayDateKey();
  return input.dateKey === today && input.slotId === FREE_MEMBER_UNLOCKED_MEAL_SLOT_ID;
}

export function buildCurrentWeekDays(referenceDate = new Date()): NutritionWeekDay[] {
  const todayKey = dateKeyFromDate(referenceDate);
  const weekStart = startOfWeekSunday(referenceDate);

  return Array.from({ length: 7 }, (_, index) => {
    const calendarDate = new Date(weekStart);
    calendarDate.setDate(weekStart.getDate() + index);
    const dateKey = dateKeyFromDate(calendarDate);
    const isToday = dateKey === todayKey;
    const isPast = dateKey < todayKey;
    const commitmentPct = isPast
      ? [72, 80, 65, 90, 55, 88, 70][index] ?? 70
      : isToday
        ? 0
        : 0;

    return {
      id: AR_WEEKDAYS[index]!,
      shortName: AR_WEEKDAYS_SHORT[index]!,
      dateLabel: String(calendarDate.getDate()),
      dateKey,
      isToday,
      isPast,
      commitmentPct,
    };
  });
}

export function getMealByAlternativeId(
  slot: MealSlot,
  alternativeId?: string | null,
): MealAlternative {
  if (!alternativeId) return slot.defaultMeal;
  if (slot.defaultMeal.id === alternativeId) return slot.defaultMeal;
  return slot.alternatives.find((item) => item.id === alternativeId) ?? slot.defaultMeal;
}

export function findMealSlot(slotId: string): MealSlot | undefined {
  return NUTRITION_MEAL_SLOTS.find((slot) => slot.id === slotId);
}

export function resolveMealStatus(input: {
  hour: number;
  minute: number;
  now?: Date;
  forced?: MealStatus | null;
  isSelectedToday: boolean;
}): MealStatus {
  if (input.forced === "completed" || input.forced === "skipped") return input.forced;
  if (!input.isSelectedToday) {
    return input.forced ?? "upcoming";
  }

  const now = input.now ?? new Date();
  const mealMinutes = input.hour * 60 + input.minute;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextWindow = 150;

  if (nowMinutes < mealMinutes) return "upcoming";
  if (nowMinutes <= mealMinutes + nextWindow) return "current";
  return "skipped";
}

export function sumConsumedMacros(
  slots: MealSlot[],
  statuses: Record<string, MealStatus>,
  alternatives: Record<string, string | undefined>,
): MacroTotals {
  return slots.reduce(
    (acc, slot) => {
      if (statuses[slot.id] !== "completed") return acc;
      const mealItem = getMealByAlternativeId(slot, alternatives[slot.id]);
      return {
        calories: acc.calories + mealItem.calories,
        protein: acc.protein + mealItem.protein,
        carbs: acc.carbs + mealItem.carbs,
        fat: acc.fat + mealItem.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function computeCommitmentPct(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((completed / total) * 100));
}

export function motivationalMessage(remainingMeals: number) {
  if (remainingMeals <= 0) return "أحسنت! أكملت وجبات يومك.";
  if (remainingMeals === 1) return "تبقى لك وجبة واحدة لإكمال يومك.";
  return `تبقى لك ${remainingMeals} وجبات لإكمال يومك.`;
}

export function buildNutritionProgressWeek(referenceDate = new Date()): NutritionProgressDay[] {
  const days = buildCurrentWeekDays(referenceDate);
  return days.map((day) => ({
    id: day.dateKey,
    label: day.shortName,
    commitmentPct: day.isToday ? 65 : day.commitmentPct,
    isFuture: !day.isPast && !day.isToday,
  }));
}

export function groupShoppingByCategory(items: ShoppingItem[]) {
  const order: ShoppingCategoryId[] = [
    "protein",
    "vegetables",
    "fruits",
    "dairy",
    "grains",
    "extras",
  ];
  return order
    .map((category) => ({
      category,
      label: SHOPPING_CATEGORY_LABELS[category],
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
}
