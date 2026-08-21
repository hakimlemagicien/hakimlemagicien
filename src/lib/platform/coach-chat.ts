import type { MembershipTier } from "@/lib/platform/membership";
import { isFounderReviewEmail } from "@/lib/platform/membership";

export const COACH_CHAT_NAME = "الكوتش حكيم";
export const COACH_CHAT_STATUS = "عادةً يرد خلال ساعة";

export type CoachChatRole = "coach" | "member" | "system";
export type CoachMessageSource = "coach" | "quick" | "system";
export type CoachTriageKind = "faq" | "meal_photo" | "program_adjust" | "coach_needed";
export type CoachChatDraftStatus = "pending" | "sent" | "dismissed";

export type CoachChatDraft = {
  id: string;
  memberMessageId: string;
  category: Exclude<CoachTriageKind, "faq">;
  status: CoachChatDraftStatus;
  suggestedText: string;
  createdAt: string;
};

export type CoachChatMessage =
  | {
      id: string;
      role: "member" | "coach";
      kind: "text";
      text: string;
      at: string;
      source?: CoachMessageSource;
      triage?: CoachTriageKind;
    }
  | {
      id: string;
      role: "member" | "coach";
      kind: "image";
      text: string;
      imageSrc: string;
      at: string;
      triage?: CoachTriageKind;
    }
  | {
      id: string;
      role: "coach";
      kind: "progress";
      commitmentPct: number;
      sessions: number;
      at: string;
    }
  | {
      id: string;
      role: "system";
      kind: "status";
      text: string;
      at: string;
      triage: Exclude<CoachTriageKind, "faq">;
      draftId: string;
    };

export type CoachChatState = {
  messages: CoachChatMessage[];
  drafts: CoachChatDraft[];
};

export type CoachChatMemberMessage =
  | (Extract<CoachChatMessage, { kind: "text" }> & { role: "member" })
  | (Extract<CoachChatMessage, { kind: "image" }> & { role: "member" });

export function canUseCoachChat(
  features: { limited_coach_contact: boolean; personal_followup: boolean },
  tier?: string | null,
) {
  if (tier === "essential" || tier === "free" || tier === "visitor") return false;
  if (tier === "premium" || tier === "vip" || tier === "admin") return true;
  return features.limited_coach_contact || features.personal_followup;
}

export function canReviewCoachDrafts(email: string | null | undefined, tier: MembershipTier) {
  return isFounderReviewEmail(email) || tier === "admin";
}

export function pendingDrafts(drafts: CoachChatDraft[]) {
  return drafts.filter((draft) => draft.status === "pending");
}

export const COACH_CHAT_SEED_MEAL_ID = "seed-meal";
export const COACH_CHAT_MEAL_ASSET = "seed-meal-photo";
export const COACH_CHAT_SEED_DRAFT_ID = "seed-meal-draft";

export const COACH_CHAT_SEED: CoachChatMessage[] = [
  {
    id: "seed-hello",
    role: "coach",
    kind: "text",
    text: "مرحباً حكيم، شاهدت تقدمك هذا الأسبوع. أداء ممتاز 👋",
    at: "2026-08-16T10:30:00+04:00",
    source: "coach",
  },
  {
    id: "seed-thanks",
    role: "member",
    kind: "text",
    text: "شكراً كوتش، أشعر أن الأوزان أصبحت أسهل.",
    at: "2026-08-16T10:32:00+04:00",
    triage: "program_adjust",
  },
  {
    id: "seed-press",
    role: "coach",
    kind: "text",
    text: "رائع، سنرفع وزن ضغط الصدر قليلاً في الحصة القادمة.",
    at: "2026-08-16T10:34:00+04:00",
    source: "coach",
  },
  {
    id: "seed-progress",
    role: "coach",
    kind: "progress",
    commitmentPct: 86,
    sessions: 3,
    at: "2026-08-16T10:34:20+04:00",
  },
  {
    id: COACH_CHAT_SEED_MEAL_ID,
    role: "member",
    kind: "image",
    text: "هل هذه الوجبة مناسبة بعد التمرين؟",
    imageSrc: COACH_CHAT_MEAL_ASSET,
    at: "2026-08-16T10:36:00+04:00",
    triage: "meal_photo",
  },
  {
    id: "seed-meal-status",
    role: "system",
    kind: "status",
    text: "صورة الوجبة وصلت. جهّزت مسودة للكوتش — يرد بعد الاعتماد.",
    at: "2026-08-16T10:36:20+04:00",
    triage: "meal_photo",
    draftId: COACH_CHAT_SEED_DRAFT_ID,
  },
];

export const COACH_CHAT_SEED_DRAFTS: CoachChatDraft[] = [
  {
    id: COACH_CHAT_SEED_DRAFT_ID,
    memberMessageId: COACH_CHAT_SEED_MEAL_ID,
    category: "meal_photo",
    status: "pending",
    suggestedText:
      "نعم، الوجبة مناسبة بعد التمرين: بروتين مع كارب وخضار. حافظ على نفس التوازن، وزيد الماء.",
    createdAt: "2026-08-16T10:36:20+04:00",
  },
];

export function formatChatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-AE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dubai",
    numberingSystem: "latn",
  }).format(date);
}

export function createChatId() {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
