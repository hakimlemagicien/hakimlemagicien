import { Link } from "@tanstack/react-router";
import { ChevronDown, Lock, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { CheckoutReturnSurface } from "@/lib/payments/types";
import { cn } from "@/lib/utils";

export type UpgradeSurface = CheckoutReturnSurface | "SWAP_LIMIT";

const SURFACE_COPY: Record<
  UpgradeSurface,
  { title: string; subtitle: string; cta: string; upgradeHeadline: string }
> = {
  TRAINING: {
    title: "أكمل حصتك التدريبية",
    subtitle: "بقية التمارين مختارة حسب هدفك ومستواك ومكان التدريب.",
    cta: "عرض الباقات",
    upgradeHeadline: "افتح بقية حصتك",
  },
  NUTRITION: {
    title: "أكمل خطتك الغذائية",
    subtitle: "الخطة الكاملة تنظّم بقية وجباتك حسب هدفك الغذائي.",
    cta: "فتح خطتي الغذائية",
    upgradeHeadline: "أكمل خطتك الغذائية",
  },
  DIRECT_UPGRADE: {
    title: "اختر الباقة المناسبة لك",
    subtitle: "Essential أو Premium — بدون VIP للبيع العام.",
    cta: "عرض الباقات",
    upgradeHeadline: "اختر الباقة المناسبة لك",
  },
  BILLING: {
    title: "إدارة اشتراكك",
    subtitle: "راجع خطتك أو رقِّ إلى باقة أعلى.",
    cta: "عرض الباقات",
    upgradeHeadline: "ترقية الاشتراك",
  },
  SWAP_LIMIT: {
    title: "استخدمت تغييرك اليومي",
    subtitle: "هل تحتاج مرونة أكبر في اختياراتك الغذائية؟",
    cta: "اكتشف Premium",
    upgradeHeadline: "مرونة أكبر مع Premium",
  },
};

export function UpgradeContextHeader({
  surface = "DIRECT_UPGRADE",
  reason,
}: {
  surface?: UpgradeSurface;
  reason?: string | null;
}) {
  const copy = SURFACE_COPY[surface];
  return (
    <div className="text-right">
      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-[Tajawal] text-[10px] font-bold text-primary">
        <Lock className="h-3 w-3" aria-hidden />
        ميزة مقفلة
      </div>
      <h2 className="mt-2 font-[Tajawal] text-[18px] font-black text-[#0F172A]">{copy.title}</h2>
      <p className="mt-1 font-[Tajawal] text-[12px] leading-relaxed text-[#64748B]">
        {reason?.trim() || copy.subtitle}
      </p>
    </div>
  );
}

export function TrainingFreeConversionPanel({
  remainingExerciseCount,
  onLater,
}: {
  remainingExerciseCount: number;
  onLater: () => void;
}) {
  const remainingCopy =
    remainingExerciseCount > 0
      ? `بقيت ${remainingExerciseCount} ${remainingExerciseCount === 1 ? "تمرين" : "تمارين"} في حصة اليوم`
      : "بقية حصتك جاهزة لك";

  return (
    <div className="rounded-2xl border border-primary/20 bg-[#FFF8F3] p-4 text-right" dir="rtl">
      <p className="font-[Tajawal] text-[15px] font-black text-[#0F172A]">أكملت أول تمرين 💪</p>
      <p className="mt-1 font-[Tajawal] text-[12px] font-extrabold text-primary">{remainingCopy}</p>
      <p className="mt-1 font-[Tajawal] text-[12px] leading-relaxed text-[#64748B]">
        تمارين إضافية مختارة حسب هدفك ومستواك ومكان التدريب.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <UpgradeSurfaceLink
          surface="TRAINING"
          className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 font-[Tajawal] text-[13px] font-extrabold text-white"
        >
          عرض خطتي الكاملة
        </UpgradeSurfaceLink>
        <button
          type="button"
          onClick={onLater}
          className="flex min-h-10 items-center justify-center rounded-xl border border-border bg-white px-4 font-[Tajawal] text-[12px] font-bold text-[#64748B]"
        >
          لاحقًا
        </button>
      </div>
    </div>
  );
}

export function NutritionFreeConversionBanner() {
  return (
    <div className="rounded-2xl border border-[#D8EFE0] bg-[#F0FAF4] p-3.5 text-right" dir="rtl">
      <p className="font-[Tajawal] text-[13px] font-black text-[#166534]">وجبتك المجانية لليوم جاهزة 🥗</p>
      <p className="mt-1 font-[Tajawal] text-[11px] leading-relaxed text-[#166534]/85">
        الخطة الكاملة تنظّم بقية وجباتك حسب هدفك الغذائي.
      </p>
      <UpgradeSurfaceLink
        surface="NUTRITION"
        className="mt-2 inline-block font-[Tajawal] text-[12px] font-extrabold text-primary underline-offset-2 hover:underline"
      >
        فتح خطتي الغذائية
      </UpgradeSurfaceLink>
    </div>
  );
}

export function MealSwapAllowance({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF6FF] px-2.5 py-1 font-[Tajawal] text-[10px] font-bold text-[#1D4ED8]">
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function PremiumAlternativeBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3FAF2] px-2 py-0.5 font-[Tajawal] text-[10px] font-bold text-[#5C9E54]">
      اختر البديل المناسب لك
    </span>
  );
}

export function LockedFeatureCard({
  title,
  description,
  onUnlock,
  ariaLabel,
}: {
  title: string;
  description: string;
  onUnlock: () => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      aria-label={ariaLabel ?? title}
      className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-card p-3.5 text-right transition active:scale-[0.99]"
      dir="rtl"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Lock className="h-4 w-4" strokeWidth={2.3} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-[Tajawal] text-[13px] font-black text-foreground">{title}</span>
        <span className="mt-0.5 block font-[Tajawal] text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

export function CurrentPlanBadge() {
  return (
    <span className="inline-flex rounded-full bg-[#E8E4DE] px-2.5 py-0.5 font-[Tajawal] text-[10px] font-bold text-[#64748B]">
      خطتك الحالية
    </span>
  );
}

export function RecommendedPlanBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#5C9E54] px-2.5 py-0.5 font-[Tajawal] text-[10px] font-bold text-white">
      {label}
    </span>
  );
}

export function PromotedPlanBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#7C3AED] px-2.5 py-0.5 font-[Tajawal] text-[10px] font-bold text-white shadow-[0_6px_14px_-6px_rgba(124,58,237,0.55)]">
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function MealSwapLimitState({
  onStay,
}: {
  onStay: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E9D5FF] bg-gradient-to-b from-[#F7F1FF] to-white p-4 text-right" dir="rtl">
      <p className="font-[Tajawal] text-[15px] font-black text-[#0F172A]">استخدمت تغييرك اليومي</p>
      <p className="mt-1 font-[Tajawal] text-[12px] leading-relaxed text-[#64748B]">
        هل تحتاج مرونة أكبر في اختياراتك الغذائية؟ Premium يمنحك خيارات أوسع وبدائل أكثر.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <UpgradeSurfaceLink
          surface="DIRECT_UPGRADE"
          plan="premium"
          className="flex min-h-11 items-center justify-center rounded-xl bg-[#7C3AED] px-4 font-[Tajawal] text-[13px] font-extrabold text-white"
        >
          اكتشف Premium
        </UpgradeSurfaceLink>
        <button
          type="button"
          onClick={onStay}
          className="flex min-h-10 items-center justify-center rounded-xl border border-[#E9D5FF] bg-white px-4 font-[Tajawal] text-[12px] font-bold text-[#64748B]"
        >
          ابقَ على وجبتي الحالية
        </button>
      </div>
    </div>
  );
}

type ComparisonRow = {
  feature: string;
  free: string;
  essential: string;
  premium: string;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "الملف الشخصي", free: "✓", essential: "✓", premium: "✓" },
  { feature: "التقدم", free: "✓", essential: "✓", premium: "✓" },
  { feature: "الأدوات والمحتوى", free: "✓", essential: "✓", premium: "✓" },
  { feature: "برنامج التدريب", free: "معاينة شخصية", essential: "برنامج مفعّل", premium: "برنامج مفعّل" },
  { feature: "تمارين/حصة", free: "1", essential: "كامل", premium: "كامل" },
  { feature: "تغيير تمرين/وجبة", free: "—", essential: "مدعوم", premium: "مرن" },
  { feature: "التغذية", free: "وجبة/يوم", essential: "خطة كاملة", premium: "خطة كاملة" },
  { feature: "بديل أي تمرين", free: "—", essential: "—", premium: "✓" },
  { feature: "متابعة البرنامج", free: "—", essential: "أساسية", premium: "دورية" },
];

