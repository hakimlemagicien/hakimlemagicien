import {
  canReviewCoachDrafts,
  canUseCoachChat,
  COACH_CHAT_SEED,
  COACH_CHAT_SEED_DRAFTS,
  formatChatTime,
} from "./coach-chat";
import { appendCoachChatMessage, readCoachChat, readCoachChatState } from "./coach-chat-storage";
import { dismissCoachDraft, ingestMemberMessage, sendCoachDraft } from "./coach-chat-service";
import { triageMemberMessage } from "./coach-chat-triage";
import { SUPPORT_FAQS } from "./support-faq";
import { FREE_MEMBERSHIP_STATE } from "./membership";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const memory = new Map<string, string>();
const store = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => memory.clear(),
  key: () => null,
  get length() {
    return memory.size;
  },
} as Storage;

assert(
  canUseCoachChat({ ...FREE_MEMBERSHIP_STATE.features, limited_coach_contact: true }),
  "VIP should have coach chat",
);
assert(!canUseCoachChat(FREE_MEMBERSHIP_STATE.features), "Free should not have coach chat");
assert(canReviewCoachDrafts("hakimlemagicien@gmail.com", "free"), "founder email can review drafts");
assert(canReviewCoachDrafts("other@example.com", "admin"), "admin tier can review drafts");
assert(!canReviewCoachDrafts("other@example.com", "vip"), "regular VIP cannot review drafts");
assert(SUPPORT_FAQS.length >= 6, "FAQ list should be ready for Phase 2");
assert(SUPPORT_FAQS.every((item) => item.keywords.length > 0), "FAQs need keywords for triage");
assert(COACH_CHAT_SEED[0]?.role === "coach", "seed starts with coach");
assert(COACH_CHAT_SEED_DRAFTS[0]?.status === "pending", "seed meal waits for coach");
assert(formatChatTime("2026-08-16T10:30:00+04:00").includes("10:30"), "time format");

assert(triageMemberMessage({ text: "كيف أبدأ يومي" }).kind === "faq", "start-day FAQ");
assert(triageMemberMessage({ text: "هل البرنامج مناسب للمبتدئين" }).kind === "faq", "beginner FAQ");
assert(triageMemberMessage({ text: "", hasImage: true }).kind === "meal_photo", "image is meal review");
assert(
  triageMemberMessage({ text: "هل هذه الوجبة مناسبة بعد التمرين؟" }).kind === "meal_photo",
  "meal question is meal review",
);
assert(triageMemberMessage({ text: "ارفع وزن ضغط الصدر" }).kind === "program_adjust", "load change waits");
assert(triageMemberMessage({ text: "عندي سؤال خاص عن ركبتي" }).kind === "coach_needed", "unclear goes to coach");

store.clear();
const initial = readCoachChat("user-1", store);
assert(initial.length === COACH_CHAT_SEED.length, "seed loads when empty");
assert(readCoachChatState("user-1", store).drafts.length === 1, "seed draft loads");

const next = appendCoachChatMessage(
  "user-1",
  {
    id: "extra",
    role: "member",
    kind: "text",
    text: "مرحبا",
    at: "2026-08-16T11:00:00+04:00",
  },
  store,
);
assert(next.length === COACH_CHAT_SEED.length + 1, "append adds a message");
assert(readCoachChat("user-1", store).at(-1)?.id === "extra", "persists last message");

store.clear();
const faqState = ingestMemberMessage(
  "user-2",
  {
    id: "faq-1",
    role: "member",
    kind: "text",
    text: "كيف أبدأ يومي",
    at: "2026-08-16T11:00:00+04:00",
  },
  store,
);
const faqReply = faqState.messages.at(-1);
assert(faqReply?.role === "coach" && faqReply.kind === "text" && faqReply.source === "quick", "FAQ replies instantly");
assert(faqState.drafts.filter((draft) => draft.status === "pending").length === 1, "seed draft stays pending");

const mealState = ingestMemberMessage(
  "user-2",
  {
    id: "meal-1",
    role: "member",
    kind: "image",
    text: "",
    imageSrc: "data:image/png;base64,xx",
    at: "2026-08-16T11:01:00+04:00",
  },
  store,
);
const mealNote = mealState.messages.at(-1);
assert(mealNote?.kind === "status" && mealNote.role === "system", "meal waits with status note");
const pendingMeal = mealState.drafts.find((draft) => draft.memberMessageId === "meal-1");
assert(pendingMeal?.status === "pending" && pendingMeal.category === "meal_photo", "meal creates draft");

const sent = sendCoachDraft("user-2", pendingMeal.id, "الوجبة ممتازة، كمّل نفس التوازن.", store);
assert(sent.drafts.find((draft) => draft.id === pendingMeal.id)?.status === "sent", "draft marked sent");
assert(sent.messages.at(-1)?.role === "coach" && sent.messages.at(-1)?.kind === "text", "coach reply appears after approval");

const leftover = mealState.drafts.find((draft) => draft.status === "pending" && draft.id !== pendingMeal.id);
assert(leftover, "seed draft still pending");
const dismissed = dismissCoachDraft("user-2", leftover.id, store);
assert(dismissed.drafts.find((draft) => draft.id === leftover.id)?.status === "dismissed", "draft can be dismissed");
assert(dismissed.messages.at(-1)?.role === "coach", "dismiss does not send a fake reply");

console.log("coach-chat tests passed");
