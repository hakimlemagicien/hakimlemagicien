import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SecurityBannerProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function SecurityBanner({
  title = "100% دفع آمن",
  description = "معاملاتك مشفرة ومحمية عبر Paddle بمعايير مصرفية.",
  className,
}: SecurityBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: 0.08 }}
      role="note"
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-[#D8F3E1]/80 bg-[#F4FFF7]/90 px-2.5 py-2 font-[Tajawal]",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#16A34A] ring-1 ring-inset ring-[#BBF7D0]">
        <ShieldCheck className="h-4 w-4" strokeWidth={2.4} aria-hidden />
      </div>

      <p className="min-w-0 flex-1 text-start text-[11px] leading-[1.45] text-[#4B5563]">
        <span className="font-bold text-[#14532D]">{title}</span>
        <span className="mx-1 text-[#C4C4C4]" aria-hidden>
          ·
        </span>
        <span>{description}</span>
      </p>
    </motion.div>
  );
}
