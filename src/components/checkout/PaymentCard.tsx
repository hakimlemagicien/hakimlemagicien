import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CheckoutPayMethod = "card" | "apple_pay" | "google_pay";

type PaymentCardProps = {
  id: CheckoutPayMethod;
  name: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: CheckoutPayMethod) => void;
  logo: React.ReactNode;
  index?: number;
};

export function PaymentCard({
  id,
  name,
  description,
  selected,
  disabled,
  onSelect,
  logo,
  index = 0,
}: PaymentCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${name}${selected ? " — محدد" : ""}`}
      onClick={() => onSelect(id)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-start transition-colors duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-2 border-[#FF5A1F] bg-[#FFF8F4]"
          : "border border-[#E8E8E8] bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
          selected ? "border-[#FF5A1F]" : "border-[#D1D5DB]",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-200",
            selected ? "scale-100 bg-[#FF5A1F]" : "scale-0 bg-transparent",
          )}
        />
      </span>

      <div className="min-w-0 flex-1 pe-1">
        <p className="text-[15px] font-bold leading-tight text-[#0F172A]">{name}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-[1.45] text-[#6B7280]">{description}</p>
      </div>

      <div className="flex w-[76px] shrink-0 items-center justify-end">{logo}</div>
    </motion.button>
  );
}
