import {
  getMembershipTierLabel,
  isPaidMembershipTier,
  type MembershipResponse,
  type MembershipTier,
} from "@/lib/platform/membership";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import {
  buildProgressDashboard,
  type AchievementItem,
  type ProgressDashboardData,
} from "@/lib/platform/progress-experience";
import type { ProfileDetails, TrainingProfileSnapshot } from "@/lib/platform/profile-api";

export type MembershipDisplayStatus =
  | "free"
  | "active"
  | "trial"
  | "past_due"
  | "cancelled"
  | "expired"
  | "pending_activation"
  | "unknown";

export type ProfileActivityStat = {
  id: string;
  label: string;
  value: string;
  icon: string;
  href?: string;
};

export type ProfilePersonalField = {
  id: string;
  label: string;
  value: string;
  missing?: boolean;
};

export type ProfileProgramSummary = {
  currentGoal: string;
  programName: string;
  fitnessLevel: string;
  weeklyDays: string;
  calorieTarget: string;
  nutritionGoal: string;
  programStart: string;
};

export type ProfileHubStat = {
  id: string;
  value: string;
  label: string;
  accent?: boolean;
};

export type ProfileHubAchievement = {
  id: string;
  title: string;
  subtitle: string;
  tone: "blue" | "orange" | "green";
  unlocked: boolean;
};

/** Quiz goal IDs → the exact Arabic labels the client chose. */
const GOAL_LABELS: Record<string, string> = {
  fat: "خسارة الدهون",
  muscle: "بناء العضلات",
  fitness: "تحسين اللياقة والطاقة",
  athletic: "جسم رياضي ومتناسق",
  shape: "تغيير شكل الجسم",
  gain: "زيادة وزن صحي",
  glutes: "تكبير المؤخرة",
  waist: "خصر أنحف ومشدود",
  body: "جسم متناسق وأنثوي",
  fit: "جسم صحي ورياضي",
  tone: "تحسين شكل الصدر",
  cut: "خسارة الدهون",
  bulk: "بناء العضلات",
  recomp: "إعادة تركيب الجسم",
  "fat-loss": "خسارة الدهون",
  lose: "خسارة الوزن",
  strength: "زيادة القوة",
  weight_loss: "خسارة الوزن",
  toning: "شد وتنسيق الجسم",
};

export function resolveClientGoalLabel(
  ...sources: Array<string | null | undefined>
): string {
  for (const raw of sources) {
    const key = raw?.trim();
    if (!key) continue;
    const mapped = GOAL_LABELS[key] ?? GOAL_LABELS[key.toLowerCase()];
    if (mapped) return mapped;
    if (/[\u0600-\u06FF]/.test(key)) return key;
  }
  return "غير محدد";
}

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "قليل الحركة",
  light: "نشاط خفيف",
  moderate: "نشاط متوسط",
  active: "نشط",
  very_active: "نشط جداً",
};

const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
};

export function formatProfileDate(iso: string | null | undefined): string {
  if (!iso) return "غير محدد";
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatMemberSinceShort(iso: string | null | undefined): string {
  if (!iso) return "عضو جديد";
  return `منذ ${new Date(iso).toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`;
}

export function membershipBadgeLabel(tier: MembershipTier): string {
  const frame = tier === "visitor" ? "free" : tier;
  return `عضو ${getMembershipTierLabel(frame)}`;
}

export function formatMemberCode(userId: string): string {
  const compact = userId.replace(/-/g, "").slice(0, 5).toUpperCase();
  return `\u2066#HKM-${compact}\u2069`;
}

const MS_DAY = 86_400_000;

function formatCardDate(isoOrMs: string | number | null | undefined): string {
  if (isoOrMs == null || isoOrMs === "") return "—";
  const date = typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    numberingSystem: "latn",
  });
}

function formatRemainingDays(days: number): string {
  if (days <= 0) return "انتهت";
  if (days >= 3650) return "مدى الحياة";
  if (days >= 365) {
    const years = Math.round(days / 365);
    return years <= 1 ? "سنة واحدة" : `${years} سنوات`;
  }
  return `${days} يوماً`;
}

export type MembershipTerm = {
  startedAt: string;
  endsAt: string;
  remaining: string;
};

