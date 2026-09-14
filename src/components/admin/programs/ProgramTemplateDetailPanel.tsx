import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProgramTemplateBadges } from "@/components/admin/programs/ProgramTemplateBadges";
import {
  contractNoteLabelAr,
  contractTokenLabelAr,
  contractTokenListAr,
} from "@/lib/admin/admin-contract-labels";
import {
  activityRoleLabelAr,
  mapLegacyExerciseRoleToActivityLabel,
  presentDetail,
} from "@/lib/admin/admin-template-ui";
import type { AdminProgramDetail } from "@/lib/admin/admin-programs-api";
import { formatReps, formatRest } from "@/lib/admin/admin-program-builder";
import {
  fetchGluteFemaleMediaVariantStates,
  isGluteFemaleMediaTemplateSlug,
  presentFemaleMediaAdminReadiness,
} from "@/lib/platform/exercise-media-variants";

export function ProgramTemplateDetailPanel({ detail }: { detail: AdminProgramDetail }) {
  const presentation = presentDetail(detail);
  const contract = presentation.contract;
  const gluteApplies =
    contract?.media_preference.preferred_media_variant === "FEMALE" ||
    isGluteFemaleMediaTemplateSlug(detail.slug);
  const statesQuery = useQuery({
    queryKey: ["admin-glute-female-media-states", detail.slug],
    queryFn: fetchGluteFemaleMediaVariantStates,
    enabled: gluteApplies,
    staleTime: 60_000,
  });
  const femaleMedia = presentFemaleMediaAdminReadiness({
    templateSlug: detail.slug,
    preferredMediaVariant: contract?.media_preference.preferred_media_variant ?? null,
    states: statesQuery.data,
    includeP0: true,
  });

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
          <MetaRow label="الإصدار" value={`الإصدار ${presentation.version}`} />
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
            <ul className="tpl-list tpl-list--plain">
              <li>
                <span>البيئة</span>
                <strong>
                  {contractTokenListAr(contract.eligibility.environment_requirements)}
                </strong>
              </li>
              <li>
                <span>معدات مطلوبة</span>
                <strong>
                  {contract.eligibility.equipment_requirements.length
                    ? contractTokenListAr(contract.eligibility.equipment_requirements)
                    : "لا متطلبات صريحة"}
                </strong>
              </li>
              <li>
                <span>قدرات منزلية</span>
                <strong>
                  {contract.eligibility.capability_requirements.length
                    ? contract.eligibility.capability_requirements
                        .map(
                          (item) =>
                            `${contractTokenLabelAr(item.key)}${item.required ? " (مطلوب)" : ""}`,
                        )
                        .join(" · ")
                    : "—"}
                </strong>
              </li>
              <li>
                <span>شروط مراجعة</span>
                <strong>
                  {contract.eligibility.review_conditions.length
                    ? contractTokenListAr(contract.eligibility.review_conditions)
                    : "لا"}
                </strong>
              </li>
            </ul>
          ) : (
            <p className="cc-muted">غير متوفر للقالب القديم.</p>
          )}
        </DetailBlock>

        <DetailBlock title="إشارات المراجعة">
          {contract?.review_signals?.length ? (
            <ul className="tpl-chip-row">
              {contract.review_signals.map((signal) => (
                <li key={signal}>{contractTokenLabelAr(signal)}</li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted">لا إشارات مراجعة مسجّلة.</p>
          )}
        </DetailBlock>

        <DetailBlock title="سياسة الانتقال" wide>
          {contract?.transition_policies?.length ? (
            <ul className="tpl-list tpl-list--plain">
              {contract.transition_policies.map((policy, index) => (
                <li key={`${policy.from_label ?? "from"}-${index}`}>
                  <span>
                    من {contractTokenLabelAr(policy.from_label)} إلى {contractTokenLabelAr(policy.to_label)}
                    {policy.advisory ? " · استشاري" : ""}
                  </span>
                  {policy.notes ? <strong>{contractNoteLabelAr(policy.notes)}</strong> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-muted">غير متوفر.</p>
          )}
        </DetailBlock>

        <DetailBlock title="جاهزية المكتبة" wide>
          <MetaRow label="الحالة" value={presentation.library_readiness_label} />
          {contract ? (
            <>
              <MetaRow
                label="تمارين ناقصة"
                value={String(contract.library_readiness.missing_exercise_count)}
              />
              <MetaRow
                label="وسائط ناقصة"
                value={String(contract.library_readiness.missing_media_count)}
              />
            </>
          ) : null}
          {femaleMedia.applies ? (
            <>
              <MetaRow label="صور أنثوية" value={femaleMedia.images_label} />
              <MetaRow label="ميديا عرض أنثوية" value={femaleMedia.display_label} />
              <MetaRow label="فيديو أنثوي حقيقي" value={femaleMedia.real_videos_label} />
              <MetaRow label="ترقية الفيديو" value={femaleMedia.video_upgrade_label_ar} />
              <MetaRow label="إطلاق تركيز الأرداف" value={femaleMedia.release_label_ar} />
              {femaleMedia.p0 ? (
                <>
                  <MetaRow label="صور المرحلة الأولى" value={femaleMedia.p0.images_label} />
                  <MetaRow label="عرض المرحلة الأولى" value={femaleMedia.p0.display_label} />
                  <MetaRow label="فيديو المرحلة الأولى" value={femaleMedia.p0.real_videos_label} />
                </>
              ) : null}
            </>
          ) : null}
        </DetailBlock>

        <DetailBlock title="تفضيل الوسائط" wide>
          {contract ? (
            <ul className="tpl-list tpl-list--plain">
              <li>
                <span>المُظهر المفضّل</span>
                <strong>{contractTokenLabelAr(contract.media_preference.preferred_demonstrator)}</strong>
              </li>
              <li>
                <span>نسخة الوسائط</span>
                <strong>{contractTokenLabelAr(contract.media_preference.preferred_media_variant)}</strong>
              </li>
            </ul>
          ) : (
            <p className="cc-muted">غير متوفر.</p>
          )}
        </DetailBlock>

        <DetailBlock title="التقدّم وضوابط المدرب" wide>
          {contract?.progression ? (
            <div className="tpl-progress-block">
              <p className="tpl-progress-block__label">استراتيجيات متوافقة</p>
              <ul className="tpl-chip-row">
                {contract.progression.compatible_strategies.map((item) => (
                  <li key={item}>{contractTokenLabelAr(item)}</li>
                ))}
              </ul>
              <p className="tpl-progress-block__label">متغيرات ذكية</p>
              <ul className="tpl-chip-row">
                {(contract.progression.smart_auto_variables.length
                  ? contract.progression.smart_auto_variables
                  : ["—"]
                ).map((item) => (
                  <li key={item}>{contractTokenLabelAr(item)}</li>
                ))}
              </ul>
              <p className="tpl-progress-block__label">متغيرات المدرب</p>
              <ul className="tpl-chip-row">
                {(contract.progression.coach_controlled_variables.length
                  ? contract.progression.coach_controlled_variables
                  : ["—"]
                ).map((item) => (
                  <li key={item}>{contractTokenLabelAr(item)}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="cc-muted">يُعرض من العقد عند توفره. القالب القديم لا يخترع سياسة تقدّم.</p>
          )}
        </DetailBlock>
      </div>
    </section>
  );
}

function DetailBlock({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={wide ? "tpl-detail__block tpl-detail__block--wide" : "tpl-detail__block"}>
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

export function TemplatePresentationSummary({ presentation }: { presentation: ReturnType<typeof presentDetail> }) {
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
