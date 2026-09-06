import { useMemo, useState } from "react";
import { AdminCard, AdminEmptyState, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminField } from "@/components/admin/AdminLibraryKit";
import {
  STALE_PROGRESSION_MESSAGE,
  automationOwnerLabel,
  automationScopeFor,
  parseProgressionStrategy,
  programSourceLabel,
  progressionStatusLabel,
  progressionStrategyDescription,
  progressionStrategyLabel,
  resolveProgramSource,
  PROGRESSION_STRATEGY_OPTIONS,
  type ProgressionHistoryEntry,
  type ProgressionReview,
  type ProgressionStatus,
  type ProgressionStrategy,
} from "@/lib/platform/progression-strategy";

type Props = {
  assignmentId: string | null;
  sourceTemplateId: string | null;
  generationSource: string | null;
  strategy: ProgressionStrategy;
  status: ProgressionStatus;
  lastEvaluationAt: string | null;
  reviews: ProgressionReview[];
  history: ProgressionHistoryEntry[];
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onChangeStrategy: (strategy: ProgressionStrategy, reason: string) => void;
  onKeepExercise: (externalId: string) => void;
  onReplaceExercise: (externalId: string) => void;
  onReviewExercise?: (externalId: string) => void;
};

function statusTone(status: ProgressionStatus): "success" | "waiting" | "review" | "neutral" {
  if (status === "ACTIVE") return "success";
  if (status === "WAITING_FOR_DATA") return "waiting";
  if (status === "REVIEW_REQUIRED") return "review";
  return "neutral";
}

