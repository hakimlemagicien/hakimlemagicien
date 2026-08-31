import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { FeatureCheck, featureCheckToneForPlan } from "@/components/platform/upgrade/FeatureCheck";
import { PlanActivateBlock } from "@/components/platform/upgrade/PlanActivateBlock";
import { ACTIVATE_PROGRAM_CTA, type SubscriptionTermMonths } from "@/lib/pricing-presentation";
import { getPublicPaidTiers } from "@/lib/payments/catalog";
import type { PublicPaidTierId } from "@/lib/payments/types";
import { resolveBrowserCheckoutReturn } from "@/lib/payments/payment-service";

type AppUpgradePageProps = {
  initialPlan?: PublicPaidTierId;
  initialTerm?: SubscriptionTermMonths;
  checkoutReturn?: boolean;
};

export function AppUpgradePage({
  initialPlan,
  initialTerm,
  checkoutReturn = false,
}: AppUpgradePageProps) {
  const publicTiers = getPublicPaidTiers();
  const returnState = checkoutReturn ? resolveBrowserCheckoutReturn(false) : null;

  return (
    <div dir="rtl" className="space-y-5">
      <header className="text-right">
        <p className="font-[Tajawal] text-[12px] font-bold text-primary">ترقية البرنامج</p>
        <h1 className="font-[Tajawal] text-[24px] font-black text-[#0F172A]">{ACTIVATE_PROGRAM_CTA}</h1>
        <p className="mt-1 font-[Tajawal] text-[13px] text-[#64748B]">
          اختر Essential أو Premium — الدفع الآلي يُفعَّل بعد تأكيد مزود الدفع (P4B).
        </p>
        {initialPlan && initialTerm ? (
          <p className="mt-2 font-[Tajawal] text-[12px] font-semibold text-[#0F172A]">
            الاختيار الحالي: {initialPlan} · {initialTerm} أشهر
          </p>
        ) : null}
      </header>

      {returnState ? (
        <div className="rounded-2xl border border-[#FFE0CC] bg-[#FFF8F3] px-4 py-3 text-right">
          <p className="font-[Tajawal] text-[13px] font-bold text-[#0F172A]">جاري تأكيد الدفع</p>
          <p className="mt-1 font-[Tajawal] text-[12px] leading-relaxed text-[#64748B]">
            العودة من صفحة الدفع لا تُفعِّل الاشتراك تلقائياً. سيتم التفعيل بعد حدث موثوق من مزود الدفع.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4">
        {publicTiers.map((plan) => (
          <article
            key={plan.id}
            className={`relative overflow-hidden rounded-[20px] bg-white p-4 text-center shadow-[0_12px_28px_-18px_rgba(15,23,42,0.22)] ${
              plan.popular ? "border-2 border-[#5C9E54]" : "border border-[#E8E4DE]"
            }`}
          >
            {plan.popular ? (
              <span className="absolute left-0 top-3 inline-flex items-center gap-1 rounded-l-none rounded-r-md bg-[#5C9E54] px-2.5 py-1 font-[Tajawal] text-[10px] font-bold text-white">
                <Crown className="h-3 w-3" aria-hidden />
                المنتج الرئيسي
              </span>
            ) : null}

            <h2 className="font-[Tajawal] text-[18px] font-extrabold text-[#0F172A]">{plan.name}</h2>
            <p className="mt-0.5 font-[Tajawal] text-[12px] font-medium text-[#64748B]">{plan.tagline}</p>

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

            <PlanActivateBlock plan={plan} compact />
          </article>
        ))}
      </div>

      <p className="text-center font-[Tajawal] text-[11px] text-[#94A3B8]">
        إدارة الاشتراك من{" "}
        <Link to="/app/billing" className="font-bold text-primary underline-offset-2 hover:underline">
          الفوترة
        </Link>
      </p>
    </div>
  );
}
