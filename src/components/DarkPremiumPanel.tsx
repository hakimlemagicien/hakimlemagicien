import { forwardRef, type CSSProperties, type ReactNode } from "react";

export const DarkPremiumPanel = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    active?: boolean;
    className?: string;
    innerClassName?: string;
    transitionDelay?: string;
  }
>(function DarkPremiumPanel({
  children,
  active = true,
  className = "",
  innerClassName = "",
  transitionDelay = "400ms",
}, ref) {
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-4 bottom-0 rounded-2xl bg-[#1A1816]/20 shadow-[inset_0_3px_10px_rgba(15,23,42,0.12)] lg:inset-x-4 lg:rounded-3xl"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-2xl bg-[#FF6B00]/20 blur-2xl animate-warning-card-outer-glow lg:-inset-3 lg:rounded-3xl"
      />

      <div
        className={[
          "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#2A2521] via-[#1F1C18] to-[#2E2824] p-4 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_22px_48px_-14px_rgba(255,107,0,0.28),0_16px_40px_-18px_rgba(15,23,42,0.45)] ring-1 ring-white/[0.05] transition-[transform,opacity,box-shadow] duration-700 ease-out sm:p-5 lg:rounded-3xl lg:p-6",
          innerClassName,
        ].join(" ")}
        style={
          {
            opacity: active ? 1 : 0,
            transform: active ? "translateY(-8px) scale(1)" : "translateY(18px) scale(0.97)",
            boxShadow: active
              ? "0 1px 0 rgba(255,255,255,0.08) inset, 0 28px 56px -16px rgba(255,107,0,0.32), 0 20px 48px -18px rgba(15,23,42,0.55), 0 0 0 1px rgba(255,107,0,0.14)"
              : undefined,
            transitionDelay,
          } as CSSProperties
        }
      >
        <span
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl lg:rounded-3xl"
          aria-hidden
        >
          <span
            className="absolute inset-y-[-30%] left-0 h-[160%] w-[50%] animate-warning-card-shimmer bg-gradient-to-r from-transparent via-white/14 to-transparent"
          />
        </span>
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl animate-warning-card-inner-glow lg:rounded-3xl"
          aria-hidden
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px animate-warning-card-border-pulse bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FF6B00]/[0.12] blur-3xl animate-warning-card-outer-glow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-4 left-1/4 h-20 w-20 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,107,0,0.5) 1px, transparent 1.5px)",
            backgroundSize: "10px 10px",
          }}
        />

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
});
