import {
  createChatId,
  pendingDrafts,
  type CoachChatDraft,
  type CoachChatMemberMessage,
  type CoachChatMessage,
  type CoachChatState,
} from "@/lib/platform/coach-chat";
import { readCoachChatState, writeCoachChatState } from "@/lib/platform/coach-chat-storage";
import { statusCopyForTriage, triageMemberMessage } from "@/lib/platform/coach-chat-triage";

export function ingestMemberMessage(
  userId: string,
  message: CoachChatMemberMessage,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): CoachChatState {
  const current = readCoachChatState(userId, store);
  const triage = triageMemberMessage({
    text: message.text,
    hasImage: message.kind === "image",
  });
  const tagged = { ...message, triage: triage.kind };
  const messages: CoachChatMessage[] = [...current.messages, tagged];
  const drafts = [...current.drafts];

  if (triage.kind === "faq") {
    messages.push({
      id: createChatId(),
      role: "coach",
      kind: "text",
      text: triage.suggestedText,
      at: new Date().toISOString(),
      source: "quick",
    });
    return writeCoachChatState(userId, { messages, drafts }, store);
  }

  const draft: CoachChatDraft = {
    id: createChatId(),
    memberMessageId: tagged.id,
    category: triage.kind,
    status: "pending",
    suggestedText: triage.suggestedText,
    createdAt: new Date().toISOString(),
  };
  drafts.push(draft);
  messages.push({
    id: createChatId(),
    role: "system",
    kind: "status",
    text: statusCopyForTriage(triage.kind),
    at: new Date().toISOString(),
    triage: triage.kind,
    draftId: draft.id,
  });
  return writeCoachChatState(userId, { messages, drafts }, store);
}

export function sendCoachDraft(
  userId: string,
  draftId: string,
  text: string,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): CoachChatState {
  const current = readCoachChatState(userId, store);
  const body = text.trim();
  const target = current.drafts.find((draft) => draft.id === draftId);
  if (!body || !target || target.status !== "pending") return current;
  const drafts = current.drafts.map((draft) =>
    draft.id === draftId ? { ...draft, status: "sent" as const, suggestedText: body } : draft,
  );
  const messages: CoachChatMessage[] = [
    ...current.messages,
    {
      id: createChatId(),
      role: "coach",
      kind: "text",
      text: body,
      at: new Date().toISOString(),
      source: "coach",
    },
  ];
  return writeCoachChatState(userId, { messages, drafts }, store);
}

export function dismissCoachDraft(
  userId: string,
  draftId: string,
  store: Storage | null = typeof window === "undefined" ? null : window.localStorage,
): CoachChatState {
  const current = readCoachChatState(userId, store);
  const target = current.drafts.find((draft) => draft.id === draftId);
  if (!target || target.status !== "pending") return current;
  return writeCoachChatState(
    userId,
    {
      messages: current.messages,
      drafts: current.drafts.map((draft) =>
        draft.id === draftId ? { ...draft, status: "dismissed" as const } : draft,
      ),
    },
    store,
  );
}

export function listPendingDrafts(state: CoachChatState) {
  return pendingDrafts(state.drafts);
}