export function resolveMembershipTerm(
  membership: MembershipResponse | null,
  tier: MembershipTier,
): MembershipTerm {
  const frame = membership?.tier ?? (tier === "visitor" ? "free" : tier);
  const paid = isPaidMembershipTier(frame) && membership?.is_free !== true && frame !== "free";
  const startMs = membership?.starts_at ? Date.parse(membership.starts_at) : Number.NaN;
  let endMs = membership?.ends_at ? Date.parse(membership.ends_at) : Number.NaN;
  let days = membership?.days_remaining ?? 0;

  if (!paid) {
    return {
      startedAt: formatCardDate(Number.isFinite(startMs) ? startMs : null),
      endsAt: "—",
      remaining: "الخطة المجانية",
    };
  }

  if (!Number.isFinite(endMs)) {
    if (days > 0) {
      endMs = Date.now() + days * MS_DAY;
    } else if (Number.isFinite(startMs) && membership?.billing_period_months) {
      endMs = startMs + membership.billing_period_months * 30 * MS_DAY;
    }
  }

  if (Number.isFinite(endMs)) {
    days = Math.ceil((endMs - Date.now()) / MS_DAY);
  }

  return {
    startedAt: formatCardDate(Number.isFinite(startMs) ? startMs : null),
    endsAt: formatCardDate(Number.isFinite(endMs) ? endMs : null),
    remaining: Number.isFinite(endMs) ? formatRemainingDays(days) : "—",
  };
}

