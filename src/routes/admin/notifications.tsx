import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BellRing, Check, Send, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import {
  fetchMobileCommandCenter,
  listProductNotifications,
  markProductNotificationRead,
  saveOperatorPreferences,
  sendProductNotification,
  type OperatorPreferences,
  type ProductNotification,
} from "@/lib/admin/admin-command-center-api";

export const Route = createFileRoute("/admin/notifications")({
  ssr: false,
  head: () => ({ meta: [{ title: "الإشعارات | مركز التشغيل" }] }),
  component: NotificationsCenter,
});

function playNotificationSound(severity: "critical" | "important" | "info") {
  if (severity === "info" || typeof window === "undefined") return;
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    severity === "critical" ? 0.18 : 0.09,
    context.currentTime + 0.02,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    context.currentTime + (severity === "critical" ? 0.72 : 0.34),
  );
  gain.connect(context.destination);
  const notes = severity === "critical" ? [740, 520, 740] : [660, 880];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = severity === "critical" ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    const start = context.currentTime + index * (severity === "critical" ? 0.18 : 0.1);
    oscillator.start(start);
    oscillator.stop(start + 0.16);
  });
  window.setTimeout(() => void context.close(), 900);
}

function soundAllowed(
  prefs: OperatorPreferences | null,
  severity: "critical" | "important" | "info",
) {
  if (!prefs?.sound_enabled || severity === "info") return false;
  if (severity === "critical" && !prefs.critical_sound_enabled) return false;
  if (severity === "important" && !prefs.important_sound_enabled) return false;
  if (!prefs.quiet_hours_enabled) return true;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (value: string) => {
    const [hours = "0", minutes = "0"] = value.split(":");
    return Number(hours) * 60 + Number(minutes);
  };
  const start = toMinutes(prefs.quiet_hours_start);
  const end = toMinutes(prefs.quiet_hours_end);
  const inQuietHours =
    start === end
      ? true
      : start < end
        ? currentMinutes >= start && currentMinutes < end
        : currentMinutes >= start || currentMinutes < end;
  return !inQuietHours;
}

