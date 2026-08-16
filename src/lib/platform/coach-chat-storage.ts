import {
  COACH_CHAT_SEED,
  COACH_CHAT_SEED_DRAFTS,
  COACH_CHAT_SEED_DRAFT_ID,
  COACH_CHAT_SEED_MEAL_ID,
  type CoachChatDraft,
  type CoachChatMessage,
  type CoachChatState,
} from "@/lib/platform/coach-chat";

export const COACH_CHAT_STORAGE_PREFIX = "hakim_coach_chat_v1";

type ChatStoreFile = {
  version: 2;
  userId: string;
  messages: CoachChatMessage[];
  drafts: CoachChatDraft[];
};

function storageKey(userId: string) {
  return `${COACH_CHAT_STORAGE_PREFIX}:${userId}`;
}

function cloneSeed(): CoachChatState {
  return {
    messages: COACH_CHAT_SEED.map((message) => ({ ...message })),
    drafts: COACH_CHAT_SEED_DRAFTS.map((draft) => ({ ...draft })),
  };
}

function withSeedDraft(state: CoachChatState): CoachChatState {
  const hasMeal = state.messages.some((message) => message.id === COACH_CHAT_SEED_MEAL_ID);
  const hasDraft = state.drafts.some(
    (draft) => draft.id === COACH_CHAT_SEED_DRAFT_ID || draft.memberMessageId === COACH_CHAT_SEED_MEAL_ID,
  );
  if (!hasMeal || hasDraft) return state;
  const status = COACH_CHAT_SEED.find((message) => message.id === "seed-meal-status");
  const hasStatus = state.messages.some((message) => message.id === "seed-meal-status");
  return {
    messages: hasStatus || !status ? state.messages : [...state.messages, status],
    drafts: [...state.drafts, ...COACH_CHAT_SEED_DRAFTS],
  };
}

function isMessage(value: unknown): value is CoachChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as CoachChatMessage;
  return (
    typeof item.id === "string" && typeof item.role === "string" && typeof item.kind === "string"
  );
}

function isDraft(value: unknown): value is CoachChatDraft {
  if (!value || typeof value !== "object") return false;
  const item = value as CoachChatDraft;
  return typeof item.id === "string" && typeof item.memberMessageId === "string" && typeof item.status === "string";
}

export function readCoachChatState(
  userId: string,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): CoachChatState {
  if (!store) return cloneSeed();
  try {
    const raw = store.getItem(storageKey(userId));
    if (!raw) return cloneSeed();
    const parsed = JSON.parse(raw) as ChatStoreFile & { version?: number };
    const messages = Array.isArray(parsed.messages) ? parsed.messages.filter(isMessage) : [];
    const drafts = Array.isArray(parsed.drafts) ? parsed.drafts.filter(isDraft) : [];
    if (messages.length === 0) return cloneSeed();
    return withSeedDraft({ messages, drafts });
  } catch {
    return cloneSeed();
  }
}

export function writeCoachChatState(
  userId: string,
  state: CoachChatState,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
) {
  if (!store) return state;
  const next: ChatStoreFile = { version: 2, userId, messages: state.messages, drafts: state.drafts };
  store.setItem(storageKey(userId), JSON.stringify(next));
  return state;
}

export function readCoachChat(
  userId: string,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): CoachChatMessage[] {
  return readCoachChatState(userId, store).messages;
}

export function writeCoachChat(
  userId: string,
  messages: CoachChatMessage[],
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
) {
  const current = readCoachChatState(userId, store);
  return writeCoachChatState(userId, { ...current, messages }, store).messages;
}

export function appendCoachChatMessage(
  userId: string,
  message: CoachChatMessage,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
) {
  const current = readCoachChatState(userId, store);
  return writeCoachChatState(userId, { ...current, messages: [...current.messages, message] }, store).messages;
}
