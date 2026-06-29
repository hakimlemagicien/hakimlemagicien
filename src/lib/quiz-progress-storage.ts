const STORAGE_KEY = "hakim_quiz_progress_v1";
const SCHEMA_VERSION = 1;

export type QuizProgressSnapshot = {
  version: typeof SCHEMA_VERSION;
  step: string;
  gender: "male" | "female" | null;
  userName: string;
  userPhone: string;
  userCity: string;
  goalId: string;
  challengeId: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: string;
  investment?: string;
  bodyType?: string;
  userLocation: "dubai" | "remote" | null;
  selectedTierId: "transform" | "pro" | "vip";
  savedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isValidSnapshot(value: unknown): value is QuizProgressSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return s.version === SCHEMA_VERSION && typeof s.step === "string" && typeof s.savedAt === "number";
}

export function readQuizProgress(): QuizProgressSnapshot | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeQuizProgress(snapshot: Omit<QuizProgressSnapshot, "version" | "savedAt">): void {
  if (!canUseStorage()) return;

  try {
    const payload: QuizProgressSnapshot = {
      ...snapshot,
      version: SCHEMA_VERSION,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or private mode — fail silently
  }
}

export function clearQuizProgress(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
