import { createFileRoute } from "@tanstack/react-router";
import { BadgePercent, CalendarClock, CircleDollarSign, Plus, Tag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AdminErrorState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  fetchMobileCommandCenter,
  saveBasePrice,
  savePromoCode,
  savePromotion,
  type CommandCenterPromoCode,
  type CommandCenterPromotion,
  type MobileCommandCenter,
} from "@/lib/admin/admin-command-center-api";

export const Route = createFileRoute("/admin/commercial")({
  ssr: false,
  head: () => ({ meta: [{ title: "الأسعار والعروض | مركز التشغيل" }] }),
  component: CommercialControlCenter,
});

const PLAN_LABELS: Record<string, string> = { essential: "PLUS", premium: "PRO", vip: "VIP" };

function isoLocal(offsetDays = 0) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function isoInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function CommercialControlCenter() {
  const [data, setData] = useState<MobileCommandCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"promotion" | "code" | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<CommandCenterPromotion | null>(null);
  const [editingCode, setEditingCode] = useState<CommandCenterPromoCode | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchMobileCommandCenter());
    } catch (cause) {
      console.error(cause);
      setError("تعذر تحميل مركز الأسعار. طبّق migration الأدمن على بيئة الاختبار أولًا.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const publishedPrices = useMemo(
    () => data?.prices.filter((price) => price.status === "published") ?? [],
    [data],
  );
  const activePromotions =
    data?.promotions.filter((promotion) => promotion.status === "active") ?? [];
  const activeCodes = data?.promo_codes.filter((code) => code.status === "active") ?? [];

  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
      setPanel(null);
      setEditingPromotion(null);
      setEditingCode(null);
    } catch (cause) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "تعذر حفظ التغيير.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        kicker="الإيرادات"
        title="الأسعار والعروض"
        subtitle="السعر المنشور، العرض المؤقت، وكود الخصم من مصدر تشغيل واحد — بدون Deploy."
        actions={
          <div className="cc-mobile-action-row">
            <button
              type="button"
              className="cc-btn"
              onClick={() => {
                setEditingCode(null);
                setPanel("code");
              }}
            >
              <Tag size={16} aria-hidden /> كود خصم
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              onClick={() => {
                setEditingPromotion(null);
                setPanel("promotion");
              }}
            >
              <Plus size={16} aria-hidden /> عرض جديد
            </button>
          </div>
        }
      />

      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={7} /> : null}

      {!loading && data ? (
        <div className="cc-ops-stack">
          <div className="cc-command-metrics" aria-label="ملخص التسعير">
            <article>
              <CircleDollarSign />
              <span>أسعار منشورة</span>
              <strong>{publishedPrices.length}</strong>
            </article>
            <article>
              <CalendarClock />
              <span>عروض فعالة</span>
              <strong>{activePromotions.length}</strong>
            </article>
            <article>
              <BadgePercent />
              <span>أكواد فعالة</span>
              <strong>{activeCodes.length}</strong>
            </article>
          </div>

          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>الأسعار الأساسية</h2>
                <p>أي نشر ينشئ Version جديدًا ويحفظ القديم في Audit Log.</p>
              </div>
              <AdminStatusBadge tone="published">مصدر الحقيقة</AdminStatusBadge>
            </div>
            <div className="cc-price-grid">
              {publishedPrices.map((price) => (
                <PriceCard
                  key={price.id}
                  price={price}
                  busy={busy}
                  onSave={(amount) =>
                    mutate(() =>
                      saveBasePrice({
                        plan: price.plan,
                        term_months: price.term_months,
                        amount,
                        status: "published",
                      }),
                    )
                  }
                />
              ))}
            </div>
          </section>

          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>العروض المؤقتة</h2>
                <p>العدّ التنازلي مرتبط بـends_at ولا يُعاد عند التحديث.</p>
              </div>
            </div>
            <div className="cc-compact-list">
              {data.promotions.length ? (
                data.promotions.map((promotion) => (
                  <article key={promotion.id} className="cc-compact-row">
                    <div className="cc-compact-row__main">
                      <strong>{promotion.name}</strong>
                      <span>
                        {PLAN_LABELS[promotion.plan]} · {promotion.term_months} أشهر · $
                        {promotion.promotional_price}
                      </span>
                      <small>ينتهي {new Date(promotion.ends_at).toLocaleString("ar-AE")}</small>
                    </div>
                    <div className="cc-rule-card__actions">
                      <AdminStatusBadge
                        tone={
                          promotion.status === "active"
                            ? "success"
                            : promotion.status === "draft"
                              ? "draft"
                              : "inactive"
                        }
                      >
                        {promotion.status === "active"
                          ? "فعال"
                          : promotion.status === "draft"
                            ? "مسودة"
                            : promotion.status === "paused"
                              ? "متوقف"
                              : "منتهٍ"}
                      </AdminStatusBadge>
                      <button
                        type="button"
                        className="cc-btn cc-btn--compact"
                        onClick={() => {
                          setEditingPromotion(promotion);
                          setPanel("promotion");
                        }}
                      >
                        تعديل
                      </button>
                      {promotion.status === "active" ? (
                        <button
                          type="button"
                          className="cc-btn cc-btn--compact"
                          disabled={busy}
                          onClick={() =>
                            void mutate(() => savePromotion({ ...promotion, status: "paused" }))
                          }
                        >
                          إيقاف
                        </button>
                      ) : null}
                      {promotion.status === "paused" || promotion.status === "draft" ? (
                        <button
                          type="button"
                          className="cc-btn cc-btn--compact"
                          disabled={busy}
                          onClick={() =>
                            void mutate(() => savePromotion({ ...promotion, status: "active" }))
                          }
                        >
                          نشر
                        </button>
                      ) : null}
                      {promotion.status !== "ended" ? (
                        <button
                          type="button"
                          className="cc-btn cc-btn--compact"
                          disabled={busy}
                          onClick={() =>
                            void mutate(() => savePromotion({ ...promotion, status: "ended" }))
                          }
                        >
                          إنهاء الآن
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="cc-muted">لا توجد عروض. السعر الأساسي هو المطبق حاليًا.</p>
              )}
            </div>
          </section>

          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>Promo Codes</h2>
                <p>التحقق والحدود والاستخدام لكل عميل تتم من نفس عقد السيرفر.</p>
              </div>
            </div>
            <div className="cc-compact-list">
              {data.promo_codes.length ? (
                data.promo_codes.map((code) => (
                  <article key={code.id} className="cc-compact-row">
                    <div className="cc-code-mark">{code.code}</div>
                    <div className="cc-compact-row__main">
                      <strong>
                        {code.discount_value}
                        {code.discount_type === "percent" ? "%" : "$"} خصم
                      </strong>
                      <span>
                        {code.plans.map((plan) => PLAN_LABELS[plan] ?? plan).join(" · ")} · استُخدم{" "}
                        {code.uses} مرة
                      </span>
                      <small>
                        {code.max_total_uses ? `الحد ${code.max_total_uses}` : "بدون حد إجمالي"} ·{" "}
                        {code.one_use_per_client ? "مرة لكل عميل" : "استخدام متكرر"}
                      </small>
                    </div>
                    <div className="cc-rule-card__actions">
                      <AdminStatusBadge
                        tone={
                          code.status === "active"
                            ? "success"
                            : code.status === "draft"
                              ? "draft"
                              : "inactive"
                        }
                      >
                        {code.status === "active"
                          ? "فعال"
                          : code.status === "draft"
                            ? "مسودة"
                            : code.status === "ended"
                              ? "منتهٍ"
                              : "متوقف"}
                      </AdminStatusBadge>
                      <button
                        type="button"
                        className="cc-btn cc-btn--compact"
                        onClick={() => {
                          setEditingCode(code);
                          setPanel("code");
                        }}
                      >
                        تعديل
                      </button>
                      {code.status === "active" ? (
                        <button
                          type="button"
                          className="cc-btn cc-btn--compact"
                          disabled={busy}
                          onClick={() =>
                            void mutate(() => savePromoCode({ ...code, status: "paused" }))
                          }
                        >
                          إيقاف
                        </button>
                      ) : null}
                      {code.status === "paused" || code.status === "draft" ? (
                        <button
                          type="button"
                          className="cc-btn cc-btn--compact"
                          disabled={busy}
                          onClick={() =>
                            void mutate(() => savePromoCode({ ...code, status: "active" }))
                          }
                        >
                          نشر
                        </button>
                      ) : null}
                      {code.status !== "ended" ? (
                        <button
                          type="button"
                          className="cc-btn cc-btn--compact"
                          disabled={busy}
                          onClick={() =>
                            void mutate(() => savePromoCode({ ...code, status: "ended" }))
                          }
                        >
                          إنهاء
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="cc-muted">لا توجد أكواد خصم.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {panel === "promotion" ? (
        <PromotionSheet
          busy={busy}
          initial={editingPromotion}
          prices={publishedPrices}
          onClose={() => {
            setPanel(null);
            setEditingPromotion(null);
          }}
          onSave={(payload) => mutate(() => savePromotion(payload))}
        />
      ) : null}
      {panel === "code" ? (
        <PromoCodeSheet
          busy={busy}
          initial={editingCode}
          onClose={() => {
            setPanel(null);
            setEditingCode(null);
          }}
          onSave={(payload) => mutate(() => savePromoCode(payload))}
        />
      ) : null}
    </>
  );
}

function PriceCard({
  price,
  busy,
  onSave,
}: {
  price: MobileCommandCenter["prices"][number];
  busy: boolean;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(price.amount));
  const changed = Number(amount) !== Number(price.amount) && Number(amount) >= 0;
  return (
    <article className="cc-price-card">
      <div>
        <strong>{PLAN_LABELS[price.plan]}</strong>
        <span>
          {price.term_months} أشهر · V{price.version}
        </span>
      </div>
      <label>
        <span>USD</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label={`سعر ${PLAN_LABELS[price.plan]}`}
        />
      </label>
      <button
        type="button"
        className="cc-btn cc-btn--primary"
        disabled={!changed || busy}
        onClick={() => onSave(Number(amount))}
      >
        نشر السعر
      </button>
    </article>
  );
}

function PromotionSheet({
  busy,
  initial,
  prices,
  onClose,
  onSave,
}: {
  busy: boolean;
  initial: CommandCenterPromotion | null;
  prices: MobileCommandCenter["prices"];
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "عرض الإطلاق",
    plan: initial?.plan ?? "essential",
    term_months: String(initial?.term_months ?? 3),
    promotional_price: String(initial?.promotional_price ?? 50),
    starts_at: initial ? isoInput(initial.starts_at) : isoLocal(),
    ends_at: initial ? isoInput(initial.ends_at) : isoLocal(7),
    status: initial?.status ?? "draft",
  });
  const basePrice = prices.find(
    (price) => price.plan === form.plan && price.term_months === Number(form.term_months),
  )?.amount;
  const payload = (status: "draft" | "active") => ({
    ...form,
    term_months: Number(form.term_months),
    promotional_price: Number(form.promotional_price),
    starts_at: new Date(form.starts_at).toISOString(),
    ends_at: new Date(form.ends_at).toISOString(),
    status,
  });
  return (
    <Sheet title={initial ? "تعديل العرض" : "عرض مؤقت جديد"} onClose={onClose}>
      <div className="cc-form-grid cc-sheet-form">
        <Field label="اسم العرض">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="الخطة">
          <select
            value={form.plan}
            onChange={(e) =>
              setForm({ ...form, plan: e.target.value as CommandCenterPromotion["plan"] })
            }
          >
            <option value="essential">PLUS</option>
            <option value="premium">PRO</option>
            <option value="vip">VIP</option>
          </select>
        </Field>
        <Field label="المدة">
          <select
            value={form.term_months}
            onChange={(e) => setForm({ ...form, term_months: e.target.value })}
          >
            <option value="3">3 أشهر</option>
            <option value="6">6 أشهر</option>
          </select>
        </Field>
        <Field label="السعر الترويجي">
          <input
            inputMode="decimal"
            value={form.promotional_price}
            onChange={(e) => setForm({ ...form, promotional_price: e.target.value })}
          />
        </Field>
        <Field label="يبدأ">
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
          />
        </Field>
        <Field label="ينتهي">
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
          />
        </Field>
      </div>
      <div className="cc-sheet-preview">
        <span>معاينة</span>
        <strong>
          {basePrice != null ? <s>${basePrice}</s> : null} ${form.promotional_price}
        </strong>
        <small>العدّ التنازلي ينتهي في {new Date(form.ends_at).toLocaleString("ar-AE")}</small>
      </div>
      <div className="cc-sheet-actions">
        <button className="cc-btn" onClick={() => onSave(payload("draft"))} disabled={busy}>
          حفظ مسودة
        </button>
        <button
          className="cc-btn cc-btn--primary"
          onClick={() => onSave(payload("active"))}
          disabled={busy}
        >
          نشر العرض
        </button>
      </div>
    </Sheet>
  );
}

function PromoCodeSheet({
  busy,
  initial,
  onClose,
  onSave,
}: {
  busy: boolean;
  initial: CommandCenterPromoCode | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    code: initial?.code ?? "MAAKFIT10",
    discount_value: String(initial?.discount_value ?? 10),
    plans: initial?.plans ?? ["essential", "premium"],
    terms: initial?.terms ?? [3, 6],
    starts_at: initial?.starts_at ?? new Date().toISOString(),
    expires_at: initial?.expires_at ? isoInput(initial.expires_at) : isoLocal(30),
    max_total_uses: String(initial?.max_total_uses ?? 100),
    one_use_per_client: initial?.one_use_per_client ?? true,
    new_clients_only: initial?.new_clients_only ?? false,
  });
  const togglePlan = (plan: string) =>
    setForm({
      ...form,
      plans: form.plans.includes(plan)
        ? form.plans.filter((item) => item !== plan)
        : [...form.plans, plan],
    });
  const toggleTerm = (term: number) =>
    setForm({
      ...form,
      terms: form.terms.includes(term)
        ? form.terms.filter((item) => item !== term)
        : [...form.terms, term],
    });
  const payload = (status: "draft" | "active") => ({
    ...form,
    discount_type: "percent",
    discount_value: Number(form.discount_value),
    expires_at: new Date(form.expires_at).toISOString(),
    max_total_uses: Number(form.max_total_uses) || null,
    status,
  });
  return (
    <Sheet title={initial ? "تعديل كود الخصم" : "كود خصم جديد"} onClose={onClose}>
      <div className="cc-form-grid cc-sheet-form">
        <Field label="الكود">
          <input
            dir="ltr"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="نسبة الخصم">
          <input
            inputMode="numeric"
            value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
          />
        </Field>
        <Field label="تاريخ الانتهاء">
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
        </Field>
        <Field label="أقصى استخدام">
          <input
            inputMode="numeric"
            value={form.max_total_uses}
            onChange={(e) => setForm({ ...form, max_total_uses: e.target.value })}
          />
        </Field>
      </div>
      <div className="cc-toggle-grid">
        <strong>الخطط</strong>
        {["essential", "premium", "vip"].map((plan) => (
          <label key={plan}>
            <input
              type="checkbox"
              checked={form.plans.includes(plan)}
              onChange={() => togglePlan(plan)}
            />
            {PLAN_LABELS[plan]}
          </label>
        ))}
        <strong>المدد</strong>
        {[3, 6].map((term) => (
          <label key={term}>
            <input
              type="checkbox"
              checked={form.terms.includes(term)}
              onChange={() => toggleTerm(term)}
            />
            {term} أشهر
          </label>
        ))}
      </div>
      <label className="cc-toggle-row">
        <input
          type="checkbox"
          checked={form.one_use_per_client}
          onChange={(e) => setForm({ ...form, one_use_per_client: e.target.checked })}
        />
        <span>
          <strong>مرة واحدة لكل عميل</strong>
          <small>يُتحقق منها على السيرفر.</small>
        </span>
      </label>
      <label className="cc-toggle-row">
        <input
          type="checkbox"
          checked={form.new_clients_only}
          onChange={(e) => setForm({ ...form, new_clients_only: e.target.checked })}
        />
        <span>
          <strong>للعملاء الجدد فقط</strong>
          <small>لا يظهر أو يُقبل لغير المؤهلين.</small>
        </span>
      </label>
      <div className="cc-sheet-actions">
        <button
          className="cc-btn"
          disabled={busy || !form.plans.length || !form.terms.length}
          onClick={() => onSave(payload("draft"))}
        >
          حفظ مسودة
        </button>
        <button
          className="cc-btn cc-btn--primary"
          disabled={busy || !form.plans.length || !form.terms.length}
          onClick={() => onSave(payload("active"))}
        >
          نشر الكود
        </button>
      </div>
    </Sheet>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="cc-mobile-more-scrim" role="presentation" onClick={onClose}>
      <section
        className="cc-ops-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cc-mobile-more-sheet__handle" />
        <div className="cc-ops-sheet__head">
          <h2>{title}</h2>
          <button type="button" className="cc-btn cc-btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="cc-command-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
