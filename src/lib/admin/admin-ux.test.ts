import { buildAttentionQueue } from "./admin-attention";
import { isAdminNavActive, listAdminNavHrefs } from "./admin-nav";
import {
  dayGreeting,
  formatRelativeAge,
  onboardingStatus,
  personInitials,
  planLabel,
  planStatusKind,
  priorityLabel,
} from "./admin-status";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const queue = buildAttentionQueue({
  inbox: [
    {
      id: "c1",
      memberId: "m1",
      memberName: "Ahmed",
      memberEmail: "a@example.com",
      memberAvatarPath: null,
      memberGoal: "loss",
      membershipTier: "vip",
      status: "waiting_for_reply",
      lastMessageAt: new Date(Date.now() - 12 * 60_000).toISOString(),
      lastMessagePreview: "hello",
      lastMessageKind: "text",
      lastActor: "member",
      unreadCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: "c2",
      memberId: "m2",
      memberName: "Sara",
      memberEmail: null,
      memberAvatarPath: null,
      memberGoal: null,
      membershipTier: "premium",
      status: "replied",
      lastMessageAt: new Date().toISOString(),
      lastMessagePreview: "ok",
      lastMessageKind: "text",
      lastActor: "coach",
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  payments: [
    {
      id: "p1",
      full_name: "Omar",
      email: "o@example.com",
      phone: null,
      payment_amount: 100,
      payment_currency: "AED",
      payment_method: "bank_transfer",
      proof_path: null,
      created_at: new Date().toISOString(),
    } as never,
  ],
});

assert(queue.length === 2, "waiting inbox + pending payment only");
assert(queue[0]?.vip === true, "VIP waiting thread is ordered first");
assert(queue.every((item) => item.type && item.statusLabel), "attention metadata");
assert(queue.some((item) => item.href.includes("/admin/messages/")), "inbox action points at conversation");
assert(queue.some((item) => item.href.startsWith("/admin/payments")), "payment action points at billing");
assert(!queue.some((item) => item.clientName === "Sara"), "replied threads are not attention items");

assert(priorityLabel("high") === "عالٍ", "priority label");
assert(planLabel("vip") === "VIP", "plan label");
assert(planStatusKind("premium") === "premium", "plan tone");
assert(onboardingStatus(null).kind === "onboarding", "incomplete onboarding");
assert(onboardingStatus("2026-01-01").kind === "active", "complete onboarding");
assert(personInitials("Coach Hakim") === "CH", "initials");
assert(formatRelativeAge(new Date().toISOString()).length > 0, "relative age");
assert(dayGreeting(new Date("2026-08-20T08:00:00")).includes("صباح"), "morning greeting");

assert(listAdminNavHrefs().every((href) => href.startsWith("/admin")), "nav isolation");
assert(isAdminNavActive("/admin/messages/abc", "/admin/messages"), "inbox child is active");
assert(!isAdminNavActive("/admin/clients", "/admin"), "clients is not command center");

console.log("admin-ux tests passed");
