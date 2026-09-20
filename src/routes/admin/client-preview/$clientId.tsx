import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Dumbbell, Eye, Home, LockKeyhole, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminErrorState, AdminStatusBadge } from "@/components/admin/AdminPage";
import { AdminSkeletonRows } from "@/components/admin/AdminConfirmDialog";
import { getClientExperiencePreview, type ClientExperiencePreview } from "@/lib/admin/admin-command-center-api";
import {
  isMealSlotUnlockedByEntitlements,
  normalizeEntitlements,
} from "@/lib/platform/entitlements";

type PreviewTab = "home" | "training" | "nutrition" | "locks";
type PreviewSearch = { screen: PreviewTab };

export const Route = createFileRoute("/admin/client-preview/$clientId")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): PreviewSearch => ({
    screen: ["home", "training", "nutrition", "locks"].includes(String(search.screen)) ? search.screen as PreviewTab : "home",
  }),
  head: () => ({ meta: [{ title: "عرض كتجربة العميل | مركز التشغيل" }] }),
  component: ClientExperiencePreviewPage,
});

function ClientExperiencePreviewPage() {
  const { clientId } = Route.useParams();
  const { screen } = Route.useSearch();
  const [data, setData] = useState<ClientExperiencePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getClientExperiencePreview(clientId).then((next) => { if (!cancelled) setData(next); }).catch((cause) => { console.error(cause); if (!cancelled) setError("تعذر إنشاء معاينة العميل."); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId]);

  return <div className="cc-client-preview-page">
    <header className="cc-client-preview-toolbar"><Link to="/admin/clients/$clientId" params={{ clientId }} search={{ tab: "overview" }} className="cc-btn cc-btn--ghost"><ChevronRight size={17} /> ملف العميل</Link><div><Eye size={17} /><strong>عرض كتجربة العميل</strong><span>قراءة فقط — لا يغيّر البيانات</span></div><AdminStatusBadge tone="success"><ShieldCheck size={12} /> آمن</AdminStatusBadge></header>
    {error ? <AdminErrorState message={error} /> : null}
    {loading ? <AdminSkeletonRows rows={7} /> : null}
    {!loading && data ? <div className="cc-client-device-frame"><div className="cc-client-device-status"><span>9:41</span><strong>MAAKFIT</strong><span>●●●</span></div><ClientPreviewSurface data={data} screen={screen} /><nav className="cc-client-preview-nav">{([['home','الرئيسية',Home],['training','التدريب',Dumbbell],['nutrition','التغذية',UtensilsCrossed],['locks','المقفلة',LockKeyhole]] as const).map(([id,label,Icon]) => <Link key={id} to="/admin/client-preview/$clientId" params={{ clientId }} search={{ screen: id }} className={screen === id ? "is-active" : undefined}><Icon /><span>{label}</span></Link>)}</nav></div> : null}
  </div>;
}

