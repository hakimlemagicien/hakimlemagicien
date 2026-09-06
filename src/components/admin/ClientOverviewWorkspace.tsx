import { Link } from "@tanstack/react-router";
import { Clock, Dumbbell, MessageCircle, StickyNote, Target, Utensils } from "lucide-react";
import type { AdminClientOverview } from "@/lib/admin/admin-clients-api";
import type { AdminCoachNote } from "@/lib/admin/admin-notes-api";
import type { AdminConfirmRequest } from "@/components/admin/AdminConfirmDialog";
import { ClientAttentionAlerts } from "@/components/admin/ClientAttentionAlerts";
import { ClientActivityPanel } from "@/components/admin/ClientActivityPanel";
import { ClientTrainingGoalCard } from "@/components/admin/ClientTrainingGoalCard";
import { AdminStatusBadge } from "@/components/admin/AdminPage";
import { presentClientTrainingGoal } from "@/lib/admin/admin-client-goal";
import {
  clientNutritionSummary,
  clientTrainingSummary,
  directoryPlanLabelAr,
  directoryPlanTone,
  type ClientAttentionAlert,
} from "@/lib/admin/admin-client-ops";
import { formatAdminActivityStamp, formatRelativeAge } from "@/lib/admin/admin-status";

type Props = {
  clientId: string;
  overview: AdminClientOverview;
  alerts: ClientAttentionAlert[];
  notesPreview: AdminCoachNote[];
  conversationId?: string | null;
  onUpdated: () => Promise<void> | void;
  onConfirm: (request: AdminConfirmRequest) => void;
};

export function ClientOverviewWorkspace({
  clientId,
  overview,
  alerts,
  notesPreview,
  conversationId,
  onUpdated,
  onConfirm,
}: Props) {
  const goal = presentClientTrainingGoal(overview.goal);
  const lastActivity =
    overview.last_workout_at || overview.last_nutrition_at || overview.coaching?.last_message_at;
  const membership = overview.membership;

  return (
    <div className="cc-360-board">
      <div className="cc-360-board__main">
        <section className="cc-attention-panel" aria-labelledby="attention-heading">
          <h2 id="attention-heading" className="cc-section__title">
            يحتاج انتباهك
          </h2>
          <ClientAttentionAlerts alerts={alerts} />
        </section>

        <section aria-labelledby="health-heading">
          <h2 id="health-heading" className="cc-section__title">
            الملخص الصحي
          </h2>
          <div className="cc-health-mini">
            <article className="cc-health-mini__card">
              <Target size={16} aria-hidden />
              <div>
                <span>هدف العميل</span>
                <strong>{goal.displayAr}</strong>
              </div>
            </article>
            <article className="cc-health-mini__card">
              <Dumbbell size={16} aria-hidden />
              <div>
                <span>آخر تمرين</span>
                <strong>
                  {overview.last_workout_at
                    ? formatRelativeAge(overview.last_workout_at)
                    : "لا بيانات تقدم كافية بعد"}
                </strong>
              </div>
            </article>
            <article className="cc-health-mini__card">
              <Utensils size={16} aria-hidden />
              <div>
                <span>التغذية</span>
                <strong>{clientNutritionSummary(overview)}</strong>
              </div>
            </article>
            <article className="cc-health-mini__card">
              <Clock size={16} aria-hidden />
              <div>
                <span>آخر نشاط</span>
                <strong>{formatAdminActivityStamp(lastActivity)}</strong>
              </div>
            </article>
          </div>
        </section>

        <ClientTrainingGoalCard overview={overview} onUpdated={onUpdated} onConfirm={onConfirm} />

        <section className="cc-card" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="cc-section__title">
            آخر الأنشطة
          </h2>
          <ClientActivityPanel clientId={clientId} limit={5} compact />
          <Link
            to="/admin/clients/$clientId"
            params={{ clientId }}
            search={{ tab: "activity" }}
            className="cc-card-footer-link"
          >
            عرض كل الأنشطة
          </Link>
        </section>
      </div>

      <aside className="cc-360-board__side">
        <section className="cc-card" aria-labelledby="plans-heading">
          <h2 id="plans-heading" className="cc-section__title">
            الخطط الحالية
          </h2>
          <ul className="cc-plan-list">
            <li>
              <Dumbbell size={16} aria-hidden />
              <div>
                <span>التدريب</span>
                <strong>{overview.assignment ? clientTrainingSummary(overview) : "غير معين"}</strong>
              </div>
              <Link
                to="/admin/clients/$clientId"
                params={{ clientId }}
                search={{ tab: "training" }}
                className="cc-btn cc-btn--ghost cc-btn--compact"
              >
                فتح
              </Link>
            </li>
            <li>
              <Utensils size={16} aria-hidden />
              <div>
                <span>التغذية</span>
                <strong>{overview.nutrition_assignment ? clientNutritionSummary(overview) : "غير معينة"}</strong>
              </div>
              <Link
                to="/admin/clients/$clientId"
                params={{ clientId }}
                search={{ tab: "nutrition" }}
                className="cc-btn cc-btn--ghost cc-btn--compact"
              >
                فتح
              </Link>
            </li>
            <li>
              <StickyNote size={16} aria-hidden />
              <div>
                <span>العضوية</span>
                <strong>
                  {membership ? (
                    <>
                      <AdminStatusBadge tone={directoryPlanTone(membership.tier)}>
                        {directoryPlanLabelAr(membership.tier)}
                      </AdminStatusBadge>{" "}
                      {membership.is_active ? "نشطة" : "غير نشطة"}
                    </>
                  ) : (
                    "لا عضوية مسجّلة"
                  )}
                </strong>
              </div>
              <Link
                to="/admin/clients/$clientId"
                params={{ clientId }}
                search={{ tab: "membership" }}
                className="cc-btn cc-btn--ghost cc-btn--compact"
              >
                فتح
              </Link>
            </li>
          </ul>
        </section>

        <section className="cc-card" aria-labelledby="chat-heading">
          <h2 id="chat-heading" className="cc-section__title">
            التواصل
          </h2>
          {conversationId ? (
            <>
              <p>
                {overview.coaching?.unread_count
                  ? `${overview.coaching.unread_count} رسالة غير مقروءة`
                  : "محادثة تدريب مسجّلة"}
              </p>
              <Link
                to="/admin/messages/$conversationId"
                params={{ conversationId }}
                className="cc-btn cc-btn--primary"
              >
                فتح المحادثة
              </Link>
            </>
          ) : (
            <>
              <p className="cc-muted cc-plan-empty">
                <MessageCircle size={16} aria-hidden />
                لا توجد محادثة
              </p>
              <p className="cc-meta">تبدأ المحادثة عندما يراسل العميل الكوتش من التطبيق.</p>
              <Link to="/admin/messages" className="cc-btn">
                فتح صندوق الرسائل
              </Link>
            </>
          )}
        </section>

        <section className="cc-card" aria-labelledby="notes-heading">
          <h2 id="notes-heading" className="cc-section__title">
            ملاحظات المدرب
          </h2>
          {notesPreview[0] ? (
            <p className="cc-notes-excerpt">{notesPreview[0].body}</p>
          ) : (
            <p className="cc-muted">لا ملاحظات داخلية بعد.</p>
          )}
          <Link
            to="/admin/clients/$clientId"
            params={{ clientId }}
            search={{ tab: "notes" }}
            className="cc-card-footer-link"
          >
            عرض كل الملاحظات
          </Link>
        </section>
      </aside>
    </div>
  );
}
