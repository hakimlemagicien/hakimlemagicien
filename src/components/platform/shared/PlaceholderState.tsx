import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { ACTIVATE_PROGRAM_CTA } from "@/lib/pricing-presentation";

type PlaceholderStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PlaceholderState({ title, description, action }: PlaceholderStateProps) {
  return (
    <div className="platform-card flex min-h-[40vh] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-locked">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-black text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function UpgradeCta({
  className = "",
  reason = "فعّل برنامجك الشخصي للوصول إلى هذه الميزة وجميع أدوات المنصة.",
}: {
  className?: string;
  reason?: string;
}) {
  const { openUpgrade } = useUpgradeFlow();

  return (
    <button
      type="button"
      onClick={() => openUpgrade(reason)}
      className={`inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-cta transition hover:opacity-90 ${className}`}
    >
      {ACTIVATE_PROGRAM_CTA}
    </button>
  );
}
