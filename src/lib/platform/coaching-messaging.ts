export const COACH_CHAT_NAME = "الكوتش حكيم";
export const COACH_REPLY_SLA = "يرد عادةً خلال ساعة";
export const COACHING_CHAT_BUCKET = "coaching-chat";
export const COACHING_SIGNED_URL_TTL_SECONDS = 50 * 60;
export const COACHING_VOICE_MAX_MS = 60_000;
export const COACHING_MESSAGE_PAGE_SIZE = 40;

/** Availability window in the member's local timezone — not realtime presence. */
export const COACH_AVAILABILITY_START_HOUR = 5;
export const COACH_AVAILABILITY_END_HOUR = 21;

export type CoachingConversationStatus = "new" | "waiting_for_reply" | "replied" | "closed";
export type CoachingMessageKind = "text" | "image" | "voice";
export type CoachingActor = "member" | "coach";

export type CoachingConversation = {
  id: string;
  memberId: string;
  status: CoachingConversationStatus;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageKind: CoachingMessageKind | null;
  lastActor: CoachingActor | null;
  memberLastReadAt: string | null;
  coachLastReadAt: string | null;
  createdAt: string;
};

export type CoachingMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  actor: CoachingActor;
  kind: CoachingMessageKind;
  body: string | null;
  createdAt: string;
  attachmentKind: "image" | "voice" | "video" | null;
  storagePath: string | null;
  mimeType: string | null;
  durationMs: number | null;
  byteSize: number | null;
  signedUrl?: string | null;
  clientStatus?: "sending" | "failed";
  clientId?: string;
};

export type CoachingInboxRow = {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  memberAvatarPath: string | null;
  memberGoal: string | null;
  membershipTier: string | null;
  status: CoachingConversationStatus;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageKind: CoachingMessageKind | null;
  lastActor: CoachingActor | null;
  unreadCount: number;
  createdAt: string;
  memberAvatarUrl?: string | null;
};

export type CoachingNotification = {
  id: string;
  conversationId: string | null;
  messageId: string | null;
  kind: "member_message" | "coach_reply";
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

export function canUseCoachChat(features: {
  limited_coach_contact: boolean;
  personal_followup: boolean;
}) {
  return features.limited_coach_contact || features.personal_followup;
}

export function localHourInTimeZone(date: Date, timeZone: string) {
  const hourText = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).format(date);
  return Number.parseInt(hourText, 10);
}

/** Schedule window 05:00–21:00 in the given timezone. 21:00 is offline. */
export function isCoachAvailableAt(
  date: Date = new Date(),
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  const hour = localHourInTimeZone(date, timeZone);
  if (!Number.isFinite(hour)) return false;
  return hour >= COACH_AVAILABILITY_START_HOUR && hour < COACH_AVAILABILITY_END_HOUR;
}

export function coachAvailabilityLabel(available: boolean) {
  return available ? "متصل" : "غير متصل";
}

export function formatChatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-AE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    numberingSystem: "latn",
  }).format(date);
}

export function formatInboxTime(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ar-AE", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(date);
}

export function conversationStatusLabel(status: CoachingConversationStatus) {
  if (status === "new") return "جديدة";
  if (status === "waiting_for_reply") return "بانتظار رد";
  if (status === "replied") return "تم الرد";
  return "مغلقة";
}

export function createClientMessageId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
