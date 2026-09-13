import { useEffect, useMemo, useState } from "react";
import {
  buildRecommendationChecks,
  primaryStrategyLabelAr,
  quizGoalIdFromClientGoal,
  recommendTemplateForClient,
  resolverStatusLabelAr,
  templateEnvironmentLabelAr,
  templateLevelLabelAr,
  type TemplateResolverResult,
} from "@/lib/admin/admin-template-ui";
import { buildAdminResolverCatalog } from "@/lib/admin/admin-template-ui";
import type { AdminProgramDetail } from "@/lib/admin/admin-programs-api";
import type { TemplateResolverInput } from "@/lib/platform/training-templates/template-resolution-types";

export type TemplateRecommendationPanelProps = {
  clientId?: string;
  goal?: string | null;
  trainingType?: string | null;
  level?: string | null;
  daysPerWeek?: number | null;
  fatLossPriority?: boolean;
  /** Optional DB templates with contracts (Phase 6: published pilots from local DB). */
  catalogDetails?: AdminProgramDetail[];
  coachOverride?: {
    selected_template_id: string;
    reason?: string | null;
  } | null;
  /** When true, fixtures fill non-overlapping gaps (e.g. Glute HOME). */
  catalogIncludesFixtures?: boolean;
  /** Opt-in in-memory Pilot 4 catalog — default false (Phase 6: DB is source). */
  includeInMemoryPilots?: boolean;
  availableEquipment?: string[] | null;
  homeCapabilities?: TemplateResolverInput["home_capabilities"];
  onPreviewRecommended?: (templateId: string) => void;
  onAssignClick?: (templateId: string) => void;
  /** Injected result for demo / tests — skips live resolve when set. */
  forcedResult?: TemplateResolverResult | null;
  className?: string;
};

