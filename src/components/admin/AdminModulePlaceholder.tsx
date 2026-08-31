import { AdminCard, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPage";
import { getAdminPlaceholder } from "@/lib/admin/admin-nav";

const SETTINGS_AREAS = [
  { id: "account", title: "الحساب", body: "هوية المشغّل الحالي داخل مركز التشغيل." },
  { id: "team", title: "الفريق", body: "إدارة طاقم الكوتش عند اعتماد نموذج الصلاحيات." },
  { id: "permissions", title: "الصلاحيات", body: "الأدوار الحالية تبقى admin فقط. لا تغيير في قاعدة البيانات الآن." },
  { id: "notifications", title: "الإشعارات", body: "تفضيلات تنبيه الطاقم، منفصلة عن إشعارات العميل." },
  { id: "platform", title: "المنصة", body: "إعدادات تشغيل عامة عندما يتوفر عقد البيانات." },
];

export function AdminModulePlaceholder({ moduleId }: { moduleId: string }) {
  const module = getAdminPlaceholder(moduleId);

  if (!module) {
    return (
      <AdminPageHeader title="وحدة غير معروفة" subtitle="هذا المسار غير معرّف في مركز التشغيل." />
    );
  }

  return (
    <>
      <AdminPageHeader
        title={module.title}
        subtitle={module.purpose}
        actions={<AdminStatusBadge tone="foundation">قريبًا</AdminStatusBadge>}
      />
      <AdminCard>
        <dl className="cc-dl">
          <div>
            <dt>الوظيفة</dt>
            <dd>{module.summary}</dd>
          </div>
          <div>
            <dt>الحالة الحالية</dt>
            <dd>{module.source}</dd>
          </div>
          <div>
            <dt>ما سيصبح ممكناً لاحقاً</dt>
            <dd>{module.later}</dd>
          </div>
        </dl>
      </AdminCard>

      {moduleId === "settings" ? (
        <div className="cc-settings-grid">
          {SETTINGS_AREAS.map((area) => (
            <article key={area.id} className="cc-card cc-card--muted">
              <h2 className="cc-section__title">{area.title}</h2>
              <p className="cc-muted">{area.body}</p>
              <AdminStatusBadge tone="foundation">غير مفعّل</AdminStatusBadge>
            </article>
          ))}
        </div>
      ) : null}
    </>
  );
}