function NotificationsCenter() {
  const [rows, setRows] = useState<ProductNotification[]>([]);
  const [prefs, setPrefs] = useState<OperatorPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifications, command] = await Promise.all([
        listProductNotifications(),
        fetchMobileCommandCenter(),
      ]);
      setRows(notifications);
      setPrefs(command.preferences);
    } catch (cause) {
      console.error(cause);
      setError("تعذر تحميل مركز الإشعارات.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  async function markRead(row: ProductNotification) {
    await markProductNotificationRead(row.id);
    setRows((current) =>
      current.map((item) => (item.id === row.id ? { ...item, is_read: true } : item)),
    );
  }

  return (
    <>
      <AdminPageHeader
        kicker="مركز موحد"
        title="الإشعارات"
        subtitle="CRITICAL بصوت مهني أقوى، IMPORTANT بصوت خفيف، وINFO صامت افتراضيًا. إذن المتصفح يبقى إلزاميًا."
        actions={
          <div className="cc-mobile-action-row">
            <button type="button" className="cc-btn" onClick={() => setSettingsOpen(true)}>
              {prefs?.sound_enabled ? <Volume2 size={16} /> : <VolumeX size={16} />} الصوت
            </button>
            <button
              type="button"
              className="cc-btn cc-btn--primary"
              onClick={() => setCompose(true)}
            >
              <Send size={16} /> إرسال
            </button>
          </div>
        }
      />
      {error ? <AdminErrorState message={error} onRetry={() => void load()} /> : null}
      {loading ? <AdminSkeletonRows rows={6} /> : null}
      {!loading && !error ? (
        <div className="cc-ops-stack">
          <div className="cc-notification-legend">
            <span>
              <i className="is-critical" />
              CRITICAL
            </span>
            <span>
              <i className="is-important" />
              IMPORTANT
            </span>
            <span>
              <i className="is-info" />
              INFO
            </span>
            <Link to="/admin/training/reviews">مراجعات التعيين</Link>
          </div>
          <section className="cc-command-section">
            <div className="cc-command-section__head">
              <div>
                <h2>صندوق الإشعارات</h2>
                <p>{rows.filter((row) => !row.is_read).length} غير مقروء</p>
              </div>
            </div>
            <div className="cc-notification-list">
              {rows.length ? (
                rows.map((row) => (
                  <article
                    key={row.id}
                    className={`cc-notification-card cc-notification-card--${row.severity} ${row.is_read ? "is-read" : ""}`}
                  >
                    <div className="cc-notification-card__icon">
                      {row.severity === "critical" ? <BellRing /> : <Bell />}
                    </div>
                    <div className="cc-notification-card__copy">
                      <div>
                        <strong>{row.title}</strong>
                        <AdminStatusBadge
                          tone={
                            row.severity === "critical"
                              ? "critical"
                              : row.severity === "important"
                                ? "review"
                                : "neutral"
                          }
                        >
                          {row.severity.toUpperCase()}
                        </AdminStatusBadge>
                      </div>
                      <p>{row.body}</p>
                      <small>
                        {new Date(row.created_at).toLocaleString("ar-AE")} ·{" "}
                        {row.audience_type === "all"
                          ? "الجميع"
                          : row.audience_type === "membership"
                            ? `فئة ${row.audience_value}`
                            : row.audience_type === "client"
                              ? "عميل"
                              : "فريق الأدمن"}
                      </small>
                    </div>
                    <div className="cc-notification-card__actions">
                      {row.deep_link ? (
                        <a className="cc-btn cc-btn--compact" href={row.deep_link}>
                          فتح
                        </a>
                      ) : null}
                      {!row.is_read ? (
                        <button
                          type="button"
                          className="cc-icon-btn"
                          aria-label="تعليم كمقروء"
                          onClick={() => void markRead(row)}
                        >
                          <Check size={16} />
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <p className="cc-muted">لا توجد إشعارات منشورة بعد.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
      {compose ? (
        <ComposeSheet
          onClose={() => setCompose(false)}
          onSent={async (severity) => {
            if (soundAllowed(prefs, severity)) playNotificationSound(severity);
            setCompose(false);
            await load();
          }}
        />
      ) : null}
      {settingsOpen && prefs ? (
        <SoundSettings
          prefs={prefs}
          onClose={() => setSettingsOpen(false)}
          onSaved={(next) => {
            setPrefs(next);
            setSettingsOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function ComposeSheet({
  onClose,
  onSent,
}: {
  onClose: () => void;
  onSent: (severity: "critical" | "important" | "info") => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    audience_type: "admin",
    audience_value: "",
    severity: "important" as "critical" | "important" | "info",
    category: "operations",
    title: "",
    body: "",
    deep_link: "",
  });
  const submit = async () => {
    setBusy(true);
    try {
      await sendProductNotification({ ...form, status: "published" });
      await onSent(form.severity);
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
          <h2>إرسال إشعار</h2>
          <button className="cc-btn cc-btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </div>
        <div className="cc-form-grid cc-sheet-form">
          <label className="cc-command-field">
            <span>الجمهور</span>
            <select
              value={form.audience_type}
              onChange={(e) => setForm({ ...form, audience_type: e.target.value })}
            >
              <option value="admin">فريق الأدمن</option>
              <option value="client">عميل واحد</option>
              <option value="membership">فئة عضوية</option>
              <option value="all">كل العملاء</option>
            </select>
          </label>
          {form.audience_type === "client" || form.audience_type === "membership" ? (
            <label className="cc-command-field">
              <span>{form.audience_type === "client" ? "Client ID" : "الفئة"}</span>
              <input
                value={form.audience_value}
                onChange={(e) => setForm({ ...form, audience_value: e.target.value })}
                placeholder={
                  form.audience_type === "membership" ? "free / essential / premium / vip" : "UUID"
                }
              />
            </label>
          ) : null}
          <label className="cc-command-field">
            <span>الأهمية</span>
            <select
              value={form.severity}
              onChange={(e) =>
                setForm({ ...form, severity: e.target.value as typeof form.severity })
              }
            >
              <option value="critical">CRITICAL — صوت قوي</option>
              <option value="important">IMPORTANT — صوت خفيف</option>
              <option value="info">INFO — صامت</option>
            </select>
          </label>
          <label className="cc-command-field">
            <span>العنوان</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="cc-command-field cc-command-field--wide">
            <span>النص</span>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>
          <label className="cc-command-field cc-command-field--wide">
            <span>Deep link اختياري</span>
            <input
              dir="ltr"
              value={form.deep_link}
              onChange={(e) => setForm({ ...form, deep_link: e.target.value })}
              placeholder="/admin/clients/…"
            />
          </label>
        </div>
        <div className="cc-sheet-actions">
          <button
            className="cc-btn"
            onClick={() => playNotificationSound(form.severity)}
            disabled={form.severity === "info"}
          >
            <Volume2 size={16} /> اختبار الصوت
          </button>
          <button
            className="cc-btn cc-btn--primary"
            disabled={busy || form.title.trim().length < 2 || form.body.trim().length < 2}
            onClick={() => void submit()}
          >
            {busy ? "جاري الإرسال…" : "إرسال الآن"}
          </button>
        </div>
      </section>
    </div>
  );
}

function SoundSettings({
  prefs,
  onClose,
  onSaved,
}: {
  prefs: OperatorPreferences;
  onClose: () => void;
  onSaved: (next: OperatorPreferences) => void;
}) {
  const [draft, setDraft] = useState(prefs);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      onSaved(await saveOperatorPreferences(draft));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="cc-mobile-more-scrim" role="presentation" onClick={onClose}>
      <section
        className="cc-ops-sheet cc-ops-sheet--compact"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cc-mobile-more-sheet__handle" />
        <h2>الصوت وQuiet Hours</h2>
        <label className="cc-toggle-row">
          <input
            type="checkbox"
            checked={draft.sound_enabled}
            onChange={(e) => setDraft({ ...draft, sound_enabled: e.target.checked })}
          />
          <span>
            <strong>تشغيل الصوت</strong>
            <small>يتطلب تفاعلًا وإذنًا وفق المتصفح/PWA.</small>
          </span>
        </label>
        <label className="cc-toggle-row">
          <input
            type="checkbox"
            checked={draft.critical_sound_enabled}
            onChange={(e) => setDraft({ ...draft, critical_sound_enabled: e.target.checked })}
          />
          <span>
            <strong>صوت CRITICAL</strong>
          </span>
        </label>
        <label className="cc-toggle-row">
          <input
            type="checkbox"
            checked={draft.important_sound_enabled}
            onChange={(e) => setDraft({ ...draft, important_sound_enabled: e.target.checked })}
          />
          <span>
            <strong>صوت IMPORTANT</strong>
          </span>
        </label>
        <label className="cc-toggle-row">
          <input
            type="checkbox"
            checked={draft.quiet_hours_enabled}
            onChange={(e) => setDraft({ ...draft, quiet_hours_enabled: e.target.checked })}
          />
          <span>
            <strong>Quiet Hours</strong>
            <small>INFO صامت دائمًا.</small>
          </span>
        </label>
        <div className="cc-form-grid cc-sheet-form">
          <label className="cc-command-field">
            <span>من</span>
            <input
              type="time"
              value={draft.quiet_hours_start.slice(0, 5)}
              onChange={(e) => setDraft({ ...draft, quiet_hours_start: e.target.value })}
            />
          </label>
          <label className="cc-command-field">
            <span>إلى</span>
            <input
              type="time"
              value={draft.quiet_hours_end.slice(0, 5)}
              onChange={(e) => setDraft({ ...draft, quiet_hours_end: e.target.value })}
            />
          </label>
        </div>
        <div className="cc-sheet-actions">
          <button className="cc-btn" onClick={onClose}>
            إلغاء
          </button>
          <button className="cc-btn cc-btn--primary" disabled={busy} onClick={() => void submit()}>
            حفظ
          </button>
        </div>
      </section>
    </div>
  );
}
