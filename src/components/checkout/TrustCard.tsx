import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TrustFeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "orange" | "green" | "blue";
};

const toneStyles = {
  orange: {
    wrap: "bg-[#FFF3ED] text-[#FF5A1F]",
    ring: "ring-[#FFE4D4]",
  },
  green: {
    wrap: "bg-[#ECFDF3] text-[#16A34A]",
    ring: "ring-[#D1FAE5]",
  },
  blue: {
    wrap: "bg-[#EFF6FF] text-[#2563EB]",
    ring: "ring-[#DBEAFE]",
  },
} as const;

type TrustCardProps = TrustFeatureItem & {
  className?: string;
};

export function TrustCard({
  icon: Icon,
  title,
  description,
  tone = "orange",
  className,
}: TrustCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={cn("flex flex-col items-center px-2 py-1 text-center font-[Tajawal]", className)}>
      <div
        className={cn(
          "mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
          styles.wrap,
          styles.ring,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="text-[13px] font-bold leading-tight text-[#0F172A]">{title}</p>
      <p className="mt-1 text-[11px] leading-[1.45] text-[#6B7280]">{description}</p>
    </div>
  );
}

type TrustFeaturesProps = {
  items: TrustFeatureItem[];
  className?: string;
};

export function TrustFeatures({ items, className }: TrustFeaturesProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      aria-label="مزايا الثقة والأمان"
      className={cn(
        "mt-8 overflow-hidden rounded-2xl border border-[#ECECEC] bg-white checkout-shadow",
        className,
      )}
    >
      <div className="grid grid-cols-3 divide-x divide-[#ECECEC] divide-x-reverse py-4">
        {items.map((item) => (
          <TrustCard key={item.title} {...item} />
        ))}
      </div>
    </motion.section>
  );
}
