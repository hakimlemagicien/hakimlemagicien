import { type ReactNode, type SyntheticEvent, useCallback } from "react";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { ACTIVATE_PROGRAM_CTA } from "@/lib/pricing-presentation";
import { cn } from "@/lib/utils";

const PREVIEW_DEFAULT_REASON =
  "هذه معاينة لشكل الشاشة فقط. فعّل برنامجك الآن للاستفادة من التمرين والتغذية بالكامل.";

/**
 * Shows paid screens as visual preview for free users.
 * Any interaction (except elements marked data-preview-safe) opens upgrade.
 */
export function PreviewGate({
  active,
  reason = PREVIEW_DEFAULT_REASON,
  children,
  className,
}: {
  active: boolean;
  reason?: string;
  children: ReactNode;
  className?: string;
}) {
  const { openUpgrade } = useUpgradeFlow();

  const intercept = useCallback(
    (event: SyntheticEvent) => {
      if (!active) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-preview-safe]")) return;
      event.preventDefault();
      event.stopPropagation();
      openUpgrade(reason);
    },
    [active, openUpgrade, reason],
  );

  if (!active) return <>{children}</>;

  return (
    <div
      className={cn("relative flex min-h-0 flex-1 flex-col", className)}
      onClickCapture={intercept}
    >
      {children}

      <div className="pointer-events-none sticky bottom-3 z-20 mx-auto mt-auto w-full max-w-[340px] px-1 pb-[env(safe-area-inset-bottom,0px)]">
        <button
          type="button"
          data-preview-safe
          onClick={() => openUpgrade(reason)}
          className="pointer-events-auto flex w-full items-center justify-center rounded-2xl cta-gradient px-4 py-3.5 font-[Tajawal] text-[14px] font-extrabold text-white shadow-cta"
        >
          {ACTIVATE_PROGRAM_CTA}
        </button>
      </div>
    </div>
  );
}
