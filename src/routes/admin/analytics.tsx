import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CircleDollarSign, Crown, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminErrorState, AdminPageHeader } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  fetchAdminMemberSubscriptions,
  type AdminMemberSubscriptionRow,
} from "@/lib/admin/admin-billing-ops-api";
import {
  fetchMobileCommandCenter,
  type MobileCommandCenter,
} from "@/lib/admin/admin-command-center-api";
import { searchAdminClients } from "@/lib/admin/admin-clients-api";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  head: () => ({ meta: [{ title: "التحليلات | مركز التشغيل" }] }),
  component: OperationsAnalytics,
});

function OperationsAnalytics() {
  const [memberships, setMemberships] = useState<AdminMemberSubscriptionRow[]>([]);
  const [command, setCommand] = useState<MobileCommandCenter | null>(null);
  const [totalClients, setTotalClients] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([
      fetchAdminMemberSubscriptions(),
      fetchMobileCommandCenter(),
      searchAdminClients(""),
    ])
      .then(([membershipRows, commandData, clients]) => {
        setMemberships(membershipRows);
        setCommand(commandData);
        setTotalClients(clients.totalCount);
      })
      .catch((cause) => {
        console.error(cause);
        setError("تعذر تحميل التحليلات التشغيلية.");
      })
      .finally(() => setLoading(false));
  }, []);
  const counts = useMemo(
    () =>
      memberships.reduce<Record<string, number>>((acc, row) => {
        const tier = row.tier || "free";
        acc[tier] = (acc[tier] ?? 0) + 1;
        return acc;
      }, {}),
    [memberships],
  );
  const active = memberships.filter(
    (row) => row.subscriptionStatus === "active" || row.isActive,
  ).length;
  const promoUses =
    command?.promo_codes.reduce((sum, code) => sum + Number(code.uses || 0), 0) ?? 0;
  const mostSelected = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  return (
    <>
      <AdminPageHeader
        kicker="بيانات حقيقية فقط"
        title="تحليلات التشغيل"
        subtitle="نعرض فقط ما له مصدر فعلي. التحويل وCTA clicks تبقى غير متاحة حتى ربط event instrumentation."
      />
      {error ? <AdminErrorState message={error} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}
      {!loading && !error ? (
        <div className="cc-ops-stack">
          <div className="cc-command-metrics">
            <article>
              <Users />
              <span>إجمالي العملاء</span>
              <strong>{totalClients ?? "—"}</strong>
            </article>
            <article>
              <Crown />
              <span>عضويات نشطة</span>
              <strong>{active}</strong>
            </article>
            <article>
              <CircleDollarSign />
              <span>استخدام Promo</span>
              <strong>{promoUses}</strong>
            </article>
            <article>
              <BarChart3 />
              <span>الأكثر اختيارًا</span>
              <strong>{mostSelected.toUpperCase()}</strong>
            </article>
          </div>
          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>توزيع الخطط</h2>
                <p>من سجلات العضوية الحالية.</p>
              </div>
            </div>
            <div className="cc-analytics-bars">
              {["free", "essential", "premium", "vip"].map((tier) => {
                const value = counts[tier] ?? 0;
                const max = Math.max(1, ...Object.values(counts));
                return (
                  <div key={tier}>
                    <span>
                      {tier === "essential"
                        ? "PLUS"
                        : tier === "premium"
                          ? "PRO"
                          : tier.toUpperCase()}
                    </span>
                    <i>
                      <b style={{ width: `${Math.max(value ? 7 : 0, (value / max) * 100)}%` }} />
                    </i>
                    <strong>{value}</strong>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>Instrumentation غير متوفر</h2>
                <p>لا يتم اختلاق أرقام قبل إضافة أحداث موثوقة.</p>
              </div>
            </div>
            <div className="cc-unavailable-metrics">
              <span>
                Upgrade CTA clicks <b>غير مربوط</b>
              </span>
              <span>
                Conversion rate <b>غير مربوط</b>
              </span>
              <span>
                Inactive / not-started <b>يحتاج event definition</b>
              </span>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
