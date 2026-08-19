import { createFileRoute } from "@tanstack/react-router";
import { CoachChatPage } from "@/components/platform/support/CoachChatPage";

function isSafeAppReturnPath(path: string) {
  return (
    path.startsWith("/app") &&
    !path.startsWith("/app/support/chat") &&
    !path.includes("://")
  );
}

export const Route = createFileRoute("/_platform/app/support/chat")({
  head: () => ({ meta: [{ title: "دردشة الكوتش | Hakim Platform" }] }),
  validateSearch: (search: Record<string, unknown>): { from?: string } => {
    const from = typeof search.from === "string" ? search.from : undefined;
    return { from: from && isSafeAppReturnPath(from) ? from : undefined };
  },
  component: CoachChatPage,
});

