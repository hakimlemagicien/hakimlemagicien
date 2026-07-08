import type { ReactNode } from "react";
import { MembershipUpgradeSheet } from "@/components/platform/upgrade/MembershipUpgradeSheet";
import { UpgradeProvider } from "@/components/platform/upgrade/UpgradeContext";
import { PlatformFrame } from "./PlatformLayout";
import { PlatformMobileNav, PlatformSidebar } from "./PlatformNav";

type PlatformShellProps = {
  children: ReactNode;
};

export function PlatformShell({ children }: PlatformShellProps) {
  return (
    <UpgradeProvider>
      <div dir="rtl" lang="ar" className="platform-shell min-h-dvh bg-beige font-sans text-foreground">
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
          <PlatformSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <main className="platform-main">
              <PlatformFrame>{children}</PlatformFrame>
            </main>
          </div>
        </div>
        <PlatformMobileNav />
        <MembershipUpgradeSheet />
      </div>
    </UpgradeProvider>
  );
}
