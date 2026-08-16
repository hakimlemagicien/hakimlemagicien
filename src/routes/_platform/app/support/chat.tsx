import { createFileRoute } from "@tanstack/react-router";
import { CoachChatPage } from "@/components/platform/support/CoachChatPage";

export const Route = createFileRoute("/_platform/app/support/chat")({
  head: () => ({ meta: [{ title: "دردشة الكوتش | Hakim Platform" }] }),
  component: CoachChatPage,
});