const COMPARISON_GROUPS: { title: string; rows: ComparisonRow[] }[] = [
  {
    title: "الأساسيات",
    rows: COMPARISON_ROWS.slice(0, 3),
  },
  {
    title: "التدريب",
    rows: COMPARISON_ROWS.slice(3, 5),
  },
  {
    title: "التغذية والمرونة",
    rows: COMPARISON_ROWS.slice(5),
  },
];

function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <div
          key={row.feature}
          className="grid grid-cols-4 gap-0 border-b border-[#E8E4DE]/80 px-2 py-2.5 text-center font-[Tajawal] text-[10px] last:border-0"
        >
          <span className="text-right font-bold text-[#64748B]">{row.feature}</span>
          <span className="text-[#0F172A]">{row.free}</span>
          <span className="text-[#0F172A]">{row.essential}</span>
          <span className="font-bold text-[#7C3AED]">{row.premium}</span>
        </div>
      ))}
    </>
  );
}

export function FeatureComparison() {
  const [expanded, setExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    الأساسيات: true,
    التدريب: false,
    "التغذية والمرونة": false,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E4DE] bg-white">
      <div className="hidden md:block">
        <div className="grid grid-cols-4 gap-0 border-b border-[#E8E4DE] bg-[#FAF8F5] px-2 py-2 text-center font-[Tajawal] text-[10px] font-extrabold text-[#0F172A]">
          <span className="text-right">الميزة</span>
          <span>Free</span>
          <span>Essential</span>
          <span>Premium</span>
        </div>
        <ComparisonTable rows={COMPARISON_ROWS} />
      </div>

      <div className="md:hidden">
        {COMPARISON_GROUPS.map((group) => {
          const isOpen = openGroups[group.title];
          return (
            <div key={group.title} className="border-b border-[#E8E4DE]/80 last:border-0">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="flex w-full items-center justify-between px-3 py-3 text-right font-[Tajawal] text-[12px] font-extrabold text-[#0F172A]"
              >
                <span>{group.title}</span>
                <ChevronDown
                  className={cn("h-4 w-4 text-[#64748B] transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="border-t border-[#E8E4DE]/60 bg-[#FAF8F5]/60">
                  <div className="grid grid-cols-4 gap-0 border-b border-[#E8E4DE] px-2 py-1.5 text-center font-[Tajawal] text-[9px] font-extrabold text-[#94A3B8]">
                    <span className="text-right">الميزة</span>
                    <span>Free</span>
                    <span>Ess.</span>
                    <span>Prem.</span>
                  </div>
                  <ComparisonTable rows={group.rows} />
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-center gap-1 px-3 py-2.5 font-[Tajawal] text-[11px] font-extrabold text-primary"
        >
          {expanded ? "إخفاء المقارنة الكاملة" : "عرض المقارنة الكاملة"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
        </button>

        {expanded ? (
          <div className="border-t border-[#E8E4DE]">
            <div className="grid grid-cols-4 gap-0 border-b border-[#E8E4DE] bg-[#FAF8F5] px-2 py-2 text-center font-[Tajawal] text-[9px] font-extrabold text-[#0F172A]">
              <span className="text-right">الميزة</span>
              <span>Free</span>
              <span>Essential</span>
              <span>Premium</span>
            </div>
            <ComparisonTable rows={COMPARISON_ROWS} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UpgradeSurfaceLink({
  surface,
  plan,
  term,
  className,
  children,
}: {
  surface: CheckoutReturnSurface;
  plan?: "essential" | "premium";
  term?: 3 | 6;
  className?: string;
  children: React.ReactNode;
}) {
  const copy = SURFACE_COPY[surface];
  return (
    <Link
      to="/app/upgrade"
      search={{
        surface,
        ...(plan ? { plan } : {}),
        ...(term ? { term } : {}),
      }}
      className={cn(className)}
      aria-label={copy.upgradeHeadline}
    >
      {children}
    </Link>
  );
}

export function getUpgradeSurfaceCopy(surface: UpgradeSurface) {
  return SURFACE_COPY[surface];
}
