import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureCheckTone = "neutral" | "green" | "orange";

export function featureCheckToneForPlan(planId: string): FeatureCheckTone {
  if (planId === "premium") return "orange";
  if (planId === "free") return "neutral";
  return "green";
}

export function FeatureCheck({
  label,
  tone = "green",
  compact,
}: {
  label: string;
  tone?: FeatureCheckTone;
  compact?: boolean;
}) {
  const iconClass =
    tone === "orange"
      ? "bg-[#F97316]"
      : tone === "neutral"
        ? "border border-[#D6D3CD] bg-[#FAF8F5]"
        : "bg-[#5C9E54]";

  const checkClass = tone === "neutral" ? "text-[#64748B]" : "text-white";

  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          "mt-0.5 grid shrink-0 place-items-center rounded-full",
          compact ? "h-4 w-4" : "h-5 w-5",
          iconClass,
        )}
      >
        <Check
          className={cn(compact ? "h-2.5 w-2.5" : "h-3 w-3", checkClass)}
          strokeWidth={3}
        />
      </span>
      <span
        className={cn(
          "font-[Tajawal] font-medium leading-relaxed text-[#334155]",
          compact ? "text-[12px]" : "text-[13px]",
        )}
      >
        {label}
      </span>
    </li>
  );
}
