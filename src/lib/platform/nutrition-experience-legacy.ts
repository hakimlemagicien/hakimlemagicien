import nutritionHeroImg from "@/assets/home-nutrition-hero.webp";
import type { MealAlternative, MealIngredient, MacroTotals, MealSlot } from "./nutrition-experience";

/**
 * Pre-pilot mock nutrition meals. Kept for rollback / comparison.
 * Do not use as the live Meal Library.
 */
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

export const LEGACY_NUTRITION_MEAL_SLOTS: MealSlot[] = [
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
