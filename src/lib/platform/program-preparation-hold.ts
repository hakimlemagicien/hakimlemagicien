/**
 * New-account workout hold — hide the program for 2 hours so the coach can
 * review first. After the window, the automatic program unlocks.
 */

export const PROGRAM_PREPARATION_HOLD_MS = 2 * 60 * 60 * 1000;

export type ProgramPreparationStepId = 1 | 2 | 3 | 4;

export type ProgramPreparationHold = {
  active: boolean;
  remainingMs: number;
  elapsedMs: number;
  unlocksAt: string | null;
  hours: number;
  minutes: number;
  seconds: number;
  currentStep: ProgramPreparationStepId;
};

export const PROGRAM_PREPARATION_STEPS: Array<{
  id: ProgramPreparationStepId;
  titleAr: string;
  waitingAr: string;
  activeAr: string;
  doneAr: string;
}> = [
  { id: 1, titleAr: "تحليل بياناتك", waitingAr: "في الانتظار", activeAr: "جاري العمل", doneAr: "تم الإكمال" },
  { id: 2, titleAr: "بناء برنامج", waitingAr: "في الانتظار", activeAr: "جاري العمل", doneAr: "تم الإكمال" },
  { id: 3, titleAr: "مراجعة الجودة", waitingAr: "في الانتظار", activeAr: "جاري العمل", doneAr: "تم الإكمال" },
  { id: 4, titleAr: "جاهز لك", waitingAr: "قريباً", activeAr: "جاري العمل", doneAr: "جاهز" },
];

function splitRemaining(ms: number): { hours: number; minutes: number; seconds: number } {
  const safe = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  };
}

/** Quiz/profile analysis is already done — step 1 completes immediately. */
export function stepForElapsedMs(elapsedMs: number): ProgramPreparationStepId {
  if (elapsedMs >= PROGRAM_PREPARATION_HOLD_MS * 0.75) return 4;
  if (elapsedMs >= PROGRAM_PREPARATION_HOLD_MS * 0.45) return 3;
  return 2;
}

export function resolveProgramPreparationHold(input: {
  createdAt?: string | null;
  now?: Date | number;
  /** Coach already assigned a visible program — unlock immediately. */
  coachAssigned?: boolean;
}): ProgramPreparationHold {
  const empty: ProgramPreparationHold = {
    active: false,
    remainingMs: 0,
    elapsedMs: 0,
    unlocksAt: null,
    hours: 0,
    minutes: 0,
    seconds: 0,
    currentStep: 4,
  };

  if (input.coachAssigned) return empty;

  const created = input.createdAt?.trim();
  if (!created) return empty;

  const start = new Date(created).getTime();
  if (!Number.isFinite(start)) return empty;

  const now = typeof input.now === "number" ? input.now : (input.now ?? new Date()).getTime();
  const elapsedMs = Math.max(0, now - start);
  const remainingMs = Math.max(0, PROGRAM_PREPARATION_HOLD_MS - elapsedMs);
  const active = remainingMs > 0;
  const clock = splitRemaining(remainingMs);

  return {
    active,
    remainingMs,
    elapsedMs,
    unlocksAt: new Date(start + PROGRAM_PREPARATION_HOLD_MS).toISOString(),
    hours: clock.hours,
    minutes: clock.minutes,
    seconds: clock.seconds,
    currentStep: active ? stepForElapsedMs(elapsedMs) : 4,
  };
}

export function padHoldUnit(value: number): string {
  return String(value).padStart(2, "0");
}

/** Localhost-only design preview. Never active on staging or production. */
export function isLocalProgramHoldPreview(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.PROD) return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function createLocalHoldPreview(input: {
  startedAt: number;
  now: Date | number;
}): ProgramPreparationHold {
  const now = typeof input.now === "number" ? input.now : input.now.getTime();
  return resolveProgramPreparationHold({
    createdAt: new Date(input.startedAt).toISOString(),
    now,
    coachAssigned: false,
  });
}
