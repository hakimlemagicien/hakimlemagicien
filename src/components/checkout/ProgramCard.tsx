import { Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ProgramGridItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  highlight?: boolean;
  badge?: string;
};

type ProgramCardProps = {
  items: ProgramGridItem[];
  taxNotice: string;
  className?: string;
};

export function ProgramCard({ items, taxNotice, className }: ProgramCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-[24px] bg-white p-6 checkout-shadow border border-[#ECECEC]",
        className,
      )}
    >
      <div className="grid grid-cols-3 divide-x divide-[#ECECEC] divide-x-reverse">
        {items.slice(0, 3).map((item) => (
          <ProgramCell key={item.title} {...item} />
        ))}
      </div>
      <div className="my-0 h-px w-full bg-[#ECECEC]" />
      <div className="grid grid-cols-3 divide-x divide-[#ECECEC] divide-x-reverse">
        {items.slice(3, 6).map((item) => (
          <ProgramCell key={item.title} {...item} />
        ))}
      </div>

      <div className="mt-5 flex h-11 items-center gap-2.5 rounded-[14px] bg-[#FFF7ED] px-3">
        <Info className="h-5 w-5 shrink-0 text-[#FF5A1F]" aria-hidden />
        <p className="text-[13px] leading-[1.5] text-[#92400E]">{taxNotice}</p>
      </div>
    </motion.div>
  );
}

function ProgramCell({ icon: Icon, title, description, highlight, badge }: ProgramGridItem) {
  return (
    <div className="flex flex-col items-center px-2 py-3 text-center">
      <div
        className={cn(
          "mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl",
          highlight ? "bg-[#0F172A] text-white" : "bg-[#FFF3ED] text-[#FF5A1F]",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden />
      </div>
      {badge ? (
        <span className="mb-1 rounded-full bg-[#FF5A1F] px-2 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      <p className="text-[17px] font-bold leading-[1.5] text-[#0F172A]">{title}</p>
      <p className="mt-1 text-[13px] leading-[1.5] text-[#6B7280]">{description}</p>
    </div>
  );
}
