import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PRODUCT_SUMMARY } from "@/lib/site-legal";
import { buildCheckoutDisclosure, resolvePaidTierId } from "@/lib/legal/billing";
import { formatIllustrativeDaily } from "@/lib/pricing-presentation";
import type { CheckoutTier } from "./types";

function TrophySvg() {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden className="h-14 w-14">
      <defs>
        <linearGradient id="checkout-trg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD56B" />
          <stop offset="1" stopColor="#E69300" />
        </linearGradient>
      </defs>
      <path fill="url(#checkout-trg)" d="M20 8h24v6c0 9-5.4 16-12 16S20 23 20 14V8z" />
      <rect x="26" y="30" width="12" height="10" rx="2" fill="#E69300" />
      <rect x="18" y="40" width="28" height="6" rx="2" fill="#B36A00" />
      <path d="M20 12H12v4c0 5 4 9 9 9" fill="none" stroke="#E69300" strokeWidth="3" />
      <path d="M44 12h8v4c0 5-4 9-9 9" fill="none" stroke="#E69300" strokeWidth="3" />
      <g fill="#FFF3B0">
        <path d="M32 14l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" />
      </g>
    </svg>
  );
}

type CheckoutSummaryCardProps = {
  tier: CheckoutTier;
  resolvedAmount?: number | null;
  originalAmount?: number | null;
  promotionEndsAt?: string | null;
};

function PromotionCountdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  if (remaining == null)
    return <div className="mt-1 text-[9px] font-bold text-[#C2410C]">عرض محدود</div>;
  if (remaining <= 0)
    return (
      <div className="mt-1 text-[9px] font-bold text-[#B91C1C]">انتهى العرض — جارٍ تحديث السعر</div>
    );
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  return (
    <div className="mt-1 text-[9px] font-bold text-[#C2410C]">
      متبقي {days ? `${days}ي ` : ""}
      {clock}
    </div>
  );
}

export function CheckoutSummaryCard({
  tier,
  resolvedAmount,
  originalAmount,
  promotionEndsAt,
}: CheckoutSummaryCardProps) {
  const planId = resolvePaidTierId(tier.id);
  const months = tier.billingPeriodMonths ?? 3;
  const disclosure = planId ? buildCheckoutDisclosure(planId, months) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="checkout-summary-card relative mt-5 flex items-center gap-4 overflow-hidden rounded-3xl border border-[#FF6B0033] bg-gradient-to-br from-[#FFF9F4] via-[#FFF6EE] to-[#FFEDE3] p-4 font-[Tajawal]"
    >
      <span className="checkout-summary-shine" aria-hidden />

      <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#1E293B] to-[#0F172A] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.55)]">
        <TrophySvg />
        <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#FF6B00] text-white shadow-[0_4px_10px_-2px_rgba(255,107,0,0.55)]">
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden />
        </div>
      </div>

      <div className="relative min-w-0 flex-1 text-right">
        <div className="text-[10.5px] font-bold text-neutral-500">الباقة المختارة</div>
        <div className="mt-0.5 text-[17px] font-extrabold tracking-tight text-[#0F172A]">
          {tier.name}
        </div>
        <div className="mt-1 text-[11px] leading-snug text-neutral-500">
          {PRODUCT_SUMMARY.duration} · {PRODUCT_SUMMARY.type}
        </div>
      </div>

      <div className="relative shrink-0 border-r border-orange-200/80 pr-2 text-center">
        <div className="text-[10px] font-bold text-neutral-500">السعر الإجمالي</div>
        {originalAmount != null && resolvedAmount != null && resolvedAmount < originalAmount ? (
          <div className="text-[11px] font-bold text-neutral-400 line-through">
            ${originalAmount}
          </div>
        ) : null}
        <div className="mt-1 text-[26px] font-extrabold leading-none text-[#FF6B00]">
          {resolvedAmount != null ? `$${resolvedAmount}` : tier.totalPrice}
        </div>
        <div className="mt-1 text-[10px] font-bold text-neutral-500">
          USD · {months} أشهر · تجديد تلقائي
        </div>
        {disclosure ? (
          <div className="mt-1 max-w-[7.5rem] text-[9px] font-medium leading-snug text-neutral-400">
            يتجدد بـ {disclosure.renewalAmount} {disclosure.currency}
          </div>
        ) : null}
        {tier.totalPrice ? (
          <div className="mt-1 text-[9px] font-medium text-neutral-400">
            {formatIllustrativeDaily(
              Number(String(tier.totalPrice).replace(/[^0-9.]/g, "")),
              months === 6 ? 180 : 90,
            )}
          </div>
        ) : null}
        {promotionEndsAt ? <PromotionCountdown endsAt={promotionEndsAt} /> : null}
      </div>
    </motion.div>
  );
}
