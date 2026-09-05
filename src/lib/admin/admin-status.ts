export type AdminPriority = "critical" | "high" | "normal" | "low";

export type AdminStatusKind =
  | "vip"
  | "premium"
  | "essential"
  | "free"
  | "waiting"
  | "review"
  | "resolved"
  | "closed"
  | "draft"
  | "published"
  | "archived"
  | "onboarding"
  | "active"
  | "neutral";

const PLAN_LABELS: Record<string, string> = {
  vip: "VIP",
  premium: "Premium",
  essential: "Essential",
  free: "Free",
  visitor: "زائر",
  admin: "Admin",
};

export function planLabel(tier: string | null | undefined): string {
  if (!tier) return "غير محدد";
  return PLAN_LABELS[tier.toLowerCase()] ?? tier;
}

export function planStatusKind(tier: string | null | undefined): AdminStatusKind {
  const value = tier?.toLowerCase();
  if (value === "vip") return "vip";
  if (value === "premium") return "premium";
  if (value === "essential") return "essential";
  if (value === "free") return "free";
  return "neutral";
}

export function onboardingStatus(completedAt: string | null | undefined): {
  kind: AdminStatusKind;
  label: string;
} {
  return completedAt
    ? { kind: "active", label: "مكتمل التسجيل" }
    : { kind: "onboarding", label: "تسجيل غير مكتمل" };
}

export function ticketStatusKind(status: string): AdminStatusKind {
  if (status === "received" || status === "in_review") return "review";
  if (status === "resolved") return "resolved";
  if (status === "closed") return "closed";
  return "neutral";
}

export function conversationStatusKind(status: string): AdminStatusKind {
  if (status === "waiting_for_reply" || status === "new") return "waiting";
  if (status === "closed") return "closed";
  if (status === "replied") return "resolved";
  return "neutral";
}

export function priorityLabel(priority: AdminPriority): string {
  if (priority === "critical") return "حرج";
  if (priority === "high") return "عالٍ";
  if (priority === "normal") return "عادي";
  return "منخفض";
}

export function personInitials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("");
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    numberingSystem: "latn",
  }).format(date);
}

export function todayContextLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("ar-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    numberingSystem: "latn",
  }).format(now);
}

export function dayGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "طاب يومك";
  return "مساء الخير";
}

export function formatRelativeAge(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "بدون وقت";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "بدون وقت";
  const delta = Math.max(0, now.getTime() - then);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `${days} يوم`;
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Relative stamp for directory/360 — never invents a time when the source is missing. */
export function formatAdminActivityStamp(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "—";
  const time = new Intl.DateTimeFormat("ar-AE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    numberingSystem: "latn",
  }).format(date);
  const dayDiff = Math.round((startOfLocalDay(now) - startOfLocalDay(date)) / 86_400_000);
  if (dayDiff === 0) return `اليوم ${time}`;
  if (dayDiff === 1) return `أمس ${time}`;
  if (dayDiff > 1 && dayDiff < 7) return `منذ ${dayDiff} أيام`;
  return formatAdminDate(iso);
}
