/**
 * User-facing progress (psychological UX): 10 milestones.
 * Internal funnel: 18 actual screens — paired/continuation screens share a milestone.
 */
export const QUIZ_PROGRESS_TOTAL = 10;

/** @internal Real screen count in the main funnel (for maintainers). */
export const QUIZ_INTERNAL_SCREEN_COUNT = 18;

/**
 * Display milestone (1–10). Screens that complete each other keep the same number.
 *
 * 1 البداية          → gender
 * 2 الهدف            → goals / femaleGoals
 * 3 بياناتك          → age, measure
 * 4 نشاطك            → activity
 * 5 صحتك             → challenge / femaleChallenge, injuries
 * 6 التزامك          → investment
 * 7 تفضيلاتك         → bodyType / femaleBodyType, trainingEnvironment
 * 8 التحليل          → analysis
 * 9 النتيجة          → contact, congrats, reveal
 * 10 تفعيل حسابك     → verifyEmail, createPassword, profilePhoto, platformWelcome
 */
const DISPLAY_STEP: Record<string, number> = {
  gender: 1,
  goals: 2,
  femaleGoals: 2,
  age: 3,
  measure: 3,
  activity: 4,
  challenge: 5,
  femaleChallenge: 5,
  injuries: 5,
  investment: 6,
  bodyType: 7,
  femaleBodyType: 7,
  trainingEnvironment: 7,
  analysis: 8,
  contact: 9,
  congrats: 9,
  reveal: 9,
  verifyEmail: 10,
  createPassword: 10,
  profilePhoto: 10,
  platformWelcome: 10,
  // Legacy / branch screens
  trainingType: 9,
  pricing: 10,
  pricingDubai: 10,
  offlinePackages: 10,
  payment: 10,
};

/** Partial fill (0–1) within the current milestone bar segment. */
const SEGMENT_FILL: Record<string, number> = {
  gender: 1,
  goals: 1,
  femaleGoals: 1,
  age: 0.45,
  measure: 1,
  activity: 1,
  challenge: 0.45,
  femaleChallenge: 0.45,
  injuries: 1,
  investment: 1,
  bodyType: 0.45,
  femaleBodyType: 0.45,
  trainingEnvironment: 1,
  analysis: 1,
  contact: 0.34,
  congrats: 0.67,
  reveal: 1,
  verifyEmail: 0.25,
  createPassword: 0.5,
  profilePhoto: 0.75,
  platformWelcome: 1,
  trainingType: 1,
  pricing: 0.5,
  pricingDubai: 0.5,
  offlinePackages: 0.5,
  payment: 1,
};

export type QuizProgressBarState = {
  displayStep: number;
  total: number;
  /** 0–1 fill of the active milestone segment */
  segmentFill: number;
};

export function getQuizStepProgress(step: string): number {
  return DISPLAY_STEP[step] ?? 1;
}

export function getQuizProgressBarState(step: string): QuizProgressBarState {
  const displayStep = getQuizStepProgress(step);
  return {
    displayStep,
    total: QUIZ_PROGRESS_TOTAL,
    segmentFill: SEGMENT_FILL[step] ?? 1,
  };
}
