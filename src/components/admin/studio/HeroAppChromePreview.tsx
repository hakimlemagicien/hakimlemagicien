import type { ReactNode } from "react";
import type { HeroState } from "@/lib/platform/home-hub";
import { HomeHeroCard } from "@/components/platform/home/HomeSections";
import { cn } from "@/lib/utils";

export const HERO_APP_PREVIEW_WIDTH = 390;
export const HERO_APP_PREVIEW_HEIGHT = 844;

type HeroAppChromePreviewProps = {
  children: ReactNode;
  className?: string;
  variant?: "full" | "hero-only";
};

export function HeroAppChromePreview({
  children,
  className,
  variant = "full",
}: HeroAppChromePreviewProps) {
  return (
    <div
      className={cn(
        "hero-review-app-chrome",
        variant === "hero-only" && "hero-review-app-chrome--hero-only",
        className,
      )}
      dir="rtl"
      lang="ar"
    >
      <div className="platform-shell hero-review-app-chrome__shell font-sans text-foreground">
        <main className="platform-main hero-review-app-chrome__main">
          <div className="platform-frame">
            <div className="platform-stack">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function HeroAppFaithfulPreview({
  hero,
  variant = "full",
  className,
}: {
  hero: HeroState;
  variant?: "full" | "hero-only";
  className?: string;
}) {
  return (
    <HeroAppChromePreview variant={variant} className={className}>
      <HomeHeroCard hero={hero} />
    </HeroAppChromePreview>
  );
}
