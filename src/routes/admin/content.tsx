import { createFileRoute } from "@tanstack/react-router";
import { ContentLibraryManager } from "@/components/admin/libraries/ContentLibraryManager";

export const Route = createFileRoute("/admin/content")({
  ssr: false,
  head: () => ({ meta: [{ title: "المحتوى | مركز التشغيل" }] }),
  component: ContentLibraryManager,
});
