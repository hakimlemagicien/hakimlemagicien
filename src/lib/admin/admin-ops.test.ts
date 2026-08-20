import { buildAttentionQueue, compareAttentionItems, sortCoachingInbox } from "./admin-attention";
import {
  allowedSupportTransitions,
  isAllowedSupportTransition,
  snapshotAttentionCount,
  SUPPORT_TRANSITIONS,
} from "./admin-ops-api";
import { ATTENTION_SIGNAL_CONTRACTS } from "./admin-architecture";
import type { CoachingInboxRow } from "../platform/coaching-messaging";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const fakeSignals = ["low_adherence", "stalled_progress", "injury_flag", "progress_review_due"];
assert(
  fakeSignals.every((id) => ATTENTION_SIGNAL_CONTRACTS.some((item) => item.id === id && item.status === "DOMAIN_RULE_REQUIRED")),
  "fake business signals stay deferred",
);
assert(!ATTENTION_SIGNAL_CONTRACTS.some((item) => item.id === "low_adherence" && item.status === "LIVE"), "adherence is not live");

const olderVip: CoachingInboxRow = {
  id: "c-old",
  memberId: "m1",
  memberName: "VIP wait",
  memberEmail: null,
  memberAvatarPath: null,
  memberGoal: null,
  membershipTier: "vip",
  status: "waiting_for_reply",
  lastMessageAt: "2026-08-20T10:00:00.000Z",
  lastMessagePreview: "old",
  lastMessageKind: "text",
  lastActor: "member",
  unreadCount: 1,
  createdAt: "2026-08-20T09:00:00.000Z",
};
const newerWait: CoachingInboxRow = {
  ...olderVip,
  id: "c-new",
  memberId: "m2",
  memberName: "Premium wait",
  membershipTier: "premium",
  lastMessageAt: "2026-08-20T12:00:00.000Z",
};
const replied: CoachingInboxRow = {
  ...newerWait,
  id: "c-done",
  memberName: "Replied",
  status: "replied",
  unreadCount: 0,
};

const inboxSorted = sortCoachingInbox([replied, newerWait, olderVip]);
assert(inboxSorted[0]?.id === "c-old", "oldest waiting VIP first");
assert(inboxSorted[1]?.id === "c-new", "newer waiting follows");
assert(inboxSorted[2]?.id === "c-done", "replied last");

const queue = buildAttentionQueue({
  inbox: [newerWait, olderVip, replied],
  payments: [
    {
      id: "pay-old",
      full_name: "Pay",
      email: "p@example.com",
      phone: null,
      payment_amount: 87,
      payment_currency: "USD",
      payment_method: "bank_transfer",
      proof_path: null,
      created_at: "2026-08-20T08:00:00.000Z",
    } as never,
  ],
  support: [
    {
      id: "t1",
      ticketCode: "T-1",
      userId: "u1",
      email: "s@example.com",
      displayName: "Support user",
      category: "technical",
      status: "received",
      subject: "help",
      createdAt: "2026-08-20T11:00:00.000Z",
      updatedAt: "2026-08-20T11:00:00.000Z",
    },
    {
      id: "t-closed",
      ticketCode: "T-2",
      userId: null,
      email: null,
      displayName: "Closed",
      category: "account",
      status: "closed",
      subject: "done",
      createdAt: "2026-08-20T07:00:00.000Z",
      updatedAt: "2026-08-20T07:00:00.000Z",
    },
  ],
  now: new Date("2026-08-20T13:00:00.000Z"),
});

assert(queue.every((item) => item.priority === "high"), "no invented critical risk score");
assert(!queue.some((item) => item.id === "support:t-closed"), "closed tickets are not attention");
assert(!queue.some((item) => item.reason.includes("التزام") || item.reason.toLowerCase().includes("adherence")), "no fake adherence");
assert(queue[0]?.category === "coaching" && queue[0]?.vip === true, "VIP coaching ranks first in coaching category");
assert(compareAttentionItems(queue[0]!, queue[1]!) <= 0, "attention comparator is stable");
assert(queue.some((item) => item.href === "/admin/payments"), "payment action");
assert(queue.some((item) => item.href.includes("/admin/support")), "support action");

assert(SUPPORT_TRANSITIONS.received.join(",") === "in_review,closed", "received transitions");
assert(allowedSupportTransitions("in_review").includes("resolved"), "in_review can resolve");
assert(allowedSupportTransitions("closed").length === 0, "closed is terminal");
assert(!isAllowedSupportTransition("closed", "received"), "closed cannot return to received");
assert(isAllowedSupportTransition("received", "in_review"), "received can enter review");

assert(
  snapshotAttentionCount({ unreadThreads: 1, waitingThreads: 2, pendingPayments: 3, openSupport: 4 }) === 10,
  "snapshot attention sums live counts only",
);

console.log("admin-ops tests passed");
