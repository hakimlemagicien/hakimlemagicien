import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import type { AdminPermission } from "@/lib/admin/admin-permissions";
import { permissionDeniedMessage } from "@/lib/admin/admin-permissions";

type ForbiddenSearch = {
  from?: string;
  permission?: AdminPermission;
};

export const Route = createFileRoute("/admin/forbidden")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): ForbiddenSearch => ({
    from: typeof search.from === "string" ? search.from : undefined,
    permission: typeof search.permission === "string" ? (search.permission as AdminPermission) : undefined,
  }),
  head: () => ({ meta: [{ title: "صلاحية غير كافية | مركز التشغيل" }] }),
  component: AdminForbiddenPage,
});

function AdminForbiddenPage() {
  const { from, permission } = Route.useSearch();
  return (
    <>
      <AdminPageHeader
        title="ليس لديك صلاحية للوصول إلى هذا القسم"
        subtitle={permission ? permissionDeniedMessage(permission) : "تواصل مع مدير النظام إذا كنت تحتاج وصولًا إضافيًا."}
      />
      {from ? <p className="cc-muted">المسار المطلوب: {from}</p> : null}
      <a href="/admin" className="cc-btn cc-btn--primary">
        العودة لمركز التشغيل
      </a>
    </>
  );
}