export function ClientProgressionStrategyCard({
  assignmentId,
  sourceTemplateId,
  generationSource,
  strategy,
  status,
  lastEvaluationAt,
  reviews,
  history,
  loading,
  saving,
  error,
  onChangeStrategy,
  onKeepExercise,
  onReplaceExercise,
  onReviewExercise,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftStrategy, setDraftStrategy] = useState(strategy);
  const [reason, setReason] = useState("");
  const scope = useMemo(() => automationScopeFor(strategy), [strategy]);
  const source = resolveProgramSource({
    source_template_id: sourceTemplateId,
    generation_source: generationSource,
  });
  const openReviews = reviews.filter((item) => item.status === "open");

  if (loading) {
    return (
      <AdminCard>
        <h2 className="cc-section__title">استراتيجية التطور</h2>
        <p className="cc-muted">جاري تحميل استراتيجية التطور…</p>
      </AdminCard>
    );
  }

  if (!assignmentId) {
    return (
      <AdminCard>
        <h2 className="cc-section__title">استراتيجية التطور</h2>
        <AdminEmptyState title="لا يوجد برنامج تدريبي نشط لهذا العميل." body="عيّن برنامجًا أولًا ثم اختر كيف سيتطور." />
      </AdminCard>
    );
  }

  return (
    <AdminCard>
      <div dir="rtl">
        <h2 className="cc-section__title">استراتيجية التطور</h2>
        <p className="cc-muted">مصدر البرنامج: {programSourceLabel(source)} — منفصل عن طريقة التطور.</p>
        <p className="cc-section__lead">{progressionStrategyLabel(strategy)}</p>
        <p className="cc-muted">{progressionStrategyDescription(strategy)}</p>
        <dl className="cc-dl">
          <div>
            <dt>الأوزان</dt>
            <dd>{automationOwnerLabel(scope.load)}</dd>
          </div>
          <div>
            <dt>التكرارات</dt>
            <dd>{automationOwnerLabel(scope.reps)}</dd>
          </div>
          <div>
            <dt>المجموعات</dt>
            <dd>{automationOwnerLabel(scope.sets)}</dd>
          </div>
          <div>
            <dt>الراحة</dt>
            <dd>{automationOwnerLabel(scope.rest)}</dd>
          </div>
          <div>
            <dt>التمارين</dt>
            <dd>{automationOwnerLabel(scope.exercises)} 🔒</dd>
          </div>
          <div>
            <dt>الحالة</dt>
            <dd>
              <AdminStatusBadge tone={statusTone(status)}>{progressionStatusLabel(status)}</AdminStatusBadge>
            </dd>
          </div>
          <div>
            <dt>آخر تقييم</dt>
            <dd>{lastEvaluationAt ? lastEvaluationAt.replace("T", " ").slice(0, 16) : "بانتظار بيانات الأداء"}</dd>
          </div>
        </dl>
        {status === "WAITING_FOR_DATA" && strategy === PROGRESSION_STRATEGY_OPTIONS[0].id ? (
          <p className="cc-muted">سيبدأ التطور الذكي بعد توفر بيانات كافية من التمارين المكتملة.</p>
        ) : null}
        {strategy === PROGRESSION_STRATEGY_OPTIONS[2].id ? <p className="cc-muted">يدير المدرب تطور البرنامج يدويًا.</p> : null}
        {strategy === PROGRESSION_STRATEGY_OPTIONS[0].id && status === "ACTIVE" ? (
          <p className="cc-muted">التطور الذكي نشط.</p>
        ) : null}
        {error ? <p className="cc-field__error">{error.includes("stale_update") ? STALE_PROGRESSION_MESSAGE : error}</p> : null}
        <div className="cc-editor-toolbar">
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => { setDraftStrategy(strategy); setPickerOpen(true); }}>
            تغيير استراتيجية التطور
          </button>
        </div>

        {pickerOpen ? (
          <div className="cc-progression-picker" role="dialog" aria-label="تغيير استراتيجية التطور">
            {PROGRESSION_STRATEGY_OPTIONS.map((item) => (
              <label key={item.id} className={draftStrategy === item.id ? "cc-cms-type is-active" : "cc-cms-type"}>
                <input
                  type="radio"
                  name="progression-strategy"
                  checked={draftStrategy === item.id}
                  onChange={() => setDraftStrategy(parseProgressionStrategy(item.id))}
                />
                <strong>{item.label_ar}</strong>
                <span className="cc-muted">{item.description_ar}</span>
              </label>
            ))}
            <AdminField label="سبب التغيير" htmlFor="progression-reason">
              <input id="progression-reason" className="cc-input" value={reason} onChange={(event) => setReason(event.target.value)} />
            </AdminField>
            <div className="cc-editor-toolbar">
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={saving || !reason.trim()}
                onClick={() => {
                  onChangeStrategy(draftStrategy, reason.trim());
                  setPickerOpen(false);
                  setReason("");
                }}
              >
                حفظ الاستراتيجية
              </button>
              <button type="button" className="cc-btn" onClick={() => setPickerOpen(false)}>
                إلغاء
              </button>
            </div>
          </div>
        ) : null}

        <h3 className="cc-section__title">مراجعات المدرب</h3>
        {openReviews.length === 0 ? <p className="cc-muted">لا توجد مراجعات مطلوبة حاليًا.</p> : null}
        {openReviews.map((review) => (
          <div key={review.exercise_external_id} className="cc-progression-review">
            <p className="cc-section__lead">مراجعة تمرين مطلوبة</p>
            <p>{review.exercise_name_ar}</p>
            <p className="cc-muted">{review.reason_ar}</p>
            <p className="cc-muted">
              آخر أداء: {review.last_load ?? "—"} كغ · {review.last_reps.length ? review.last_reps.join(" / ") : "لا بيانات"}
            </p>
            <div className="cc-editor-toolbar">
              <button
                type="button"
                className="cc-btn"
                onClick={() => (onReviewExercise ?? onReplaceExercise)(review.exercise_external_id)}
              >
                مراجعة
              </button>
              <button type="button" className="cc-btn" onClick={() => onKeepExercise(review.exercise_external_id)}>
                الإبقاء عليه
              </button>
              <button type="button" className="cc-btn cc-btn--primary" onClick={() => onReplaceExercise(review.exercise_external_id)}>
                تغيير التمرين
              </button>
            </div>
          </div>
        ))}

        <h3 className="cc-section__title">سجل التطور</h3>
        {history.length === 0 ? <p className="cc-muted">بانتظار بيانات الأداء.</p> : null}
        {history.slice(0, 8).map((item) => (
          <p key={`${item.exercise_external_id}-${item.session_date}`} className="cc-muted">
            {item.exercise_name_ar} · {item.session_date} · {item.load ?? "—"} كغ · {item.reps.join(" / ") || "—"} ·{" "}
            {item.previous_load ?? "—"} → {item.next_load ?? "—"} · {item.reason_ar}
          </p>
        ))}
      </div>
    </AdminCard>
  );
}
