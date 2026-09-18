import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Clock3, Save, Shield, ToggleLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState, AdminPageHeader } from "@/components/admin/AdminPage";
import {
  AdminConfirmDialog,
  AdminSkeletonRows,
  type AdminConfirmRequest,
} from "@/components/admin/AdminConfirmDialog";
import {
  fetchMobileCommandCenter,
  saveRuntimeSettings,
  type RuntimeSettings,
} from "@/lib/admin/admin-command-center-api";

export const Route = createFileRoute("/admin/product-settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "إعدادات المنتج | مركز التشغيل" }] }),
  component: ProductSettingsPage,
});

function ProductSettingsPage() {
  const [settings, setSettings] = useState<RuntimeSettings | null>(null);
  const [draft, setDraft] = useState<RuntimeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<AdminConfirmRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMobileCommandCenter();
      setSettings(data.settings);
      setDraft(data.settings);
    } catch (cause) {
      console.error(cause);
      setError("تعذر تحميل إعدادات التشغيل الآمنة.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  async function persist() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const next = await saveRuntimeSettings(draft);
      setSettings(next);
      setDraft(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ الإعدادات.");
    } finally {
      setSaving(false);
    }
  }

  function requestSave() {
    if (!draft) return;
    const highImpact =
      draft.checkout_paused !== settings?.checkout_paused ||
      draft.signups_paused !== settings?.signups_paused;
    if (!highImpact) {
      void persist();
      return;
    }
    setConfirm({
      title: "تأكيد تغيير تشغيلي عالي الأثر",
      body: "إيقاف الدفع أو التسجيل يؤثر فورًا في رحلة العملاء بعد نشر الإعداد.",
      confirmLabel: "تأكيد وحفظ",
      tone: "danger",
      reasonRequired: true,
      reasonLabel: "سبب التغيير",
      impact: "يُسجل التغيير في Audit Log ويمكن عكسه من هذه الصفحة.",
      onConfirm: persist,
    });
  }

  return (
    <>
      <AdminPageHeader
        kicker="بدون كود"
        title="إعدادات المنتج"
        subtitle="إعدادات تشغيلية آمنة فقط. لا أسرار، لا RLS، لا schema، ولا إعدادات نشر."
        actions={
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            disabled={!draft || saving || JSON.stringify(draft) === JSON.stringify(settings)}
            onClick={requestSave}
          >
            <Save size={16} />
            {saving ? "جاري الحفظ…" : "حفظ التغييرات"}
          </button>
        }
      />
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}
      {draft ? (
        <div className="cc-ops-stack">
          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>
                  <Clock3 size={18} /> توقيت الرحلة الأولى
                </h2>
                <p>يتغير Runtime مباشرة بعد الحفظ؛ لا يحتاج Deploy.</p>
              </div>
            </div>
            <div className="cc-form-grid cc-sheet-form">
              <label className="cc-command-field">
                <span>مدة التحضير الأولى بالدقائق</span>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={draft.first_app_preparation_minutes}
                  onChange={(e) =>
                    setDraft({ ...draft, first_app_preparation_minutes: Number(e.target.value) })
                  }
                />
              </label>
              <label className="cc-command-field">
                <span>نافذة الإكمال الإضافية</span>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draft.missing_input_window_minutes}
                  onChange={(e) =>
                    setDraft({ ...draft, missing_input_window_minutes: Number(e.target.value) })
                  }
                />
              </label>
            </div>
          </section>
          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>
                  <ToggleLeft size={18} /> المحتوى والـCTA
                </h2>
                <p>نصوص ووسائط تشغيلية آمنة، مع معاينة قبل النشر.</p>
              </div>
            </div>
            <div className="cc-form-grid cc-sheet-form">
              <label className="cc-command-field">
                <span>نص الإجراء الأساسي</span>
                <input
                  value={draft.primary_cta_text}
                  onChange={(e) => setDraft({ ...draft, primary_cta_text: e.target.value })}
                />
              </label>
              <label className="cc-command-field">
                <span>FREE promo video URL</span>
                <input
                  dir="ltr"
                  value={draft.free_promo_video_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, free_promo_video_url: e.target.value })}
                  placeholder="https://… أو /media/…"
                />
              </label>
            </div>
            <div className="cc-settings-preview">
              <span>معاينة CTA</span>
              <button type="button">{draft.primary_cta_text}</button>
            </div>
          </section>
          <section className="cc-command-section cc-command-section--danger">
            <div className="cc-command-section__head">
              <div>
                <h2>
                  <AlertTriangle size={18} /> Emergency Controls
                </h2>
                <p>استخدمها فقط عند وجود مشكلة تشغيلية. كل تغيير يحتاج تأكيدًا ويُسجل.</p>
              </div>
              <Shield size={22} />
            </div>
            <label className="cc-toggle-row">
              <input
                type="checkbox"
                checked={draft.checkout_paused}
                onChange={(e) => setDraft({ ...draft, checkout_paused: e.target.checked })}
              />
              <span>
                <strong>إيقاف Checkout</strong>
                <small>resolve_public_offer يرفض بدء الدفع بنفس عقد السيرفر.</small>
              </span>
            </label>
            <label className="cc-toggle-row">
              <input
                type="checkbox"
                checked={draft.promotions_paused}
                onChange={(e) => setDraft({ ...draft, promotions_paused: e.target.checked })}
              />
              <span>
                <strong>إيقاف العروض مؤقتًا</strong>
                <small>يرجع السعر الأساسي فورًا مع بقاء الحملات محفوظة.</small>
              </span>
            </label>
            <label className="cc-toggle-row">
              <input
                type="checkbox"
                checked={draft.signups_paused}
                onChange={(e) => setDraft({ ...draft, signups_paused: e.target.checked })}
              />
              <span>
                <strong>إيقاف التسجيلات الجديدة</strong>
                <small>يتطلب توصيل gate رحلة التسجيل قبل اعتماده إنتاجيًا.</small>
              </span>
            </label>
          </section>
          <div className="cc-safe-boundary">
            <Shield />
            <div>
              <strong>حدود آمنة</strong>
              <p>
                هذه الصفحة لا تعرض مفاتيح API أو قواعد الصلاحيات أو migrations أو Git أو Vercel.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <AdminConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </>
  );
}
