import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { CoachOverrideReview, CoachOverrideType, ExerciseAlternative } from "@/lib/platform/coach-override/types";
import { overrideTypeLabelAr, reviewStatusLabelAr, reviewStatusTone } from "@/lib/admin/matrix-impact-labels";

type Props = {
  review: CoachOverrideReview;
  overrideType: CoachOverrideType;
  coachNote?: string | null;
  busy?: boolean;
  applying?: boolean;
  showAlternatives?: boolean;
  onApply: () => void;
  onUseAlternative: (alt: ExerciseAlternative) => void;
  onToggleAlternatives?: () => void;
  onCancel: () => void;
};

function StatusIcon({ status }: { status: CoachOverrideReview["status"] }) {
  if (status === "BLOCKED") return <ShieldAlert className="cc-matrix-impact__icon cc-matrix-impact__icon--blocked" aria-hidden />;
  if (status === "SAFE_WITH_IMPACT") return <AlertTriangle className="cc-matrix-impact__icon cc-matrix-impact__icon--impact" aria-hidden />;
  if (status === "ALTERNATIVE_RECOMMENDED") return <Info className="cc-matrix-impact__icon cc-matrix-impact__icon--alt" aria-hidden />;
  return <CheckCircle2 className="cc-matrix-impact__icon cc-matrix-impact__icon--safe" aria-hidden />;
}

export function MatrixImpactCard({
  review,
  overrideType,
  coachNote,
  busy,
  applying,
  showAlternatives,
  onApply,
  onUseAlternative,
  onToggleAlternatives,
  onCancel,
}: Props) {
  const tone = reviewStatusTone(review.status);
  const primaryAlternative = review.alternatives[0] ?? null;
  const canApply = review.status !== "BLOCKED";
  const applyLabel =
    review.status === "SAFE"
      ? "تطبيق التعديل"
      : review.status === "SAFE_WITH_IMPACT"
        ? "تأكيد التعديل"
        : review.status === "ALTERNATIVE_RECOMMENDED"
          ? "متابعة الطلب الأصلي"
          : "";

  return (
    <section className={["cc-matrix-impact", `cc-matrix-impact--${tone}`].join(" ")} aria-live="polite">
      <header className="cc-matrix-impact__header">
        <StatusIcon status={review.status} />
        <div>
          <p className="cc-kicker">مراجعة تأثير التعديل</p>
          <h3 className="cc-matrix-impact__title">{reviewStatusLabelAr(review.status)}</h3>
          <p className="cc-muted">التعديل المطلوب: {overrideTypeLabelAr(overrideType)}</p>
        </div>
      </header>

      {coachNote ? (
        <p className="cc-matrix-impact__note">
          <strong>ملاحظة المدرب:</strong> {coachNote}
        </p>
      ) : null}

      {review.impacts.length > 0 ? (
        <div className="cc-matrix-impact__section">
          <h4>تأثير التغيير</h4>
          <ul className="cc-matrix-impact__list">
            {review.impacts.map((item) => (
              <li key={`${item.code}-${item.dimension}`} data-severity={item.severity}>
                <span>{item.dimension}</span>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.blockingReasons.length > 0 ? (
        <div className="cc-matrix-impact__section cc-matrix-impact__section--blocked">
          <h4>سبب المنع</h4>
          <ul className="cc-matrix-impact__list">
            {review.blockingReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.warnings.length > 0 ? (
        <div className="cc-matrix-impact__section">
          <h4>تحذيرات</h4>
          <ul className="cc-matrix-impact__list">
            {review.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {primaryAlternative ? (
        <div className="cc-matrix-impact__alt">
          <h4>البديل الموصى به</h4>
          <p dir="ltr" className="cc-matrix-impact__alt-id">
            {primaryAlternative.external_id}
          </p>
          <p>{primaryAlternative.name_ar}</p>
          <p className="cc-muted">{primaryAlternative.reason}</p>
        </div>
      ) : review.status === "BLOCKED" && review.alternatives.length === 0 ? (
        <p className="cc-matrix-impact__no-alt">NO_SAFE_ALTERNATIVE_IDENTIFIED</p>
      ) : null}

      {showAlternatives && review.alternatives.length > 1 ? (
        <ul className="cc-matrix-impact__alt-list">
          {review.alternatives.slice(1).map((alt) => (
            <li key={alt.external_id}>
              <button
                type="button"
                className="cc-btn cc-btn--ghost cc-btn--compact"
                disabled={busy || applying}
                onClick={() => onUseAlternative(alt)}
              >
                {alt.external_id} — {alt.name_ar}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {review.nutritionReviewRecommended ? (
        <p className="cc-muted">يُوصى بمراجعة التغذية لاحقاً — بدون تعديل تلقائي.</p>
      ) : null}

      <footer className="cc-matrix-impact__actions">
        {review.status === "BLOCKED" ? (
          <>
            {review.alternatives.length > 0 ? (
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={busy || applying}
                onClick={() => primaryAlternative && onUseAlternative(primaryAlternative)}
              >
                عرض بدائل آمنة
              </button>
            ) : null}
            <button type="button" className="cc-btn" onClick={onCancel}>
              إلغاء
            </button>
          </>
        ) : null}

        {review.status === "ALTERNATIVE_RECOMMENDED" ? (
          <>
            {primaryAlternative ? (
              <button
                type="button"
                className="cc-btn cc-btn--primary"
                disabled={busy || applying}
                onClick={() => onUseAlternative(primaryAlternative)}
              >
                استخدام البديل المقترح
              </button>
            ) : null}
            {review.alternatives.length > 1 && onToggleAlternatives ? (
              <button type="button" className="cc-btn" disabled={busy || applying} onClick={onToggleAlternatives}>
                عرض بدائل أخرى
              </button>
            ) : null}
            {canApply ? (
              <button
                type="button"
                className="cc-btn"
                disabled={busy || applying}
                onClick={onApply}
              >
                {applyLabel}
              </button>
            ) : null}
            <button type="button" className="cc-btn cc-btn--ghost" onClick={onCancel}>
              إلغاء
            </button>
          </>
        ) : null}

        {(review.status === "SAFE" || review.status === "SAFE_WITH_IMPACT") && canApply ? (
          <>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              disabled={busy || applying}
              onClick={onApply}
            >
              {applying ? "جاري التطبيق…" : applyLabel}
            </button>
            <button type="button" className="cc-btn" onClick={onCancel}>
              إلغاء
            </button>
          </>
        ) : null}
      </footer>
    </section>
  );
}
