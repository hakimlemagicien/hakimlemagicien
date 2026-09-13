import type { ReactNode } from "react";
import { ProgramTemplateBadges } from "@/components/admin/programs/ProgramTemplateBadges";
import {
  activityRoleLabelAr,
  mapLegacyExerciseRoleToActivityLabel,
  presentDetail,
  type TemplatePresentation,
} from "@/lib/admin/admin-template-ui";
import type { AdminProgramDetail } from "@/lib/admin/admin-programs-api";
import { formatReps, formatRest } from "@/lib/admin/admin-program-builder";

export function ProgramTemplateDetailPanel({ detail }: { detail: AdminProgramDetail }) {
  const presentation = presentDetail(detail);
  const contract = presentation.contract;

  return (
    <section className="tpl-detail" aria-label="تفاصيل القالب المنظمة">
      <header className="tpl-detail__header">
        <h2 className="tpl-detail__title">{presentation.name}</h2>
        <ProgramTemplateBadges presentation={presentation} />
        {presentation.is_legacy ? (
          <p className="tpl-legacy-banner" role="status">
            قالب قديم — التصنيف الغني غير متوفر. لا يتم اختلاق الجمهور أو الغرض.
          </p>
        ) : null}
      </header>

      <div className="tpl-detail__grid">
        <DetailBlock title="نظرة عامة">
          <MetaRow label="الاستراتيجية" value={presentation.primary_strategy_label} />
          <MetaRow label="المستوى" value={presentation.level_label} />
          <MetaRow label="المكان" value={presentation.environment_label} />
          <MetaRow label="الأيام" value={presentation.days_label} />
          <MetaRow label="الإصدار" value={`V${presentation.version}`} />
          <MetaRow label="الحالة" value={presentation.status_label} />
        </DetailBlock>

        <DetailBlock title="لمن هذا القالب؟">
          <p>{presentation.target_audience ?? "—"}</p>
        </DetailBlock>

        <DetailBlock title="غرض القالب">
          <p>{presentation.template_purpose ?? "—"}</p>
        </DetailBlock>

        <DetailBlock title="ملخص إداري">
          <p>{presentation.admin_summary ?? "—"}</p>
        </DetailBlock>

        <DetailBlock title="الأهلية">
          {contract ? (
            <ul className="tpl-list">
              <li>
                البيئة: {contract.eligibility.environment_requirements.join(" · ") || "—"}
              </li>
              <li>
                معدات مطلوبة:{" "}
                {contract.eligibility.equipment_requirements.length
                  ? contract.eligibility.equipment_requirements.join(" · ")
                  : "لا متطلبات صريحة"}
              </li>
              <li>
                قدرات منزلية:{" "}
                {contract.eligibility.capability_requirements.length
                  ? contract.eligibility.capability_requirements
                      .map((item) => `${item.key}${item.required ? " (مطلوب)" : ""}`)
                      .join(" · ")
                  : "—"}
              </li>
              <li>
                شروط مراجعة:{" "}
                {contract.eligibility.review_conditions.length
                  ? contract.eligibility.review_conditions.join(" · ")
                  : "لا"}
              </li>
            </ul>
          ) : (
            <p className="cc-muted">غير متوفر للقالب القديم.</p>
          )}
        </DetailBlock>

        <DetailBlock title="إشارات المراجعة">
          {contract?.review_signals?.length ? (
            <ul className="tpl-list">
              {contract.review_signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted">لا إشارات مراجعة مسجّلة.</p>
          )}
        </DetailBlock>

        <DetailBlock title="سياسة الانتقال">
          {contract?.transition_policies?.length ? (
            <ul className="tpl-list">
              {contract.transition_policies.map((policy, index) => (
                <li key={`${policy.from_label ?? "from"}-${index}`}>
                  {policy.from_label ?? "—"} → {policy.to_label ?? "—"}
                  {policy.advisory ? " (استشاري)" : ""}
                  {policy.notes ? ` — ${policy.notes}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted">غير متوفر.</p>
          )}
        </DetailBlock>

        <DetailBlock title="جاهزية المكتبة">
          <MetaRow label="الحالة" value={presentation.library_readiness_label} />
          {contract ? (
            <>
              <MetaRow label="تمارين ناقصة" value={String(contract.library_readiness.missing_exercise_count)} />
              <MetaRow label="وسائط ناقصة" value={String(contract.library_readiness.missing_media_count)} />
            </>
          ) : null}
        </DetailBlock>

        <DetailBlock title="تفضيل الوسائط">
          {contract ? (
            <ul className="tpl-list">
              <li>المُظهر المفضّل: {contract.media_preference.preferred_demonstrator}</li>
              <li>نسخة الوسائط: {contract.media_preference.preferred_media_variant}</li>
            </ul>
          ) : (
            <p className="cc-muted">غير متوفر.</p>
          )}
        </DetailBlock>

        <DetailBlock title="التقدّم وضوابط المدرب">
          {contract?.progression ? (
            <ul className="tpl-list">
              <li>استراتيجيات متوافقة: {contract.progression.compatible_strategies.join(" · ")}</li>
              <li>متغيرات ذكية: {contract.progression.smart_auto_variables.join(" · ") || "—"}</li>
              <li>
                متغيرات المدرب: {contract.progression.coach_controlled_variables.join(" · ") || "—"}
              </li>
            </ul>
          ) : (
            <p className="cc-muted">يُعرض من العقد عند توفره. القالب القديم لا يخترع سياسة تقدّم.</p>
          )}
        </DetailBlock>
      </div>
    </section>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="tpl-detail__block">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="tpl-meta-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/** Read-only weekly/session structure preview — no assignment side effects. */
export function TemplateStructurePreview({
  detail,
  readOnlyNote = true,
}: {
  detail: AdminProgramDetail;
  readOnlyNote?: boolean;
}) {
  const week = detail.weeks[0];
  return (
    <section className="tpl-preview" aria-label="معاينة هيكل القالب">
      {readOnlyNote ? (
        <p className="tpl-preview__note" role="note">
          معاينة للقراءة فقط — لا تعيين ولا تشغيل برنامج عميل.
        </p>
      ) : null}
      {!week ? (
        <p className="cc-muted">لا يوجد أسبوع معرّف في القالب.</p>
      ) : (
        <div className="tpl-preview__days">
          {week.days.map((day) => (
            <article key={day.day_number} className="tpl-preview__day">
              <header>
                <strong>
                  اليوم {day.day_number}: {day.title_ar || day.day_type}
                </strong>
                <span className="tpl-badge tpl-badge--days">
                  {day.day_type === "rest" || day.day_type === "active_recovery"
                    ? day.day_type === "active_recovery"
                      ? "استشفاء نشط"
                      : "راحة"
                    : "تدريب"}
                </span>
              </header>
              {day.day_type === "workout" ? (
                <ul className="tpl-preview__exercises">
                  {day.exercises.length === 0 ? (
                    <li className="cc-muted">لا تمارين</li>
                  ) : (
                    day.exercises.map((exercise, index) => {
                      const roleLabel = exercise.activity_role
                        ? activityRoleLabelAr(exercise.activity_role)
                        : mapLegacyExerciseRoleToActivityLabel(exercise.role);
                      return (
                        <li key={`${exercise.exercise_id}-${index}`}>
                          <div className="tpl-preview__ex-role">{roleLabel}</div>
                          <div className="tpl-preview__ex-name">
                            {exercise.client_label_ar || exercise.exercise_name_ar || "تمرين"}
                          </div>
                          <div className="tpl-preview__ex-meta">
                            {exercise.sets} مجموعات · {formatReps(exercise) || "—"} · راحة{" "}
                            {Number.isFinite(exercise.rest_seconds) ? formatRest(exercise.rest_seconds) : "—"}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              ) : (
                <p className="cc-muted">
                  {day.day_type === "active_recovery" ? "يوم استشفاء نشط" : "يوم راحة"}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function TemplatePresentationSummary({ presentation }: { presentation: TemplatePresentation }) {
  return (
    <div className="tpl-summary">
      <ProgramTemplateBadges presentation={presentation} />
      <p>
        <strong>الجمهور:</strong> {presentation.target_audience ?? "—"}
      </p>
      <p>
        <strong>الغرض:</strong> {presentation.template_purpose ?? "—"}
      </p>
    </div>
  );
}
