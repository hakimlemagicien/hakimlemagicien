import {
  AdminCard,
  AdminConceptKpiRow,
  AdminConceptTabs,
  AdminHonestEmpty,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/AdminPage";
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

  const unavailable = "لا مقياس معتمد";
  const kpis =
    moduleId === "progress"
      ? [
          { id: "one", label: "الوزن الحالي", value: "—", hint: unavailable, tone: "unavailable" as const },
          { id: "two", label: "الالتزام الأسبوعي", value: "—", hint: "لا نسبة التزام معتمدة بعد", tone: "unavailable" as const },
          { id: "three", label: "سلسلة التدريب", value: "—", hint: unavailable, tone: "unavailable" as const },
          { id: "four", label: "مراجعات مستحقة", value: "—", hint: module.source, tone: "unavailable" as const },
        ]
      : moduleId === "notifications"
        ? [
            { id: "one", label: "حملات", value: "—", hint: unavailable, tone: "unavailable" as const },
            { id: "two", label: "معدل الفتح", value: "—", hint: "لا معدل فتح معتمد", tone: "unavailable" as const },
            { id: "three", label: "معدل النقر", value: "—", hint: unavailable, tone: "unavailable" as const },
            { id: "four", label: "مجدولة", value: "—", hint: unavailable, tone: "unavailable" as const },
          ]
        : [
            { id: "one", label: "المستخدمون النشطون", value: "—", hint: unavailable, tone: "unavailable" as const },
            { id: "two", label: "الاحتفاظ", value: "—", hint: unavailable, tone: "unavailable" as const },
            { id: "three", label: "الإيرادات", value: "—", hint: "لا إيراد شهري معتمد في هذه الشاشة", tone: "unavailable" as const },
            { id: "four", label: "التحويل", value: "—", hint: unavailable, tone: "unavailable" as const },
          ];

  const title =
    moduleId === "analytics"
      ? "التحليلات والإعدادات"
      : moduleId === "notifications"
        ? "الإشعارات"
        : module.title;

  const subtitle =
    moduleId === "analytics"
      ? "قياس نمو المنصة يظهر هنا فقط عندما تتوفر استعلامات معتمدة — بدون MRR أو نسب وهمية."
      : module.purpose;

  return (
    <>
      <AdminPageHeader
        title={title}
        subtitle={subtitle}
        actions={<AdminStatusBadge tone="foundation">قريبًا</AdminStatusBadge>}
      />

      {moduleId === "analytics" ? (
        <AdminConceptTabs
          items={[
            { id: "overview", label: "نظرة عامة", to: "/admin/analytics", active: true },
            { id: "clients", label: "العملاء", to: "/admin/clients" },
            { id: "notifications", label: "الإشعارات", to: "/admin/notifications" },
            { id: "settings", label: "إعدادات النظام", to: "/admin/settings" },
          ]}
        />
      ) : null}

      <AdminConceptKpiRow metrics={kpis} />

      <div className="cc-placeholder-grid">
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
          <AdminHonestEmpty
            title="لا رسم نمو معتمد"
            body="لا سلسلة زمنية ولا معدل فتح إشعارات في هذه المرحلة. مركز التشغيل يعرض الأرقام الحية من الرسائل والمدفوعات."
          />
        </AdminCard>
        <AdminCard>
          <h2 className="cc-section__title">توزيع الاشتراكات</h2>
          <p className="cc-muted">التوزيع الحقيقي يظهر في صفحة العضويات من الاشتراكات المسجّلة، وليس من رسم وهمي هنا.</p>
        </AdminCard>
      </div>

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
