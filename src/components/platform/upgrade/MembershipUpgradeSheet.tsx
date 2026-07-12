import { AnimatePresence, motion } from "framer-motion";
import { Crown, Lock, X } from "lucide-react";
import { FeatureCheck, featureCheckToneForPlan } from "@/components/platform/upgrade/FeatureCheck";
import { PlanActivateBlock } from "@/components/platform/upgrade/PlanActivateBlock";
import { VipFeatureCheck, VipGlassShell } from "@/components/platform/upgrade/VipGlassPlanCard";
import { ACTIVATE_PROGRAM_CTA, PAID_TIERS } from "@/lib/pricing-presentation";
import { useUpgradeFlow } from "./UpgradeContext";

export function MembershipUpgradeSheet() {
  const { open, reason, closeUpgrade } = useUpgradeFlow();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="membership-upgrade"
          className="fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="إغلاق تفعيل البرنامج"
            className="absolute inset-0 bg-[#0F172A]/45 backdrop-blur-[6px]"
            onClick={closeUpgrade}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-10 sm:items-center sm:inset-0 sm:pb-0">
            <motion.div
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-label="فعّل برنامجك الآن"
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="pointer-events-auto max-h-[min(88dvh,760px)] w-full max-w-[430px] overflow-y-auto rounded-[28px] border border-white/70 bg-[#FAF8F5]/95 p-5 shadow-[0_28px_70px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:max-w-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-right">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#FFF1E6] px-2.5 py-1 text-[11px] font-extrabold text-[#FF6B00]">
                    <Lock className="h-3 w-3" strokeWidth={2.4} />
                    ميزة مقفلة
                  </div>
                  <h2 className="font-[Tajawal] text-[20px] font-extrabold leading-tight text-[#0F172A]">
                    {ACTIVATE_PROGRAM_CTA}
                  </h2>
                  <p className="mt-1.5 font-[Tajawal] text-[12px] font-medium leading-relaxed text-[#64748B]">
                    {reason ?? "اختر باقتك أولاً، ثم حدد مدة الاشتراك لتفعيل برنامجك."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeUpgrade}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/[0.06] bg-white text-[#0F172A]"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {PAID_TIERS.map((plan, index) => {
                  const motionProps = {
                    initial: { opacity: 0, y: 14 },
                    animate: { opacity: 1, y: 0 },
                    transition: {
                      delay: 0.05 + index * 0.05,
                      type: "spring" as const,
                      stiffness: 380,
                      damping: 26,
                    },
                  };

                  if (plan.id === "vip") {
                    return (
                      <motion.div key={plan.id} {...motionProps}>
                        <VipGlassShell compact>
                          <h3 className="bg-gradient-to-l from-[#F0D9A8] via-[#FFF3D6] to-[#D4AF78] bg-clip-text font-[Tajawal] text-[18px] font-extrabold text-transparent">
                            {plan.name}
                          </h3>
                          <p className="mt-0.5 font-[Tajawal] text-[12px] font-medium text-white/70">
                            {plan.tagline}
                          </p>

                          <ul className="mt-3 space-y-2 text-right">
                            {plan.features.map((feature) => (
                              <VipFeatureCheck key={feature} label={feature} compact />
                            ))}
                          </ul>

                          <PlanActivateBlock plan={plan} compact onActivated={closeUpgrade} />
                        </VipGlassShell>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.article
                      key={plan.id}
                      {...motionProps}
                      className={`relative overflow-hidden rounded-[20px] bg-white p-4 text-center shadow-[0_12px_28px_-18px_rgba(15,23,42,0.22)] ${
                        plan.popular ? "border-2 border-[#5C9E54]" : "border border-[#E8E4DE]"
                      }`}
                    >
                      {plan.popular ? (
                        <span className="absolute left-0 top-3 inline-flex items-center gap-1 rounded-l-none rounded-r-md bg-[#5C9E54] px-2.5 py-1 font-[Tajawal] text-[10px] font-bold text-white">
                          <Crown className="h-3 w-3" />
                          المنتج الرئيسي
                        </span>
                      ) : null}

                      <h3 className="font-[Tajawal] text-[18px] font-extrabold text-[#0F172A]">
                        {plan.name}
                      </h3>
                      <p className="mt-0.5 font-[Tajawal] text-[12px] font-medium text-[#64748B]">
                        {plan.tagline}
                      </p>

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

                      <PlanActivateBlock plan={plan} compact onActivated={closeUpgrade} />
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
