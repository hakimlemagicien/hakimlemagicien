import { createFileRoute } from "@tanstack/react-router";
import { AdminEmptyState } from "@/components/admin/AdminPage";

export const Route = createFileRoute("/admin/messages/")({
  ssr: false,
  head: () => ({ meta: [{ title: "الرسائل | مركز التشغيل" }] }),
  component: AdminMessagesIndexPage,
});

function AdminMessagesIndexPage() {
  return (
    <div className="cc-inbox__placeholder">
      <AdminEmptyState
        title="اختر محادثة"
        body="من القائمة تظهر اسم العميل والخطة ومدة الانتظار. الرد يتم هنا في نفس الشاشة."
      />
    </div>
  );
}
