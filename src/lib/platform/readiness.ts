export type ReadinessEnergy = "low" | "medium" | "high";
export type ReadinessSleep = "poor" | "fair" | "good";
export type ReadinessBody = "good" | "fatigued" | "pain";

export type ReadinessLevel = "ready" | "balanced" | "recovery";
export type ReadinessStatus = "completed" | "skipped" | "dismissed";
export type ReadinessSource = "manual" | "health_prefill";
export type ReadinessAdjustmentDecision = "accepted" | "declined";
export type ReadinessAdjustmentChoice = "lighter" | "active_recovery";

export interface DailyReadinessCheck {
  id?: string;
  userId: string;
  localDate: string;
  timezone: string;
  energy?: ReadinessEnergy;
  sleep?: ReadinessSleep;
  body?: ReadinessBody;
  score?: number;
  level?: ReadinessLevel;
  status: ReadinessStatus;
  source: ReadinessSource;
  adjustmentDecision?: ReadinessAdjustmentDecision;
  adjustmentChoice?: ReadinessAdjustmentChoice;
  pendingSync?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReadinessAnswers = {
  energy: ReadinessEnergy;
  sleep: ReadinessSleep;
  body: ReadinessBody;
};

export const ENERGY_SCORE: Record<ReadinessEnergy, 1 | 2 | 3> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const SLEEP_SCORE: Record<ReadinessSleep, 1 | 2 | 3> = {
  poor: 1,
  fair: 2,
  good: 3,
};

export const BODY_SCORE: Record<ReadinessBody, 1 | 2 | 3> = {
  pain: 1,
  fatigued: 2,
  good: 3,
};

export const READINESS_COPY = {
  title: "فحص الجاهزية",
  description: "أخبرنا كيف تشعر لنجهز يومك بشكل أفضل. يستغرق أقل من 10 ثوانٍ.",
  energyQuestion: "كيف مستوى طاقتك اليوم؟",
  energy: {
    low: "منخفض",
    medium: "متوسط",
    high: "مرتفع",
  },
  sleepQuestion: "كيف كانت جودة نومك؟",
  sleep: {
    poor: "ضعيفة",
    fair: "مقبولة",
    good: "جيدة",
  },
  bodyQuestion: "هل تشعر بإجهاد أو ألم؟",
  body: {
    good: "لا",
    fatigued: "إجهاد بسيط",
    pain: "أشعر بألم",
  },
  painNotice: "يمكننا اقتراح يوم أخف. إذا كان الألم شديدًا أو مستمرًا، استشر مختصًا صحيًا.",
  confirm: "تأكيد الجاهزية",
  skip: "تخطي الآن",
  cardTitle: "جاهزيتك اليوم",
  update: "تحديث الجاهزية",
  readyTitle: "جاهز لخطة اليوم",
  readyBody: "طاقتك ونومك مناسبان. يمكنك متابعة خطتك المعتادة.",
  balancedTitle: "يوم متوازن",
  balancedBody: "سنحافظ على خطتك مع اقتراح وتيرة مريحة اليوم.",
  recoveryTitle: "الأفضل أن تبدأ بهدوء",
  recoveryBody: "يمكنك اختيار نشاط أخف مع الاستمرار في الماء والتغذية والمتابعة.",
  showAdjustments: "عرض خيارات التعديل",
  keepPlan: "الاحتفاظ بالخطة",
  startCta: "ابدأ يومك",
  continueCta: "تابع يومك",
} as const;

export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getLocalDateKey(
  date: Date = new Date(),
  timeZone: string = getUserTimeZone(),
): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

export function isReadinessAnswersComplete(
  answers: Partial<ReadinessAnswers>,
): answers is ReadinessAnswers {
  return Boolean(answers.energy && answers.sleep && answers.body);
}

export function computeReadinessResult(answers: ReadinessAnswers): {
  score: number;
  level: ReadinessLevel;
} {
  const score =
    ENERGY_SCORE[answers.energy] + SLEEP_SCORE[answers.sleep] + BODY_SCORE[answers.body];
  let level: ReadinessLevel = "recovery";
  if (score >= 7) level = "ready";
  else if (score >= 5) level = "balanced";
  if (answers.body === "pain") level = "recovery";
  return { score, level };
}

export function shouldAutoOpenReadiness(input: {
  isAuthenticated: boolean;
  fromStartDay: boolean;
  dataReady: boolean;
  otherCriticalOverlayOpen: boolean;
  record: DailyReadinessCheck | null;
}): boolean {
  if (!input.isAuthenticated) return false;
  if (!input.fromStartDay) return false;
  if (!input.dataReady) return false;
  if (input.otherCriticalOverlayOpen) return false;
  if (!input.record) return true;
  return (
    input.record.status !== "completed" &&
    input.record.status !== "skipped" &&
    input.record.status !== "dismissed"
  );
}

export function hasStartedToday(record: DailyReadinessCheck | null): boolean {
  return Boolean(
    record &&
    (record.status === "completed" || record.status === "skipped" || record.status === "dismissed"),
  );
}

export function didMutateDailyPlan(record: DailyReadinessCheck | null): boolean {
  void record;
  return false;
}

export function readinessRecordKey(userId: string, localDate: string): string {
  return `${userId}:${localDate}`;
}
