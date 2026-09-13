import { createFileRoute } from "@tanstack/react-router";
import { TrainingAssignmentReviewInbox } from "@/components/admin/TrainingAssignmentReviewInbox";

export const Route = createFileRoute("/admin/notifications")({
  ssr: false,
  head: () => ({ meta: [{ title: "مراجعات التعيين | مركز التشغيل" }] }),
  component: TrainingAssignmentReviewInbox,
});
