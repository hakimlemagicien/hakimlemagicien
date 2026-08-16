import {
  findContractAlternatives,
  formatMealAmount,
  getMealByExternalId,
  mealDeliveryPath,
  type MealLibraryRecord,
} from "./meal-library";

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
  /** Meal Library external_id (e.g. MEAL-001). */
  id: string;
  name: string;
  /** Delivery thumbnail — used on cards and alternative lists. */
  image: string;
  /** Delivery cover — used on meal details. */
  coverImage?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bestChoice?: boolean;
  ingredients: MealIngredient[];
  steps: string[];
  allergens?: string[];
  servingSize?: number;
  servingUnit?: string;
  description?: string;
  preparationTimeMinutes?: number;
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

function toPlanMeal(record: MealLibraryRecord): MealAlternative {
  return {
    id: record.external_id,
    name: record.name_ar,
    image: mealDeliveryPath(record.external_id, "thumb"),
    coverImage: mealDeliveryPath(record.external_id, "cover"),
    calories: record.calories,
    protein: record.protein_g,
    carbs: record.carbs_g,
    fat: record.fat_g,
    ingredients: record.ingredients.map((ingredient) => ({
      id: `${record.external_id}-${ingredient.ingredient_order}-${ingredient.ingredient_key}`,
      name: ingredient.name_ar,
      amount: formatMealAmount(ingredient.quantity, ingredient.unit),
    })),
    steps: record.preparation_steps_ar,
    allergens: record.allergens,
    servingSize: record.serving_size,
    servingUnit: record.serving_unit,
    description: record.description_ar,
    preparationTimeMinutes: record.preparation_time_minutes,
  };
}

function requireLibraryMeal(externalId: string): MealLibraryRecord {
  const meal = getMealByExternalId(externalId);
  if (!meal) {
    throw new Error(`Meal Library is missing ${externalId}`);
  }
  return meal;
}

function buildPilotSlot(input: {
  id: string;
  slotLabel: string;
  timeLabel: string;
  hour: number;
  minute: number;
  defaultExternalId: string;
}): MealSlot {
  const defaultRecord = requireLibraryMeal(input.defaultExternalId);
  return {
    id: input.id,
    slotLabel: input.slotLabel,
    timeLabel: input.timeLabel,
    hour: input.hour,
    minute: input.minute,
    defaultMeal: toPlanMeal(defaultRecord),
    alternatives: findContractAlternatives(defaultRecord).map(toPlanMeal),
  };
}

export const NUTRITION_GOALS: MacroTotals = {
  calories: 2200,
  protein: 160,
  carbs: 220,
  fat: 70,
};

/**
 * User nutrition plan slots. Defaults are assigned from the Meal Library
 * by meal_type; alternatives come only from the package substitution_profile.
 */
const NUTRITION_PLAN_SLOT_DEFS = [
  {
    id: "breakfast",
    slotLabel: "الفطور",
    timeLabel: "8:00 ص",
    hour: 8,
    minute: 0,
    defaultExternalId: "MEAL-001",
  },
  {
    id: "snack",
    slotLabel: "سناك",
    timeLabel: "11:00 ص",
    hour: 11,
    minute: 0,
    defaultExternalId: "MEAL-015",
  },
  {
    id: "lunch",
    slotLabel: "الغداء",
    timeLabel: "2:00 م",
    hour: 14,
    minute: 0,
    defaultExternalId: "MEAL-005",
  },
  {
    id: "dinner",
    slotLabel: "العشاء",
    timeLabel: "8:00 م",
    hour: 20,
    minute: 0,
    defaultExternalId: "MEAL-011",
  },
] as const;

export function getNutritionMealSlots(): MealSlot[] {
  return NUTRITION_PLAN_SLOT_DEFS.map((slot) => buildPilotSlot(slot));
}

export const NUTRITION_MEAL_SLOTS: MealSlot[] = getNutritionMealSlots();

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
  return getNutritionMealSlots().find((slot) => slot.id === slotId);
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
