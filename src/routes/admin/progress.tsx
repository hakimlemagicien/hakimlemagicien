import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/progress")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/admin/training" });
  },
  head: () => ({ meta: [{ title: "عمليات التدريب | مركز التشغيل" }] }),
});
