import type { CalorieCalculatorResult, CaloriePreviewGoal } from "@/lib/platform/calorie-calculator";

const STORAGE_PREFIX = "hakim.calorie-calculator.refs.v1";

export type CalorieCalculatorSavedReference = CalorieCalculatorResult & {
  id: string;
  savedAt: string;
  activityLevel: string;
  weightKg: number;
  isPreviewSave: boolean;
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function saveCalorieCalculatorReference(
  userId: string,
  payload: Omit<CalorieCalculatorSavedReference, "id" | "savedAt">,
): CalorieCalculatorSavedReference {
  const entry: CalorieCalculatorSavedReference = {
    ...payload,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };
  if (typeof window === "undefined") return entry;
  const existing = listCalorieCalculatorReferences(userId);
  const next = [entry, ...existing].slice(0, 20);
  localStorage.setItem(storageKey(userId), JSON.stringify(next));
  return entry;
}

export function listCalorieCalculatorReferences(userId: string): CalorieCalculatorSavedReference[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CalorieCalculatorSavedReference[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type CalorieCalculatorProfileSnapshot = {
  gender: "male" | "female" | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  goalId: string | null;
  goalLabel: string | null;
  actualGoal: CaloriePreviewGoal;
};
