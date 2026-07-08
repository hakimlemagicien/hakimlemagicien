import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ACTIVATE_PROGRAM_CTA,
  formatIllustrativeDaily,
  formatOfficialTotal,
  formatSavings,
  type PaidTierCatalog,
  type SubscriptionTermMonths,
  type SubscriptionTermOffer,
} from "@/lib/pricing-presentation";
import { cn } from "@/lib/utils";

function BaseTermPrice({
  offer,
  compact,
  vip,
}: {
  offer: SubscriptionTermOffer;
  compact?: boolean;
  vip?: boolean;
}) {
  const daily = formatIllustrativeDaily(offer.totalPrice, offer.duration.days);

  return (
    <div className={cn("text-center", compact ? "mt-4" : "mt-5")}>
      <div
        className={cn(
          "font-[Tajawal] font-black leading-none tracking-tight",
          compact ? "text-[26px]" : "text-[34px]",
          vip ? "bg-gradient-to-l from-[#F0D9A8] via-[#FFF3D6] to-[#D4AF78] bg-clip-text text-transparent" : "text-[#0F172A]",
        )}
      >
        {formatOfficialTotal(offer.totalPrice)}
      </div>
      <p
        className={cn(
          "mt-1.5 font-[Tajawal] text-[13px] font-bold",
          vip ? "text-[#F0D9A8]/90" : "text-[#0F172A]/80",
        )}
      >
        {offer.duration.label}
      </p>
      {daily ? (
        <p
          className={cn(
            "mt-1 font-[Tajawal] text-[12px] font-medium",
            vip ? "text-white/55" : "text-[#64748B]",
          )}
        >
          {daily}
        </p>
      ) : null}
    </div>
  );
}

