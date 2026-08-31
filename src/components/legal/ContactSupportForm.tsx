import { useMemo, useState } from "react";
import { CURRENT_SUPPORT_EMAIL, CURRENT_WHATSAPP_URL, LEGAL_ROUTES } from "@/lib/legal/policy-catalog";
import {
  createSupportTicket,
  isForbiddenSupportContent,
  type SupportTicketCategory,
} from "@/lib/legal/legal-api";
import type { LegalLocale } from "@/lib/legal/policy-catalog";

const CATEGORIES: { id: SupportTicketCategory; ar: string; en: string }[] = [
  { id: "account", ar: "الحساب", en: "Account" },
  { id: "subscription_billing", ar: "الاشتراك والفوترة", en: "Subscription & Billing" },
  { id: "refund", ar: "الاسترداد", en: "Refund" },
  { id: "technical", ar: "مشكلة تقنية", en: "Technical Issue" },
  { id: "privacy", ar: "الخصوصية", en: "Privacy" },
  { id: "other", ar: "أخرى / شكوى", en: "Other / Complaint" },
];

export function ContactSupportForm({ locale = "ar" }: { locale?: LegalLocale }) {
  const isEn = locale === "en";
  const [category, setCategory] = useState<SupportTicketCategory>("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ ticketId: string; createdAt: string } | null>(null);

  const copy = useMemo(
    () =>
      isEn
        ? {
            name: "Name",
            email: "Email",
            subject: "Subject",
            message: "How can we help?",
            send: "Send request",
            sending: "Sending…",
            sensitive:
              "Do not include passwords, full card numbers, or CVV. We will never ask for those in this form.",
            emergency:
              "MAAKFIT Support and coaching are not medical emergency channels. If you need urgent medical care, contact local emergency services.",
            retry: "Try again",
            fallback: `If sending fails, email ${CURRENT_SUPPORT_EMAIL}`,
            confirm: "Request received",
            ticket: "Ticket ID",
          }
        : {
            name: "الاسم",
            email: "البريد الإلكتروني",
            subject: "الموضوع",
            message: "كيف يمكننا مساعدتك؟",
            send: "إرسال الطلب",
            sending: "جاري الإرسال…",
            sensitive:
              "لا تضع كلمة المرور أو رقم البطاقة الكامل أو رمز CVV. لن نطلب هذه البيانات في هذا النموذج.",
            emergency:
              "دعم MAAKFIT ودردشة الكوتش ليستا قناة طوارئ طبية. إذا احتجت رعاية طبية عاجلة فاتصل بخدمات الطوارئ المحلية.",
            retry: "إعادة المحاولة",
            fallback: `إذا فشل الإرسال راسل ${CURRENT_SUPPORT_EMAIL}`,
            confirm: "تم استلام طلبك",
            ticket: "رقم التذكرة",
          },
    [isEn],
  );

  const submit = async () => {
    if (honeypot) return;
    setError(null);
    if (isForbiddenSupportContent(`${subject} ${message}`)) {
      setError(copy.sensitive);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createSupportTicket({
        category,
        subject,
        message,
        email,
        name,
        language: locale,
      });
      setResult({ ticketId: created.ticketId, createdAt: created.createdAt });
    } catch (err) {
      setError(err instanceof Error && err.message === "missing_fields"
        ? (isEn ? "Please fill subject and message." : "أكمل الموضوع والرسالة.")
        : copy.fallback);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-start">
        <p className="text-sm font-black text-emerald-800">{copy.confirm}</p>
        <p className="mt-2 text-xs font-bold text-emerald-900">
          {copy.ticket}: <span dir="ltr">{result.ticketId}</span>
        </p>
        <p className="mt-1 text-[11px] text-emerald-800" dir="ltr">
          {result.createdAt}
        </p>
        <p className="mt-3 text-[11px] leading-relaxed text-emerald-900">
          {isEn
            ? "Important refund, privacy, cancellation, and security requests are stored with a timestamp and a reviewable status."
            : "طلبات الاسترداد والخصوصية وشكاوى الإلغاء والأمن تُحفظ مع الوقت والحالة للمراجعة."}
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-3xl border border-black/5 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-amber-900">
        {copy.emergency}
      </p>
      <p className="text-[11px] leading-relaxed text-neutral-500">{copy.sensitive}</p>

      <label className="block text-[12px] font-black text-neutral-700">
        {isEn ? "Category" : "الفئة"}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
          className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-neutral-50 px-3 text-sm"
        >
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {isEn ? item.en : item.ar}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-[12px] font-black text-neutral-700">
        {copy.name}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-neutral-50 px-3 text-sm"
          autoComplete="name"
        />
      </label>

      <label className="block text-[12px] font-black text-neutral-700">
        {copy.email}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-neutral-50 px-3 text-sm"
          autoComplete="email"
          required
        />
      </label>

      <label className="block text-[12px] font-black text-neutral-700">
        {copy.subject}
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-black/10 bg-neutral-50 px-3 text-sm"
          required
        />
      </label>

      <label className="block text-[12px] font-black text-neutral-700">
        {copy.message}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 min-h-32 w-full rounded-2xl border border-black/10 bg-neutral-50 px-3 py-2 text-sm"
          required
        />
      </label>

      <input
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        aria-hidden
      />

      {error ? <p className="text-xs font-bold text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#FF6B00] text-sm font-black text-white disabled:opacity-60"
      >
        {submitting ? copy.sending : copy.send}
      </button>

      <p className="text-center text-[11px] text-neutral-500">
        {copy.fallback}
        {" · "}
        <a className="font-bold text-[#FF6B00]" href={CURRENT_WHATSAPP_URL} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
        {" · "}
        <a className="font-bold text-[#FF6B00]" href={LEGAL_ROUTES.refund}>
          {isEn ? "Refund policy" : "سياسة الاسترداد"}
        </a>
      </p>
    </form>
  );
}
