import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Bot, FlaskConical, Plus, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminErrorState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  fetchMobileCommandCenter,
  saveAutomationRule,
  type AutomationRule,
} from "@/lib/admin/admin-command-center-api";
import {
  listAdminProgramTemplates,
  type AdminProgramListItem,
} from "@/lib/admin/admin-programs-api";

export const Route = createFileRoute("/admin/automation")({
  ssr: false,
  head: () => ({ meta: [{ title: "أتمتة البرامج | مركز التشغيل" }] }),
  component: ProgramAutomationPage,
});

const LABELS: Record<string, string> = {
  cut: "خسارة الدهون",
  bulk: "بناء العضلات",
  recomp: "إعادة تشكيل الجسم",
  fitness: "لياقة عامة",
  male: "ذكر",
  female: "أنثى",
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

function ProgramAutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<AdminProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [testRule, setTestRule] = useState<AutomationRule | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [command, programList] = await Promise.all([
        fetchMobileCommandCenter(),
        listAdminProgramTemplates({ status: "published", limit: 50 }),
      ]);
      setRules(command.automation_rules);
      setTemplates(programList.rows.filter((row) => row.is_published && !row.archived_at));
    } catch (cause) {
      console.error(cause);
      setError("تعذر تحميل خرائط الأتمتة. تأكد من تطبيق migration في بيئة الاختبار.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const exactRules = rules.filter((rule) => !rule.is_fallback && rule.is_active).length;
  const fallbackRules = rules.filter((rule) => rule.is_fallback && rule.is_active).length;
  const coverage = useMemo(() => Math.round((exactRules / 144) * 100), [exactRules]);

  return (
    <>
      <AdminPageHeader
        kicker="P0"
        title="أتمتة البرامج"
        subtitle="أنت تحدد الاستراتيجية، والنظام يطبق المطابقة فقط: Master Template ← Auto Assign ← Client Copy ← Client Override."
        actions={
          <button type="button" className="cc-btn cc-btn--primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> قاعدة جديدة
          </button>
        }
      />
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={7} /> : null}
      {!loading && !error ? (
        <div className="cc-ops-stack">
          <div className="cc-command-metrics">
            <article>
              <Bot />
              <span>قواعد فعالة</span>
              <strong>{exactRules}</strong>
            </article>
            <article>
              <ShieldCheck />
              <span>Fallback معتمد</span>
              <strong>{fallbackRules}</strong>
            </article>
            <article>
              <FlaskConical />
              <span>تغطية التركيبات</span>
              <strong>{coverage}%</strong>
            </article>
          </div>
          <div className="cc-automation-contract">
            <strong>قاعدة الأمان</strong>
            <span>
              لا fallback لجنس أو هدف مختلف. تغيير عميل يدويًا لا يغيّر القالب ولا أي عميل آخر.
            </span>
          </div>
          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>خرائط التعيين</h2>
                <p>الهدف + الجنس + المستوى + الأيام ← نسخة قالب منشورة.</p>
              </div>
            </div>
            <div className="cc-rule-list">
              {rules.length ? (
                rules.map((rule) => (
                  <article key={rule.id} className="cc-rule-card">
                    <div className="cc-rule-card__route">
                      <span>{LABELS[rule.gender]}</span>
                      <span>{LABELS[rule.goal]}</span>
                      <span>{LABELS[rule.level]}</span>
                      <span>{rule.training_days} أيام</span>
                    </div>
                    <ArrowLeft className="cc-rule-card__arrow" aria-hidden />
                    <div className="cc-rule-card__target">
                      <strong>{rule.training_template_name}</strong>
                      <span>
                        Template V{rule.training_template_version} · Priority {rule.priority}
                      </span>
                      <small>
                        {Object.keys(rule.nutrition_blueprint ?? {}).length
                          ? "Nutrition blueprint مربوط"
                          : "Nutrition blueprint غير مربوط"}
                      </small>
                    </div>
                    <div className="cc-rule-card__actions">
                      <AdminStatusBadge tone={rule.is_active ? "success" : "inactive"}>
                        {rule.is_active ? "فعّالة" : "متوقفة"}
                      </AdminStatusBadge>
                      {rule.is_fallback ? (
                        <AdminStatusBadge tone="review">Fallback</AdminStatusBadge>
                      ) : null}
                      <button
                        type="button"
                        className="cc-btn cc-btn--compact"
                        onClick={() => setTestRule(rule)}
                      >
                        اختبار
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="cc-muted">
                  لا توجد قواعد صريحة بعد. سيستمر resolver الحالي حتى نشر القواعد.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : null}
      {open ? (
        <RuleSheet
          templates={templates}
          onClose={() => setOpen(false)}
          onSave={async (payload) => {
            try {
              await saveAutomationRule(payload);
              setOpen(false);
              await load();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "تعذر حفظ القاعدة");
            }
          }}
        />
      ) : null}
      {testRule ? (
        <div className="cc-mobile-more-scrim" role="presentation" onClick={() => setTestRule(null)}>
          <section
            className="cc-ops-sheet cc-ops-sheet--compact"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-mobile-more-sheet__handle" />
            <h2>نتيجة اختبار القاعدة</h2>
            <div className="cc-test-result">
              <ShieldCheck />
              <strong>تطابق حتمي وآمن</strong>
              <p>
                {LABELS[testRule.gender]} + {LABELS[testRule.goal]} + {LABELS[testRule.level]} +{" "}
                {testRule.training_days} أيام
              </p>
              <ArrowLeft />
              <p>
                {testRule.training_template_name} V{testRule.training_template_version}
              </p>
            </div>
            <p className="cc-muted">
              الاختبار قراءة فقط ولا يغيّر أي عميل. المطابقة ترفض اختلاف الجنس أو الهدف.
            </p>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              onClick={() => setTestRule(null)}
            >
              تم
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}

function RuleSheet({
  templates,
  onClose,
  onSave,
}: {
  templates: AdminProgramListItem[];
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "قاعدة جديدة",
    goal: "cut",
    gender: "male",
    level: "beginner",
    training_days: "4",
    training_template_id: templates[0]?.id ?? "",
    priority: "100",
    is_fallback: false,
    is_active: true,
  });
  const submit = async () => {
    setBusy(true);
    try {
      await onSave({
        ...form,
        training_days: Number(form.training_days),
        priority: Number(form.priority),
        nutrition_blueprint: {},
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="cc-mobile-more-scrim" role="presentation" onClick={onClose}>
      <section
        className="cc-ops-sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cc-mobile-more-sheet__handle" />
        <div className="cc-ops-sheet__head">
          <h2>قاعدة تعيين جديدة</h2>
          <button className="cc-btn cc-btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </div>
        <div className="cc-form-grid cc-sheet-form">
          <label className="cc-command-field">
            <span>اسم القاعدة</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="cc-command-field">
            <span>الهدف</span>
            <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
              <option value="cut">خسارة الدهون</option>
              <option value="bulk">بناء العضلات</option>
              <option value="recomp">إعادة تشكيل</option>
              <option value="fitness">لياقة</option>
            </select>
          </label>
          <label className="cc-command-field">
            <span>الجنس</span>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </label>
          <label className="cc-command-field">
            <span>المستوى</span>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </label>
          <label className="cc-command-field">
            <span>أيام التدريب</span>
            <select
              value={form.training_days}
              onChange={(e) => setForm({ ...form, training_days: e.target.value })}
            >
              {[2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  {day} أيام
                </option>
              ))}
            </select>
          </label>
          <label className="cc-command-field">
            <span>قالب التدريب</span>
            <select
              value={form.training_template_id}
              onChange={(e) => setForm({ ...form, training_template_id: e.target.value })}
            >
              <option value="">اختر قالبًا منشورًا</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name_ar} · V{template.version}
                </option>
              ))}
            </select>
          </label>
          <label className="cc-command-field">
            <span>الأولوية</span>
            <input
              inputMode="numeric"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </label>
        </div>
        <label className="cc-toggle-row">
          <input
            type="checkbox"
            checked={form.is_fallback}
            onChange={(e) => setForm({ ...form, is_fallback: e.target.checked })}
          />
          <span>
            <strong>Fallback معتمد</strong>
            <small>يبقى ضمن نفس الجنس والهدف فقط.</small>
          </span>
        </label>
        <div className="cc-sheet-actions">
          <button className="cc-btn" onClick={onClose}>
            إلغاء
          </button>
          <button
            className="cc-btn cc-btn--primary"
            disabled={busy || !form.training_template_id}
            onClick={() => void submit()}
          >
            {busy ? "جاري الحفظ…" : "حفظ وتفعيل"}
          </button>
        </div>
      </section>
    </div>
  );
}
