/** Bottom tone of hero → problem gradient (matches Problem section top) */
export const PROBLEM_SECTION_TOP = "#F3EFE8";

/**
 * Soft gradient + curve from white Hero stats into the Problem section.
 */
export function HeroProblemTransition() {
  return (
    <div
      className="relative z-10 w-full overflow-hidden bg-gradient-to-b from-background via-[#FAF8F5] to-[#F3EFE8] lg:from-[#FAF8F5]"
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className="block h-9 w-full sm:h-11 lg:h-12"
        role="presentation"
      >
        <defs>
          <linearGradient id="hero-problem-wave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAF8F5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F3EFE8" />
          </linearGradient>
        </defs>
        <path
          fill="url(#hero-problem-wave)"
          d="M0,26 C220,58 440,10 660,32 C880,48 1100,14 1320,36 C1380,42 1420,30 1440,26 L1440,72 L0,72 Z"
        />
      </svg>
    </div>
  );
}
