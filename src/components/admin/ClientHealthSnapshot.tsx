import { Link } from "@tanstack/react-router";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import {
  clientNutritionSummary,
  clientTrainingSummary,
  trainingLocationLabel,
} from "@/lib/admin/admin-client-ops";
import { AdminCard } from "@/components/admin/AdminPage";
import { formatRelativeAge, planLabel, planStatusKind } from "@/lib/admin/admin-status";
import { AdminStatusBadge } from "@/components/admin/AdminPage";

type Props = {
  clientId: string;
  overview: AdminClientOverview;
};

export function ClientHealthSnapshot({ clientId, overview }: Props) {
  const lastActivity = overview.last_workout_at || overview.last_nutrition_at || overview.coaching?.last_message_at;

  return (
    <div className="cc-health-snapshot">
      <AdminCard>
        <h2 className="cc-section__title">العضوية</h2>
        <p>
          {overview.membership ? (
            <>
              <AdminStatusBadge tone={planStatusKind(overview.membership.tier)}>
                {planLabel(overview.membership.tier)}
              </AdminStatusBadge>{" "}
              {overview.membership.is_active ? "نشطة" : "غير نشطة"}
            </>
          ) : (
            "لا عضوية مسجّلة"
          )}
        </p>
      </AdminCard>
      <AdminCard>
        <h2 className="cc-section__title">التدريب</h2>
        <p>{clientTrainingSummary(overview)}</p>
        <p className="cc-meta">الموقع: {trainingLocationLabel(overview.training_type)}</p>
      </AdminCard>
      <AdminCard>
        <h2 className="cc-section__title">التغذية</h2>
        <p>{clientNutritionSummary(overview)}</p>
      </AdminCard>
      <AdminCard>
        <h2 className="cc-section__title">التواصل</h2>
        <p>
          {overview.coaching
            ? `${overview.coaching.unread_count > 0 ? `${overview.coaching.unread_count} غير مقروء` : "لا رسائل غير مقروءة"}`
            : "لا محادثة مسجّلة"}
        </p>
      </AdminCard>
      <AdminCard>
        <h2 className="cc-section__title">التقدم</h2>
        <p>
          {overview.last_workout_at
            ? `آخر تمرين ${formatRelativeAge(overview.last_workout_at)}`
            : "لا بيانات تقدم كافية بعد"}
        </p>
      </AdminCard>
      <AdminCard>
        <h2 className="cc-section__title">آخر نشاط</h2>
        <p>{lastActivity ? formatRelativeAge(lastActivity) : "—"}</p>
        <Link to="/admin/clients/$clientId" params={{ clientId }} search={{ tab: "activity" }} className="cc-btn cc-btn--compact">
          عرض النشاط
        </Link>
      </AdminCard>
    </div>
  );
}
