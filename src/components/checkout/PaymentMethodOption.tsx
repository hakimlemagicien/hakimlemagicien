import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CheckoutMethodId = "bank" | "card" | "paypal" | "crypto";

type PaymentMethodOptionProps = {
  id: CheckoutMethodId;
  name: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  badge?: { label: string; tone: "available" | "soon" };
  icon: React.ReactNode;
  index?: number;
  onSelect: (id: CheckoutMethodId) => void;
};

export function PaymentMethodOption({
  id,
  name,
  description,
  selected,
  disabled,
  badge,
  icon,
  index = 0,
  onSelect,
}: PaymentMethodOptionProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      disabled={disabled}
      aria-pressed={selected}
      aria-disabled={disabled}
      onClick={() => !disabled && onSelect(id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-start transition-all",
        disabled && "cursor-not-allowed opacity-55",
        selected && !disabled
          ? "border-2 border-[#FF5A1F] bg-[#FFF8F4] shadow-[0_4px_14px_-8px_rgba(255,90,31,0.35)]"
          : "border border-[#E8E8E8] bg-white",
      )}
    >
      <ChevronLeft className="h-4 w-4 shrink-0 text-[#C4C4C4]" aria-hidden />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badge ? (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-extrabold",
                badge.tone === "available"
                  ? "bg-[#DCFCE7] text-[#16A34A]"
                  : "bg-[#FFF1E6] text-[#FF6B00]",
              )}
            >
              {badge.label}
            </span>
          ) : null}
          <span className="text-[15px] font-bold text-[#0F172A]">{name}</span>
        </div>
        <p className="mt-1 text-right text-[11.5px] leading-[1.5] text-[#6B7280]">{description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {!disabled ? (
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border-2",
              selected ? "border-[#FF5A1F]" : "border-[#D1D5DB]",
            )}
            aria-hidden
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                selected ? "scale-100 bg-[#FF5A1F]" : "scale-0",
              )}
            />
          </span>
        ) : null}
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#F3F4F6]">{icon}</div>
      </div>
    </motion.button>
  );
}