export function computeAgeFromBirthDate(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

export function resolveMembershipDisplayStatus(
  membership: MembershipResponse | null,
  loadFailed: boolean,
): MembershipDisplayStatus {
  if (loadFailed || !membership) return "unknown";
  if (membership.tier === "free") return "free";
  if (!membership.is_active) {
    if (membership.ends_at && new Date(membership.ends_at) < new Date()) return "expired";
    return "cancelled";
  }
  if (membership.is_paid || isPaidMembershipTier(membership.tier)) return "active";
  return "free";
}

export function getMembershipStatusLabel(status: MembershipDisplayStatus): string {
  const labels: Record<MembershipDisplayStatus, string> = {
    free: "مجاني",
    active: "نشطة",
    trial: "تجريبية",
    past_due: "متأخرة",
    cancelled: "ملغاة",
    expired: "منتهية",
    pending_activation: "بانتظار التفعيل",
    unknown: "غير معروفة",
  };
  return labels[status];
}

export function buildPersonalInfoFields(
  profile: ProfileDetails | null,
  training: TrainingProfileSnapshot | null,
  bodyWeightKg: number | null,
): ProfilePersonalField[] {
  const answers = training?.answers ?? {};
  const age = computeAgeFromBirthDate(answers.birthDate);
  const missing = (label: string): ProfilePersonalField => ({
    id: label,
    label,
    value: "أكمل هذه المعلومة",
    missing: true,
  });

  return [
    { id: "name", label: "الاسم", value: profile?.fullName ?? "غير محدد", missing: !profile?.fullName },
    profile
      ? { id: "code", label: "رقم العضوية", value: formatMemberCode(profile.id) }
      : missing("رقم العضوية"),
    profile?.email
      ? { id: "email", label: "البريد", value: profile.email }
      : missing("البريد"),
    profile?.phone
      ? { id: "phone", label: "الهاتف", value: profile.phone }
      : missing("الهاتف"),
    answers.gender
      ? { id: "gender", label: "الجنس", value: GENDER_LABELS[answers.gender] ?? "غير محدد" }
      : missing("الجنس"),
    answers.birthDate
      ? {
          id: "birth",
          label: "تاريخ الميلاد",
          value: `${formatProfileDate(answers.birthDate)}${age ? ` (${age} سنة)` : ""}`,
        }
      : missing("تاريخ الميلاد"),
    answers.heightCm
      ? { id: "height", label: "الطول", value: `${answers.heightCm} سم` }
      : missing("الطول"),
    bodyWeightKg || answers.weightKg
      ? {
          id: "weight",
          label: "الوزن الحالي",
          value: `${bodyWeightKg ?? answers.weightKg} كغ`,
        }
      : missing("الوزن الحالي"),
    answers.targetWeightKg
      ? { id: "target", label: "الوزن المستهدف", value: `${answers.targetWeightKg} كغ` }
      : missing("الوزن المستهدف"),
    answers.activityLevel
      ? {
          id: "activity",
          label: "مستوى النشاط",
          value: ACTIVITY_LABELS[answers.activityLevel] ?? answers.activityLevel,
        }
      : missing("مستوى النشاط"),
    profile?.city
      ? { id: "city", label: "المدينة", value: profile.city }
      : missing("المدينة"),
    profile?.country
      ? { id: "country", label: "الدولة", value: profile.country }
      : missing("الدولة"),
  ];
}

export function buildProgramSummary(
  profile: ProfileDetails | null,
  training: TrainingProfileSnapshot | null,
  quizGoalId?: string | null,
): ProfileProgramSummary {
  const goalLabel = resolveClientGoalLabel(
    training?.answers.goalId,
    quizGoalId,
    profile?.goal,
    training?.goal,
  );

  return {
    currentGoal: goalLabel,
    programName: profile?.trainingType ? `برنامج ${profile.trainingType}` : "برنامج MAAKFIT المخصص",
    fitnessLevel: training?.answers.activityLevel
      ? (ACTIVITY_LABELS[training.answers.activityLevel] ?? "غير محدد")
      : "غير محدد",
    weeklyDays: "4 أيام",
    calorieTarget: "حسب خطتك",
    nutritionGoal: goalLabel,
    programStart: formatProfileDate(profile?.programStartDate ?? training?.completedAt ?? profile?.createdAt),
  };
}

export function buildProfileActivityStats(
  userId: string,
  snapshot: PlatformActivitySnapshot,
): ProfileActivityStat[] {
  const dashboard = buildProgressDashboard(userId, snapshot);
  const monthly = dashboard.monthlySummary;
  const unlocked = dashboard.achievements.filter((a) => a.unlocked).length;
  const workoutStat = dashboard.journeyStats.find((s) => s.id === "workouts");
  const streakStat = dashboard.journeyStats.find((s) => s.id === "streak");

  return [
    {
      id: "workouts",
      label: "التمارين",
      value: workoutStat?.value ?? `${monthly.workouts}`,
      icon: "🏋️",
      href: "/app/progress",
    },
    {
      id: "meals",
      label: "الوجبات",
      value: `${monthly.meals}`,
      icon: "🥗",
      href: "/app/progress",
    },
    {
      id: "points",
      label: "MAAKFIT Points",
      value: `${dashboard.level.currentPoints}`,
      icon: "🔥",
      href: "/app/progress",
    },
    {
      id: "achievements",
      label: "الإنجازات",
      value: `${unlocked}`,
      icon: "🏆",
      href: "/app/achievements",
    },
    {
      id: "streak",
      label: "أيام الالتزام",
      value: streakStat?.value ?? "0",
      icon: "📅",
      href: "/app/progress",
    },
  ];
}

export function getAppBuildVersion(): string {
  return import.meta.env.VITE_APP_VERSION ?? "1.0.0";
}

function formatWeightKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded} كغ` : `${rounded.toFixed(1)} كغ`;
}

export function buildProfileHubStats(
  snapshot: PlatformActivitySnapshot,
  dashboard: ProgressDashboardData | null,
  bodyWeightKg: number | null,
  quizWeightKg: number | null,
): ProfileHubStat[] {
  const weight = bodyWeightKg ?? snapshot.currentWeight ?? quizWeightKg;
  const weeklyRaw = dashboard?.weeklyCards.find((card) => card.id === "workout")?.summary ?? "0";
  const weeklySessions = weeklyRaw.split("/")[0]?.trim() || "0";

  return [
    {
      id: "weight",
      value: weight != null ? formatWeightKg(weight) : "—",
      label: "الوزن الحالي",
    },
    {
      id: "streak",
      value: `${snapshot.activityStreak} أيام`,
      label: "التزام",
    },
    {
      id: "sessions",
      value: weeklySessions,
      label: "حصص هذا الأسبوع",
    },
    {
      id: "points",
      value: String(dashboard?.level.currentPoints ?? snapshot.hakimPoints),
      label: "نقطة تقدم",
      accent: true,
    },
  ];
}

export function buildProfileHubAchievements(
  achievements: AchievementItem[],
  snapshot: PlatformActivitySnapshot,
): ProfileHubAchievement[] {
  const byId = new Map(achievements.map((item) => [item.id, item]));
  const first = byId.get("first-workout");
  const streak = byId.get("streak-7");
  const nutrition = byId.get("nutrition-week");
  const activeUnlocked =
    Boolean(nutrition?.unlocked) || snapshot.activityStreak >= 7 || snapshot.bestStreak >= 7;

  return [
    {
      id: "first-workout",
      title: "بداية قوية",
      subtitle: first?.unlocked ? "أكملت أول حصة" : "أكمل أول حصة",
      tone: "blue",
      unlocked: Boolean(first?.unlocked),
    },
    {
      id: "streak-7",
      title: "مركز الهدف",
      subtitle: streak?.unlocked ? "التزام 7 أيام" : (streak?.progressLabel ?? "التزام 7 أيام"),
      tone: "orange",
      unlocked: Boolean(streak?.unlocked),
    },
    {
      id: "active-week",
      title: "أسبوع نشيط",
      subtitle: nutrition?.unlocked ? "التزمت بأسبوعك الغذائي" : "7 أيام متتالية",
      tone: "green",
      unlocked: activeUnlocked,
    },
  ];
}

export const MEMBERSHIP_FEATURE_LABELS: { key: keyof MembershipResponse["features"]; label: string }[] = [
  { key: "workout_program", label: "برنامج مخصص" },
  { key: "nutrition_plan", label: "خطة غذائية" },
  { key: "free_content", label: "مكتبة المحتوى" },
  { key: "personal_followup", label: "متابعة الكوتش" },
];