function ClientPreviewSurface({ data, screen }: { data: ClientExperiencePreview; screen: PreviewTab }) {
  const training = data.training as { name_ar?: string; assignment?: { name_ar?: string; status?: string; days_per_week?: number }; weeks?: Array<{ week_number: number; days?: Array<{ day_number: number; title_ar: string; day_type: string; exercises?: unknown[] }> }> } | null;
  const nutrition = data.nutrition as { name_ar?: string; status?: string; slots?: Array<{ slot_key: string; slot_label: string; name_ar: string; calories: number; time_label: string }> } | null;
  const rawTier = String(data.membership?.tier ?? "free").toLowerCase();
  const membershipTier = rawTier === "plus" ? "essential" : rawTier === "pro" ? "premium" : rawTier;
  const entitlements = normalizeEntitlements({
    tier: membershipTier,
    is_paid: membershipTier !== "free",
    coach_chat: membershipTier === "vip",
  });
  const membershipLabel = membershipTier === "essential" ? "PLUS" : membershipTier === "premium" ? "PRO" : membershipTier.toUpperCase();
  const firstWeek = training?.weeks?.[0];
  const clientName = data.client.name?.split(" ")[0] || "بطل";
  const profileLine = useMemo(() => [data.client.gender === "female" ? "أنثى" : data.client.gender === "male" ? "ذكر" : "الجنس غير محدد", data.client.goal || "الهدف غير محدد", data.client.level || "المستوى غير محدد"].join(" · "), [data.client]);

  if (screen === "training") return <main className="cc-client-preview-surface"><div className="cc-client-preview-title"><div><span>برنامجك</span><h1>{training?.name_ar || training?.assignment?.name_ar || "لا يوجد برنامج منشور"}</h1></div><Dumbbell /></div>{training ? <><div className="cc-client-preview-week"><strong>الأسبوع {firstWeek?.week_number ?? 1}</strong><span>{training.assignment?.days_per_week ?? firstWeek?.days?.length ?? 0} أيام تدريب</span></div><div className="cc-client-preview-day-list">{firstWeek?.days?.map((day) => <article key={day.day_number} className={day.day_type === "rest" ? "is-rest" : ""}><span>اليوم {day.day_number}</span><strong>{day.title_ar || (day.day_type === "rest" ? "راحة واستشفاء" : "جلسة تدريب")}</strong><small>{day.day_type === "rest" ? "استشفاء" : `${day.exercises?.length ?? 0} تمارين`}</small>{day.day_type !== "rest" && !entitlements.training.fullSession ? <div className="cc-client-preview-exercise-locks" aria-label="بطاقات التمارين مقفلة">{Array.from({ length: Math.max(1, day.exercises?.length ?? 0) }, (_, index) => <span key={index}><LockKeyhole /> تمرين مخصص مقفل</span>)}</div> : null}</article>)}</div></> : <LockedCard title="التدريب غير مجهز" body="لا يوجد Assignment منشور لهذا العميل؛ لن تعرض المعاينة برنامجًا وهميًا." />}</main>;
  if (screen === "nutrition") return <main className="cc-client-preview-surface"><div className="cc-client-preview-title"><div><span>تغذيتك اليوم</span><h1>{nutrition?.name_ar || "خطة التغذية"}</h1></div><UtensilsCrossed /></div>{nutrition?.slots?.length ? <div className="cc-client-preview-meals">{nutrition.slots.map((slot, index) => { const today = "preview"; const unlocked = isMealSlotUnlockedByEntitlements(entitlements, { slotId: slot.slot_key, slotIndex: index, dateKey: today, todayKey: today }); return unlocked ? <article key={slot.slot_key}><div><span>{slot.slot_label}</span><small>{slot.time_label}</small></div><strong>{slot.name_ar}</strong><em>{slot.calories} سعرة</em></article> : <article key={slot.slot_key} className="is-locked"><div><span>{slot.slot_label}</span><small>مقفلة حسب الباقة</small></div><strong><LockKeyhole /> وجبة مخصصة مقفلة</strong><em>لا تُعرض التفاصيل</em></article>; })}</div> : <LockedCard title="خطة التغذية قيد التجهيز" body="لا يوجد Assignment منشور؛ لن تعرض المعاينة وجبة تجريبية أو بيانات وهمية." />}</main>;
  if (screen === "locks") return <main className="cc-client-preview-surface"><div className="cc-client-preview-title"><div><span>حالات الوصول</span><h1>ما يراه العميل فعليًا</h1></div><LockKeyhole /></div><div className="cc-client-preview-locks"><AccessRow label="هيكل برنامج التدريب" locked={!training} /><AccessRow label="تفاصيل التدريب الكاملة" locked={!entitlements.training.fullSession || !training} /><AccessRow label="فطور FREE الحقيقي" locked={!nutrition} /><AccessRow label="خطة التغذية الكاملة" locked={!entitlements.nutrition.fullDay || !nutrition} /><AccessRow label="دردشة الكوتش" locked={!entitlements.coachChat} /></div><p className="cc-preview-note">هذه المعاينة تستخدم عقد Entitlements نفسه وتقرأ Latest Published Assignment فقط؛ فتحها لا يغيّر بيانات العميل.</p></main>;
  return <main className="cc-client-preview-surface"><div className="cc-client-preview-hello"><span>مرحبًا، {clientName}</span><h1>جاهز لخطوتك القادمة؟</h1><p>{profileLine}</p><AdminStatusBadge tone={membershipTier === "free" ? "free" : "premium"}>{membershipLabel}</AdminStatusBadge></div><div className="cc-client-preview-hero"><span>هدفك</span><strong>{data.client.goal || "يحتاج إكمال البيانات"}</strong><small>{data.client.training_days ? `${data.client.training_days} أيام تدريب أسبوعيًا` : "أيام التدريب غير محددة"}</small></div><div className="cc-client-preview-home-grid"><article><Dumbbell /><span>برنامج التدريب</span><strong>{training ? entitlements.training.fullSession ? "جاهز ومفتوح" : "جاهز — التفاصيل مقفلة" : "قيد التجهيز"}</strong></article><article><UtensilsCrossed /><span>خطة التغذية</span><strong>{nutrition ? entitlements.nutrition.fullDay ? "جاهزة ومفتوحة" : "فطور واحد مفتوح" : "قيد التجهيز"}</strong></article></div></main>;
}

function LockedCard({ title, body }: { title: string; body: string }) { return <div className="cc-client-preview-locked"><LockKeyhole /><strong>{title}</strong><p>{body}</p></div>; }
function AccessRow({ label, locked }: { label: string; locked: boolean }) { return <div><span>{label}</span><AdminStatusBadge tone={locked ? "inactive" : "success"}>{locked ? "مقفل" : "متاح"}</AdminStatusBadge></div>; }
