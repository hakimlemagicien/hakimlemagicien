import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { MembershipUpgradeSheet } from "@/components/platform/upgrade/MembershipUpgradeSheet";
import { UpgradeProvider } from "@/components/platform/upgrade/UpgradeContext";
import { cn } from "@/lib/utils";
import { PlatformFrame } from "./PlatformLayout";
import { PlatformMobileNav, PlatformSidebar } from "./PlatformNav";

type PlatformShellProps = {
  children: ReactNode;
};

export function PlatformShell({ children }: PlatformShellProps) {
  const location = useLocation();
  const isStudioRoute = location.pathname.startsWith("/app/studio");

  return (
    <UpgradeProvider>
      <div dir="rtl" lang="ar" className="platform-shell min-h-dvh bg-beige font-sans text-foreground">
        <div
          className={cn(
            "mx-auto flex min-h-dvh w-full",
            isStudioRoute ? "max-w-none" : "max-w-7xl",
          )}
        >
          <PlatformSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <main className={cn("platform-main", isStudioRoute && "platform-main--studio")}>
              {isStudioRoute ? children : <PlatformFrame>{children}</PlatformFrame>}
            </main>
          </div>
        </div>
        <PlatformMobileNav />
        <MembershipUpgradeSheet />
      </div>
    </UpgradeProvider>
  );
}
