import { AnimatePresence, motion } from "framer-motion";
import { Crown, Lock, X } from "lucide-react";
import { FeatureCheck, featureCheckToneForPlan } from "@/components/platform/upgrade/FeatureCheck";
import { PlanActivateBlock } from "@/components/platform/upgrade/PlanActivateBlock";
import { VipFeatureCheck, VipGlassShell } from "@/components/platform/upgrade/VipGlassPlanCard";
import { ACTIVATE_PROGRAM_CTA, PAID_TIERS } from "@/lib/pricing-presentation";
import { useUpgradeFlow } from "./UpgradeContext";

const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

const dialogMotion = {
  initial: { opacity: 0, scale: 0.86, y: 24 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 16 },
  transition: { type: "spring" as const, stiffness: 420, damping: 30, mass: 0.82 },
};

export function MembershipUpgradeSheet() {
  const { open, reason, closeUpgrade } = useUpgradeFlow();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="membership-upgrade"
          className="platform-upgrade-overlay"
          role="presentation"
          {...backdropMotion}
        >
          <button
            type="button"
            aria-label="إغلاق نافذة الباقات"
            className="platform-upgrade-overlay__backdrop"
            onClick={closeUpgrade}
          />

          <div className="platform-upgrade-overlay__stage">
            <motion.div
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-label="اختر باقتك"
              className="platform-upgrade-dialog"
              {...dialogMotion}
            >
              <div className="platform-upgrade-dialog__head">
                <div className="min-w-0 flex-1 text-right">
                  <div className="platform-upgrade-dialog__badge">
                    <Lock className="h-3 w-3" strokeWidth={2.4} aria-hidden />
                    ميزة مقفلة
                  </div>
                  <h2 className="platform-upgrade-dialog__title">{ACTIVATE_PROGRAM_CTA}</h2>
                  <p className="platform-upgrade-dialog__reason">
                    {reason ?? "اختر باقتك أولاً، ثم حدد مدة الاشتراك لتفعيل برنامجك."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeUpgrade}
                  className="platform-upgrade-dialog__close platform-touch"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              <div className="platform-upgrade-dialog__plans">
                {PAID_TIERS.map((plan, index) => {
                  const motionProps = {
                    initial: { opacity: 0, y: 18, scale: 0.97 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    transition: {
                      delay: 0.08 + index * 0.06,
                      type: "spring" as const,
                      stiffness: 400,
                      damping: 28,
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
                          <Crown className="h-3 w-3" aria-hidden />
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
