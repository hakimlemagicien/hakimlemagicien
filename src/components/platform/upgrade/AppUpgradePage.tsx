import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppCheckoutPanel } from "@/components/platform/upgrade/AppCheckoutPanel";
import { PlanActivateBlock } from "@/components/platform/upgrade/PlanActivateBlock";
import { FeatureCheck, featureCheckToneForPlan } from "@/components/platform/upgrade/FeatureCheck";
import {
  CurrentPlanBadge,
  FeatureComparison,
  RecommendedPlanBadge,
  getUpgradeSurfaceCopy,
} from "@/components/platform/upgrade/upgrade-ui";
import { useMembership } from "@/hooks/useMembership";
import { FREE_TIER, ACTIVATE_PROGRAM_CTA, type SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { getPublicPaidTiers, type PublicPaidTierId } from "@/lib/payments/catalog";
import type { EntitlementTier } from "@/lib/platform/entitlements";
import type { CheckoutReturnSurface } from "@/lib/payments/types";
import { resolveBrowserCheckoutReturn } from "@/lib/payments/payment-service";

const PLAN_POSITIONING: Record<
  "free" | PublicPaidTierId,
  { headline: string; badge?: string }
> = {
  free: { headline: "ابدأ واكتشف MAAKFIT" },
  essential: { headline: "برنامجك الكامل للتدريب والتغذية", badge: "الأفضل للبدء بجدية" },
  premium: { headline: "مزيد من الخيارات والتخصيص أثناء رحلتك", badge: "الأكثر مرونة" },
};

function tierRank(tier: EntitlementTier): number {
  if (tier === "free") return 0;
  if (tier === "essential") return 1;
  if (tier === "premium") return 2;
  return 3;
}

type AppUpgradePageProps = {
  initialPlan?: PublicPaidTierId;
  initialTerm?: SubscriptionTermMonths;
  checkoutReturn?: boolean;
  surface?: CheckoutReturnSurface;
};

export function AppUpgradePage({
  initialPlan,
  initialTerm = 3,
  checkoutReturn = false,
  surface = "DIRECT_UPGRADE",
}: AppUpgradePageProps) {
  const { tier: currentTier, entitlements } = useMembership();
  const publicTiers = getPublicPaidTiers();
  const [selectedPlan, setSelectedPlan] = useState<PublicPaidTierId | null>(initialPlan ?? null);
  const [selectedTerm, setSelectedTerm] = useState<SubscriptionTermMonths>(initialTerm);
  const returnState = checkoutReturn ? resolveBrowserCheckoutReturn(false) : null;
  const surfaceCopy = getUpgradeSurfaceCopy(surface);

  const currentRank = tierRank(currentTier === "visitor" ? "free" : currentTier);

  const purchasablePlans = useMemo(
    () =>
      publicTiers.filter((plan) => {
        const planRank = tierRank(plan.id);
        return planRank > currentRank;
      }),
    [publicTiers, currentRank],
  );

  return (
    <div dir="rtl" className="space-y-5 pb-4">
      <header className="text-right">
        <p className="font-[Tajawal] text-[12px] font-bold text-primary">{surfaceCopy.upgradeHeadline}</p>
        <h1 className="font-[Tajawal] text-[24px] font-black text-[#0F172A]">{ACTIVATE_PROGRAM_CTA}</h1>
        <p className="mt-1 font-[Tajawal] text-[13px] text-[#64748B]">{surfaceCopy.subtitle}</p>
      </header>

      {returnState ? (
        <div className="rounded-2xl border border-[#FFE0CC] bg-[#FFF8F3] px-4 py-3 text-right">
          <p className="font-[Tajawal] text-[13px] font-bold text-[#0F172A]">جاري تأكيد الدفع</p>
          <p className="mt-1 font-[Tajawal] text-[12px] leading-relaxed text-[#64748B]">
            العودة من صفحة الدفع لا تُفعِّل الاشتراك تلقائياً. سيتم التفعيل بعد حدث موثوق من مزود الدفع.
          </p>
        </div>
      ) : null}

      <article className="rounded-[20px] border border-[#E8E4DE] bg-[#FAF8F5] p-4 text-right">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[Tajawal] text-[16px] font-extrabold text-[#0F172A]">{FREE_TIER.name}</h2>
          {currentRank === 0 ? <CurrentPlanBadge /> : null}
        </div>
        <p className="mt-1 font-[Tajawal] text-[12px] text-[#64748B]">{PLAN_POSITIONING.free.headline}</p>
        <ul className="mt-3 space-y-2">
          {FREE_TIER.features.map((feature) => (
            <FeatureCheck key={feature} label={feature} tone="neutral" compact />
          ))}
        </ul>
      </article>

      <div className="grid gap-4">
        {publicTiers.map((plan) => {
          const isCurrent = currentTier === plan.id;
          const canPurchase = purchasablePlans.some((p) => p.id === plan.id);
          const positioning = PLAN_POSITIONING[plan.id];

          return (
            <article
              key={plan.id}
              className={`relative overflow-hidden rounded-[20px] bg-white p-4 text-center shadow-[0_12px_28px_-18px_rgba(15,23,42,0.22)] ${
                plan.popular ? "border-2 border-[#5C9E54]" : "border border-[#E8E4DE]"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                {isCurrent ? <CurrentPlanBadge /> : null}
                {!isCurrent && positioning.badge ? (
                  <RecommendedPlanBadge label={positioning.badge} />
                ) : null}
              </div>

              <h2 className="font-[Tajawal] text-[18px] font-extrabold text-[#0F172A]">{plan.name}</h2>
              <p className="mt-0.5 font-[Tajawal] text-[12px] font-medium text-[#64748B]">{positioning.headline}</p>
              <p className="mt-0.5 font-[Tajawal] text-[11px] text-[#94A3B8]">{plan.tagline}</p>

              <ul className="mt-3 space-y-2 text-right">
                {plan.features.map((feature) => (
                  <FeatureCheck
                    key={feature}
                    label={feature}
                    tone={featureCheckToneForPlan(plan.id)}
                    compact
                  />
                ))}
              </ul>

              {isCurrent ? (
                <p className="mt-4 font-[Tajawal] text-[12px] font-semibold text-[#64748B]">هذه خطتك الحالية</p>
              ) : canPurchase ? (
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setSelectedTerm(3);
                    }}
                    className="flex min-h-11 w-full items-center justify-center rounded-xl border border-primary bg-primary/5 font-[Tajawal] text-[13px] font-extrabold text-primary"
                  >
                    اختيار {plan.name}
                  </button>
                  <PlanActivateBlock plan={plan} compact />
                </div>
              ) : (
                <p className="mt-4 font-[Tajawal] text-[11px] text-[#94A3B8]">
                  {currentRank > tierRank(plan.id)
                    ? "إدارة التخفيض من الفوترة"
                    : "غير متاح للترقية من خطتك الحالية"}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <section className="space-y-2">
        <h2 className="text-right font-[Tajawal] text-[14px] font-black text-[#0F172A]">مقارنة سريعة</h2>
        <FeatureComparison />
      </section>

      {selectedPlan && purchasablePlans.some((p) => p.id === selectedPlan) ? (
        <AppCheckoutPanel
          plan={selectedPlan}
          termMonths={selectedTerm}
          returnSurface={surface}
          onTermChange={setSelectedTerm}
        />
      ) : null}

      {!entitlements.coachChat && currentTier === "premium" ? (
        <p className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-right font-[Tajawal] text-[11px] text-[#64748B]">
          Premium العام V1 لا يشمل دردشة الكوتش — هذه ميزة VIP الداخلية فقط.
        </p>
      ) : null}

      <p className="text-center font-[Tajawal] text-[11px] text-[#94A3B8]">
        إدارة الاشتراك من{" "}
        <Link to="/app/billing" className="font-bold text-primary underline-offset-2 hover:underline">
          الفوترة
        </Link>
      </p>
    </div>
  );
}
