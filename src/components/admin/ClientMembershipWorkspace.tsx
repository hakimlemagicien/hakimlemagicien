import { Link } from "@tanstack/react-router";
import { AdminCard, AdminEmptyState, AdminSection, AdminStatusBadge } from "@/components/admin/AdminPage";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import { formatAdminDate, planLabel, planStatusKind } from "@/lib/admin/admin-status";

type Props = {
  clientId: string;
  overview: AdminClientOverview;
};

/** Client 360 — membership & billing architecture (operational depth = A6). */
export function ClientMembershipWorkspace({ clientId, overview }: Props) {
  const membership = overview.membership;

  if (!membership) {
    return (
      <AdminEmptyState
        title="لا عضوية مسجّلة"
        body="لا توجد بيانات اشتراك لهذا العميل في النظام الحالي."
        later="إدارة التفعيل والفوترة الكاملة ستُعمَّق في مرحلة A6."
      />
    );
  }

  return (
    <AdminSection>
      <AdminCard>
        <h2 className="cc-section__title">العضوية والفوترة</h2>
        <p className="cc-muted">بيانات الاشتراك الحالية — دون تعديل يدوي للصلاحيات أو تفعيل وهمي.</p>
        <dl className="cc-dl">
          <div>
            <dt>الخطة</dt>
            <dd>
              <AdminStatusBadge tone={planStatusKind(membership.tier)}>{planLabel(membership.tier)}</AdminStatusBadge>
            </dd>
          </div>
          <div>
            <dt>الحالة</dt>
            <dd>{membership.is_active ? "نشطة" : "غير نشطة"}</dd>
          </div>
          <div>
            <dt>المصدر</dt>
            <dd>{membership.source || "—"}</dd>
          </div>
          <div>
            <dt>بداية الفترة</dt>
            <dd>{formatAdminDate(membership.starts_at)}</dd>
          </div>
          <div>
            <dt>نهاية الفترة</dt>
            <dd>{membership.ends_at ? formatAdminDate(membership.ends_at) : "—"}</dd>
          </div>
          <div>
            <dt>مدفوع حتى</dt>
            <dd>{membership.paid_period_end ? formatAdminDate(membership.paid_period_end) : "—"}</dd>
          </div>
          <div>
            <dt>التجديد</dt>
            <dd>
              {membership.cancel_at_period_end
                ? "إلغاء عند نهاية الفترة"
                : membership.auto_renew
                  ? "تجديد تلقائي"
                  : "—"}
            </dd>
          </div>
          <div>
            <dt>فترة الفوترة</dt>
            <dd>
              {membership.billing_period_months ? `${membership.billing_period_months} أشهر` : "—"}
            </dd>
          </div>
          <div>
            <dt>التجديد القادم</dt>
            <dd>{membership.next_renewal_at ? formatAdminDate(membership.next_renewal_at) : "—"}</dd>
          </div>
        </dl>
      </AdminCard>

      <div className="cc-client-actions-row">
        <Link to="/admin/memberships" className="cc-btn">
          فتح الاشتراكات
        </Link>
        <Link to="/admin/payments" className="cc-btn">
          فتح المدفوعات
        </Link>
      </div>
    </AdminSection>
  );
}
