import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PlanActivateBlock } from "@/components/platform/upgrade/PlanActivateBlock";
import { FeatureCheck, featureCheckToneForPlan } from "@/components/platform/upgrade/FeatureCheck";
import { VipFeatureCheck, VipGlassShell } from "@/components/platform/upgrade/VipGlassPlanCard";
import {
  ACTIVATE_PROGRAM_CTA,
  FREE_TIER,
  PAID_TIERS,
  type PaidTierCatalog,
} from "@/lib/pricing-presentation";

function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

function PaidPlanCard({
  plan,
  index,
  inView,
}: {
  plan: PaidTierCatalog;
  index: number;
  inView: boolean;
}) {
  const reveal = inView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0";
  const delay = { transitionDelay: `${index * 90}ms` } as const;

  if (plan.id === "vip") {
    return (
      <VipGlassShell
        className={`transition-all duration-700 ${reveal}`}
        style={delay}
      >
        <h3 className="bg-gradient-to-l from-[#F0D9A8] via-[#FFF3D6] to-[#D4AF78] bg-clip-text font-[Tajawal] text-[22px] font-extrabold text-transparent">
          {plan.name}
        </h3>
        <p className="mt-1 font-[Tajawal] text-[13px] font-medium text-white/70">{plan.tagline}</p>
        <p className="mt-1 font-[Tajawal] text-[11px] font-bold text-[#D4AF78]/80">{plan.role}</p>

        <ul className="mt-5 space-y-3 text-right">
          {plan.features.map((feature) => (
            <VipFeatureCheck key={feature} label={feature} />
          ))}
        </ul>

        <PlanActivateBlock plan={plan} />
      </VipGlassShell>
    );
  }

  return (
    <article
      className={`relative overflow-hidden rounded-[22px] bg-white p-5 text-center shadow-[0_12px_32px_-18px_rgba(15,23,42,0.2)] transition-all duration-700 sm:p-6 ${
        plan.popular ? "border-2 border-[#5C9E54]" : "border border-[#E8E4DE]"
      } ${reveal}`}
      style={delay}
    >
      {plan.popular ? (
        <span className="absolute left-0 top-4 rounded-l-none rounded-r-md bg-[#5C9E54] px-3 py-1 font-[Tajawal] text-[11px] font-bold text-white shadow-sm">
          المنتج الرئيسي
        </span>
      ) : null}

      <h3 className="font-[Tajawal] text-[22px] font-extrabold text-[#0F172A]">{plan.name}</h3>
      <p className="mt-1 font-[Tajawal] text-[13px] font-medium text-[#64748B]">{plan.tagline}</p>
      <p className="mt-1 font-[Tajawal] text-[11px] font-bold text-[#94A3B8]">{plan.role}</p>

      <ul className="mt-5 space-y-3 text-right">
        {plan.features.map((feature) => (
          <FeatureCheck key={feature} label={feature} tone={featureCheckToneForPlan(plan.id)} />
        ))}
      </ul>

      <PlanActivateBlock plan={plan} />
    </article>
  );
}

export default function PricingTransparency() {
  const free = useInView<HTMLDivElement>();
  const head = useInView<HTMLDivElement>();
  const cards = useInView<HTMLDivElement>();

  return (
    <section
      id="pricing"
      dir="rtl"
      className="relative w-full overflow-hidden bg-[#FAF8F5] py-12 font-[Tajawal,Cairo,sans-serif] sm:py-16 lg:py-20"
    >
      <div className="relative mx-auto max-w-[430px] px-[18px] lg:max-w-5xl lg:px-8">
        <div
          ref={head.ref}
          className={`text-center transition-all duration-700 ${
            head.inView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <h2 className="font-[Tajawal] text-[26px] font-extrabold leading-tight tracking-tight text-[#0F172A] sm:text-[30px]">
            اختر الباقة المناسبة لك
          </h2>
          <p className="mt-2 font-[Tajawal] text-[13px] font-medium leading-relaxed text-[#64748B] sm:text-[14px]">
            نبني الثقة أولاً — ثم نفعّل برنامجك الشخصي داخل المنصة
          </p>
        </div>

        <div
          ref={free.ref}
          className={`mt-8 rounded-[22px] border border-[#E8E4DE] bg-white p-5 text-center shadow-[0_14px_36px_-20px_rgba(15,23,42,0.22)] transition-all duration-700 sm:mt-10 sm:p-6 ${
            free.inView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <h3 className="font-[Tajawal] text-[22px] font-extrabold text-[#0F172A]">{FREE_TIER.name}</h3>
          <p className="mt-1 font-[Tajawal] text-[13px] font-medium text-[#64748B]">{FREE_TIER.tagline}</p>
          <p className="mt-1 font-[Tajawal] text-[11px] font-bold text-[#94A3B8]">{FREE_TIER.role}</p>

          <ul className="mt-5 space-y-3 text-right">
            {FREE_TIER.features.map((item) => (
              <FeatureCheck key={item} label={item} tone="neutral" />
            ))}
          </ul>

          <Link
            to="/quiz"
            className="mt-5 flex w-full items-center justify-center rounded-xl border border-[#D6D3CD] bg-white px-4 py-3 font-[Tajawal] text-[14px] font-extrabold text-[#0F172A] transition hover:bg-[#FAF8F5]"
          >
            {ACTIVATE_PROGRAM_CTA}
          </Link>
        </div>

        <div
          ref={cards.ref}
          className="mt-8 grid grid-cols-1 gap-4 lg:mt-10 lg:grid-cols-3 lg:gap-5"
        >
          {PAID_TIERS.map((plan, index) => (
            <PaidPlanCard key={plan.id} plan={plan} index={index} inView={cards.inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
