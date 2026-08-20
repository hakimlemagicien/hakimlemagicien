import { createFileRoute } from "@tanstack/react-router";
import { AdminInboxLayout } from "@/components/admin/AdminInboxLayout";

export const Route = createFileRoute("/admin/messages")({
  ssr: false,
  head: () => ({ meta: [{ title: "الرسائل | مركز التشغيل" }] }),
  component: AdminInboxLayout,
});
