import type { MembershipResponse } from "@/lib/platform/membership";
import type { PlatformActivitySnapshot } from "@/lib/platform/platform-activity";
import { buildProgressDashboard } from "@/lib/platform/progress-experience";
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

const GOAL_LABELS: Record<string, string> = {
  cut: "خسارة الدهون",
  bulk: "بناء العضلات",
  fitness: "تحسين اللياقة",
  "fat-loss": "خسارة الدهون",
  muscle: "بناء العضلات",
};

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

export function formatMemberCode(userId: string): string {
  const compact = userId.replace(/-/g, "").slice(0, 5).toUpperCase();
  return `#HKM-${compact}`;
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
  if (membership.is_paid && membership.is_active) return "active";
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
): ProfileProgramSummary {
  const goalKey = training?.answers.goalId ?? profile?.goal ?? training?.goal ?? "";
  const goalLabel = GOAL_LABELS[goalKey] ?? profile?.goal ?? training?.goal ?? "غير محدد";

  return {
    currentGoal: goalLabel,
    programName: profile?.trainingType ? `برنامج ${profile.trainingType}` : "برنامج حكيم المخصص",
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
      label: "Hakim Points",
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

export const MEMBERSHIP_FEATURE_LABELS: { key: keyof MembershipResponse["features"]; label: string }[] = [
  { key: "workout_program", label: "برنامج مخصص" },
  { key: "nutrition_plan", label: "خطة غذائية" },
  { key: "free_content", label: "مكتبة المحتوى" },
  { key: "personal_followup", label: "متابعة الكوتش" },
];