export function TemplateRecommendationPanel({
  clientId,
  goal,
  trainingType,
  level,
  daysPerWeek,
  fatLossPriority = false,
  catalogDetails = [],
  coachOverride = null,
  catalogIncludesFixtures = true,
  includeInMemoryPilots = false,
  availableEquipment,
  homeCapabilities,
  onPreviewRecommended,
  onAssignClick,
  forcedResult = null,
  className,
}: TemplateRecommendationPanelProps) {
  const [traceOpen, setTraceOpen] = useState(false);
  // Coach-supplied recommendation context when assignment snapshot has no level/days yet.
  const [coachLevel, setCoachLevel] = useState(level ?? "beginner");
  const [coachDays, setCoachDays] = useState(daysPerWeek ?? 3);

  useEffect(() => {
    if (level) setCoachLevel(level);
  }, [level]);
  useEffect(() => {
    if (daysPerWeek != null) setCoachDays(daysPerWeek);
  }, [daysPerWeek]);

  const resolvedLevel = level ?? coachLevel;
  const resolvedDays = daysPerWeek ?? coachDays;
  const usedExplicitDefaults = {
    level: level == null,
    days: daysPerWeek == null,
  };
  const isHome =
    String(trainingType ?? "").toLowerCase().includes("home") &&
    !String(trainingType ?? "").toLowerCase().includes("gym_and");
  const primaryStrategy =
    String(goal ?? "").toLowerCase() === "strength" ? ("STRENGTH" as const) : undefined;

  const result = useMemo(() => {
    if (forcedResult) return forcedResult;
    const catalog = buildAdminResolverCatalog(catalogDetails, {
      includeFixtures: catalogIncludesFixtures,
      includePilots: includeInMemoryPilots,
    });
    return recommendTemplateForClient(
      {
        clientId,
        goal,
        trainingType,
        level: resolvedLevel,
        daysPerWeek: resolvedDays,
        fatLossPriority,
        coachOverride,
        primary_strategy: primaryStrategy,
        availableEquipment:
          availableEquipment ?? (isHome ? ["dumbbells", "bands"] : null),
        homeCapabilities:
          homeCapabilities ??
          (isHome
            ? {
                training_space: true,
                available_load: true,
                stable_bench_or_chair: true,
              }
            : null),
      },
      catalog,
    );
  }, [
    forcedResult,
    catalogDetails,
    catalogIncludesFixtures,
    includeInMemoryPilots,
    clientId,
    goal,
    trainingType,
    resolvedLevel,
    resolvedDays,
    fatLossPriority,
    coachOverride,
    availableEquipment,
    homeCapabilities,
    isHome,
    primaryStrategy,
  ]);

  const checks = buildRecommendationChecks(result);
  const quizId = quizGoalIdFromClientGoal(goal);
  const statusClass = `tpl-rec-status tpl-rec-status--${result.status.toLowerCase()}`;
  const recommendedId = result.coach_override_applied
    ? result.coach_selected_template_id
    : result.recommended_template_id;

  return (
    <section className={["tpl-rec", className].filter(Boolean).join(" ")} aria-label="توصية القالب">
      <header className="tpl-rec__header">
        <h2 className="cc-section__title">توصية القالب التلقائية</h2>
        <p className="cc-muted">توصية فقط — لا يتم التعيين تلقائياً.</p>
      </header>

      <div className={statusClass} role="status">
        <span className="tpl-rec-status__label">{resolverStatusLabelAr(result.status)}</span>
        {result.coach_override_applied ? (
          <span className="tpl-badge tpl-badge--override">تجاوز المدرب</span>
        ) : (
          <span className="tpl-badge tpl-badge--auto">توصية تلقائية</span>
        )}
      </div>

      <dl className="cc-dl tpl-rec__context">
        <div>
          <dt>هدف الاختبار</dt>
          <dd>{quizId ?? goal ?? "—"}</dd>
        </div>
        <div>
          <dt>هدف التدريب V2</dt>
          <dd>{result.resolution_trace.training_v2_goal ?? "—"}</dd>
        </div>
        <div>
          <dt>الاستراتيجية الأساسية</dt>
          <dd>{primaryStrategyLabelAr(result.primary_strategy)}</dd>
        </div>
        <div>
          <dt>المستوى</dt>
          <dd>{templateLevelLabelAr(result.resolved_level)}</dd>
        </div>
        <div>
          <dt>المكان</dt>
          <dd>
            {result.status === "INSUFFICIENT_CONTEXT" &&
            result.resolution_trace.environment_selection_note?.includes("AMBIGUOUS")
              ? "يحتاج توضيحاً — اختر منزل أو صالة"
              : templateEnvironmentLabelAr(result.resolved_environment)}
          </dd>
        </div>
        <div>
          <dt>أيام التدريب</dt>
          <dd>{result.resolved_days ?? "—"}</dd>
        </div>
      </dl>

      {!level || daysPerWeek == null ? (
        <div className="tpl-rec__coach-context" role="group" aria-label="سياق التوصية">
          <p className="cc-muted">سياق المدرب للتوصية (لا يُعيَّن تلقائياً):</p>
          {(usedExplicitDefaults.level || usedExplicitDefaults.days) && (
            <p className="cc-muted" data-testid="explicit-default-used">
              EXPLICIT_DEFAULT_USED — القيم الافتراضية للعرض فقط وليست حقائق من ملف العميل.
            </p>
          )}
          <div className="cc-row-actions">
            <label>
              المستوى{" "}
              <select value={coachLevel} onChange={(e) => setCoachLevel(e.target.value)}>
                <option value="beginner">مبتدئ</option>
                <option value="intermediate">متوسط</option>
                <option value="advanced">متقدم</option>
              </select>
            </label>
            <label>
              الأيام{" "}
              <select
                value={String(coachDays)}
                onChange={(e) => setCoachDays(Number(e.target.value))}
              >
                {[2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {goal === "waist" || quizId === "waist" ? (
        <p className="tpl-rec__goal-note" role="note">
          {result.primary_strategy === "FAT_LOSS"
            ? "سبب الاستراتيجية: سياق العميل يشير إلى أولوية خسارة الدهون — بدون وعود حرق موضعي."
            : "الاستراتيجية الافتراضية للخصر: إعادة تركيب الجسم — بدون وعود حرق دهون البطن موضعياً."}
        </p>
      ) : null}

      {goal === "tone" || quizId === "tone" ? (
        <p className="tpl-rec__goal-note" role="note">
          الاستراتيجية: إعادة تركيب الجسم. قد تحتاج تخصصاً إضافياً للجزء العلوي — مراجعة المدرب مطلوبة. لا
          وعود إعادة تشكيل موضعية.
        </p>
      ) : null}

      {goal === "gain" || quizId === "gain" || result.recommendation_reason.nutrition_alignment_required ? (
        <p className="tpl-rec__goal-note" role="note">
          تدريب: بناء العضلات · محاذاة التغذية مطلوبة (لا تعديل لاستراتيجية التغذية من هنا).
        </p>
      ) : null}

      {result.status === "NO_EXACT_MATCH" || result.status === "NO_COMPATIBLE_TEMPLATE" ? (
        <div className="tpl-rec__gap" role="alert">
          <strong>لا يوجد قالب مطابق تماماً</strong>
          <p>{result.recommendation_reason.summary || result.fallback_reason || "لا مرشح دقيق."}</p>
          <p>
            إجراء مقترح:{" "}
            {result.primary_strategy === "GLUTE_FOCUS" && result.resolved_environment === "HOME"
              ? "يُوصى بقالب جديد (NEW_TEMPLATE_RECOMMENDED)"
              : "مراجعة المدرب / تخصيص"}
          </p>
          <p>مراجعة المدرب: مطلوبة</p>
        </div>
      ) : null}

      {result.status === "INSUFFICIENT_CONTEXT" ? (
        <div className="tpl-rec__gap" role="alert">
          <strong>سياق غير كافٍ للتوصية الدقيقة</strong>
          <p>
            {result.resolution_trace.environment_selection_note?.includes("AMBIGUOUS")
              ? "حدد مكان التدريب (منزل أو صالة) قبل التوصية الدقيقة."
              : result.recommendation_reason.summary || "أكمل بيانات المستوى/المكان/الأيام."}
          </p>
        </div>
      ) : null}

      <div className="tpl-rec__pick">
        <h3>القالب الموصى به</h3>
        <p className="tpl-rec__slug">
          {result.recommended_template_slug ?? "—"}
          {result.recommended_template_id ? (
            <span className="cc-muted"> · {result.recommended_template_id}</span>
          ) : null}
        </p>
        {result.coach_override_applied ? (
          <dl className="cc-dl">
            <div>
              <dt>توصية النظام</dt>
              <dd>{result.auto_recommended_template_id ?? "—"}</dd>
            </div>
            <div>
              <dt>اختيار المدرب</dt>
              <dd>{result.coach_selected_template_id ?? "—"}</dd>
            </div>
            <div>
              <dt>سبب التجاوز</dt>
              <dd>{result.override_reason ?? "—"}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="tpl-rec__why">
        <h3>{result.status === "MATCHED" ? "لماذا هذا القالب؟" : "لماذا المراجعة / عدم التطابق؟"}</h3>
        <ul className="tpl-rec__checks">
          {checks.map((check) => (
            <li key={check.id} className={check.ok ? "is-ok" : "is-miss"}>
              <span aria-hidden="true">{check.ok ? "✓" : "✕"}</span>
              {check.label}
            </li>
          ))}
        </ul>
        <p className="tpl-rec__summary">{result.recommendation_reason.summary}</p>
        {result.review_signals.length > 0 ? (
          <ul className="tpl-list" aria-label="إشارات المراجعة">
            {result.review_signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="tpl-rec__actions cc-row-actions">
        {recommendedId ? (
          <>
            {onPreviewRecommended ? (
              <button
                type="button"
                className="cc-btn cc-btn--ghost"
                onClick={() => onPreviewRecommended(recommendedId)}
              >
                معاينة القالب
              </button>
            ) : null}
            {onAssignClick ? (
              <button type="button" className="cc-btn cc-btn--primary" onClick={() => onAssignClick(recommendedId)}>
                تعيين القالب
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      <details
        className="tpl-rec__trace"
        open={traceOpen}
        onToggle={(event) => setTraceOpen((event.target as HTMLDetailsElement).open)}
      >
        <summary>تفاصيل الحل (للمراجعة التقنية)</summary>
        <dl className="cc-dl">
          <div>
            <dt>هدف الاختبار</dt>
            <dd>{result.resolution_trace.quiz_goal ?? "—"}</dd>
          </div>
          <div>
            <dt>مصدر الاستراتيجية</dt>
            <dd>{result.resolution_trace.primary_strategy_source}</dd>
          </div>
          <div>
            <dt>مرشحون ابتدائيون</dt>
            <dd>{result.resolution_trace.initial_candidate_count}</dd>
          </div>
          <div>
            <dt>بعد الاستراتيجية</dt>
            <dd>{result.resolution_trace.strategy_filtered_count}</dd>
          </div>
          <div>
            <dt>بعد المستوى</dt>
            <dd>{result.resolution_trace.level_filtered_count}</dd>
          </div>
          <div>
            <dt>بعد المكان</dt>
            <dd>{result.resolution_trace.environment_filtered_count}</dd>
          </div>
          <div>
            <dt>بعد الأيام</dt>
            <dd>{result.resolution_trace.days_filtered_count}</dd>
          </div>
          <div>
            <dt>بعد المعدات</dt>
            <dd>{result.resolution_trace.equipment_filtered_count}</dd>
          </div>
          <div>
            <dt>نهائي</dt>
            <dd>{result.resolution_trace.final_candidate_count}</dd>
          </div>
          <div>
            <dt>المختار</dt>
            <dd>{result.resolution_trace.selected_template ?? "—"}</dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
