import type { CSSProperties, ReactNode } from "react";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared VIP glass treatment — luxurious dark glass, gold accents. */
export function VipGlassShell({
  children,
  className,
  compact,
  style,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  style?: CSSProperties;
}) {
  return (
    <article
      className={cn(
        "vip-glass-card relative overflow-hidden text-center",
        compact ? "rounded-[20px] p-4" : "rounded-[22px] p-5 sm:p-6",
        className,
      )}
      style={style}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,120,0.22)_0%,transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.18)_0%,transparent_45%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#D4AF78]/20 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-[#7C3AED]/25 blur-3xl"
      />
      <span
        aria-hidden
        className="vip-glass-shine pointer-events-none absolute inset-y-[-20%] left-0 w-[45%] bg-gradient-to-r from-transparent via-white/18 to-transparent"
      />

      <span className="absolute left-0 top-3 z-10 inline-flex items-center gap-1 rounded-l-none rounded-r-md bg-gradient-to-l from-[#D4AF78] to-[#B8924A] px-2.5 py-1 font-[Tajawal] text-[10px] font-bold text-[#1A140C] shadow-[0_8px_18px_-10px_rgba(212,175,120,0.7)] sm:text-[11px]">
        <Gem className="h-3 w-3" strokeWidth={2.4} />
        VIP
      </span>

      <div className="relative z-10">{children}</div>
    </article>
  );
}

export function VipFeatureCheck({
  label,
  compact,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          "mt-0.5 grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#F0D9A8] to-[#D4AF78] text-[#1A140C] shadow-[0_4px_10px_-4px_rgba(212,175,120,0.7)]",
          compact ? "h-4 w-4" : "h-5 w-5",
        )}
      >
        <svg
          viewBox="0 0 16 16"
          className={compact ? "h-2.5 w-2.5" : "h-3 w-3"}
          fill="none"
          aria-hidden
        >
          <path
            d="M3.5 8.2 6.2 11l6.3-6.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "font-[Tajawal] font-medium leading-relaxed text-white/85",
          compact ? "text-[12px]" : "text-[13px]",
        )}
      >
        {label}
      </span>
    </li>
  );
}