function SixMonthUpsell({
  offer,
  selected,
  onToggle,
  compact,
  vip,
}: {
  offer: SubscriptionTermOffer;
  selected: boolean;
  onToggle: () => void;
  compact?: boolean;
  vip?: boolean;
}) {
  const daily = formatIllustrativeDaily(offer.totalPrice, offer.duration.days);
  const savings = offer.savingsUsd
    ? formatSavings(offer.savingsUsd, offer.savingsNote)
    : null;

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border text-right transition active:scale-[0.99]",
        compact ? "mt-3 px-3 py-2.5" : "mt-4 px-3.5 py-3",
        vip
          ? selected
            ? "border-[#D4AF78]/55 bg-gradient-to-l from-[#D4AF78]/20 via-white/10 to-[#7C3AED]/15 shadow-[0_10px_24px_-16px_rgba(212,175,120,0.45)]"
            : "border-white/15 bg-white/5 hover:border-[#D4AF78]/35"
          : selected
            ? "border-[#5C9E54] bg-gradient-to-l from-[#F3FAF2] via-white to-[#F3FAF2] shadow-[0_10px_24px_-16px_rgba(92,158,84,0.45)]"
            : "border-[#E8E4DE] bg-[#FAF8F5]/90 hover:border-[#5C9E54]/40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
            vip
              ? selected
                ? "border-[#D4AF78] bg-gradient-to-br from-[#F0D9A8] to-[#D4AF78] text-[#1A140C]"
                : "border-white/25 bg-white/10 text-transparent"
              : selected
                ? "border-[#5C9E54] bg-[#5C9E54] text-white"
                : "border-[#D6D3CD] bg-white text-transparent",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-[Tajawal] text-[10px] font-bold",
                vip
                  ? "bg-gradient-to-l from-[#D4AF78] to-[#B8924A] text-[#1A140C]"
                  : "bg-[#5C9E54] text-white",
              )}
            >
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
              أفضل قيمة
            </span>
            <span
              className={cn(
                "font-[Tajawal] text-[12px] font-extrabold",
                vip ? "text-white/90" : "text-[#0F172A]",
              )}
            >
              ترقية إلى {offer.duration.label}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-[Tajawal] text-[18px] font-black leading-none",
                vip
                  ? "bg-gradient-to-l from-[#F0D9A8] via-[#FFF3D6] to-[#D4AF78] bg-clip-text text-transparent"
                  : "text-[#0F172A]",
              )}
            >
              {formatOfficialTotal(offer.totalPrice)}
            </span>
            {daily ? (
              <span
                className={cn(
                  "font-[Tajawal] text-[11px] font-medium",
                  vip ? "text-white/50" : "text-[#64748B]",
                )}
              >
                {daily}
              </span>
            ) : null}
          </div>

          {savings ? (
            <p
              className={cn(
                "mt-1 font-[Tajawal] text-[11px] font-extrabold leading-snug",
                vip ? "text-[#F0D9A8]" : "text-[#5C9E54]",
              )}
            >
              {savings}
            </p>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

type PlanActivateBlockProps = {
  plan: PaidTierCatalog;
  popularStyle?: boolean;
  compact?: boolean;
  onActivated?: () => void;
};

/**
 * Plan card pricing UX:
 * 1) Always show official 3-month price (never hide price at start)
 * 2) After «فعّل برنامجك الآن», reveal a compact 6-month discount upsell
 * 3) Base card shape stays intact — 6 months is an optional upgrade, not a layout rewrite
 */
export function PlanActivateBlock({
  plan,
  popularStyle = Boolean(plan.popular),
  compact = false,
  onActivated,
}: PlanActivateBlockProps) {
  const term3 = useMemo(
    () => plan.terms.find((t) => t.months === 3) ?? plan.terms[0],
    [plan.terms],
  );
  const term6 = useMemo(
    () => plan.terms.find((t) => t.months === 6),
    [plan.terms],
  );

  const [upsellOpen, setUpsellOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<SubscriptionTermMonths>(3);

  const selectedOffer =
    selectedMonths === 6 && term6 ? term6 : term3;

  const isVip = plan.id === "vip";

  const ctaClass = cn(
    "flex w-full items-center justify-center rounded-xl px-4 font-[Tajawal] font-extrabold transition",
    compact ? "py-2.5 text-[13px]" : "py-3 text-[14px]",
    isVip
      ? "border border-[#D4AF78]/45 bg-gradient-to-l from-[#D4AF78] via-[#F0D9A8] to-[#D4AF78] text-[#1A140C] shadow-[0_12px_28px_-12px_rgba(212,175,120,0.65)] hover:brightness-105"
      : popularStyle
        ? "bg-[#5C9E54] text-white shadow-[0_10px_24px_-12px_rgba(92,158,84,0.7)] hover:bg-[#528F4B]"
        : "border border-[#D6D3CD] bg-white text-[#0F172A] hover:bg-[#FAF8F5]",
  );

  return (
    <div>
      <BaseTermPrice offer={term3} compact={compact} vip={isVip} />

      <AnimatePresence initial={false}>
        {upsellOpen && term6 ? (
          <SixMonthUpsell
            key="six-month-upsell"
            offer={term6}
            selected={selectedMonths === 6}
            compact={compact}
            vip={isVip}
            onToggle={() =>
              setSelectedMonths((prev) => (prev === 6 ? 3 : 6))
            }
          />
        ) : null}
      </AnimatePresence>

      {!upsellOpen ? (
        <button
          type="button"
          onClick={() => {
            setUpsellOpen(true);
            setSelectedMonths(3);
          }}
          className={cn(ctaClass, compact ? "mt-4" : "mt-5")}
        >
          {ACTIVATE_PROGRAM_CTA}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={cn(compact ? "mt-3" : "mt-4")}
        >
          <Link to="/quiz" onClick={onActivated} className={ctaClass}>
            {ACTIVATE_PROGRAM_CTA}
          </Link>
          <p
            className={cn(
              "mt-1.5 text-center font-[Tajawal] text-[10px] font-medium",
              isVip ? "text-white/50" : "text-[#94A3B8]",
            )}
          >
            {formatOfficialTotal(selectedOffer.totalPrice)} · {selectedOffer.duration.label}
            {selectedMonths === 3 ? " — السعر الأساسي" : " — عرض أفضل قيمة"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
