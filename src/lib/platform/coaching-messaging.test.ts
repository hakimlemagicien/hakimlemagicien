import { canUseCoachChat, isCoachAvailableAt, localHourInTimeZone } from "./coaching-messaging";
import { FREE_MEMBERSHIP_STATE } from "./membership";
import { triageMemberMessage } from "./coach-chat-triage";
import { SUPPORT_FAQS } from "./support-faq";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(!canUseCoachChat({ ...FREE_MEMBERSHIP_STATE.features, limited_coach_contact: true }, "essential"), "essential should not have coach chat");
assert(canUseCoachChat({ ...FREE_MEMBERSHIP_STATE.features, limited_coach_contact: true }, "premium"), "premium should have coach chat");
assert(canUseCoachChat({ ...FREE_MEMBERSHIP_STATE.features, personal_followup: true }, "vip"), "vip should have coach chat");
assert(!canUseCoachChat(FREE_MEMBERSHIP_STATE.features, "free"), "free should not have coach chat");
assert(SUPPORT_FAQS.length >= 6, "FAQ list should remain for support hub");

const morning = new Date("2026-08-16T08:00:00+04:00");
const night = new Date("2026-08-16T22:30:00+04:00");
const start = new Date("2026-08-16T05:00:00+04:00");
const end = new Date("2026-08-16T21:00:00+04:00");

assert(isCoachAvailableAt(morning, "Asia/Dubai") === true, "08:00 Dubai is available");
assert(isCoachAvailableAt(night, "Asia/Dubai") === false, "22:30 Dubai is offline");
assert(isCoachAvailableAt(start, "Asia/Dubai") === true, "05:00 is available");
assert(isCoachAvailableAt(end, "Asia/Dubai") === false, "21:00 is offline");
assert(localHourInTimeZone(morning, "America/New_York") !== localHourInTimeZone(morning, "Asia/Dubai"), "timezone must change the hour");
assert(triageMemberMessage({ text: "كيف أبدأ يومي" }).kind === "faq", "draft helper still classifies FAQ");
assert(triageMemberMessage({ text: "", hasImage: true }).suggestedText.length > 0, "draft helper suggests meal copy");

console.log("coaching-messaging tests passed");
