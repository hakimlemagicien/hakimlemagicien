import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { MembershipUpgradeSheet } from "@/components/platform/upgrade/MembershipUpgradeSheet";
import { UpgradeProvider } from "@/components/platform/upgrade/UpgradeContext";
import { CalorieCalculatorSheet } from "@/components/platform/tools/CalorieCalculatorSheet";
import { ToolsProvider, useTools } from "@/components/platform/tools/ToolsContext";
import { WaterBottomSheet } from "@/components/platform/water/WaterBottomSheet";
import { WaterGoalFeedback, WaterUndoToast } from "@/components/platform/water/WaterFeedback";
import { WaterProvider } from "@/components/platform/water/WaterContext";
import { cn } from "@/lib/utils";
import { PlatformFrame } from "./PlatformLayout";
import { PlatformMobileNav, PlatformSidebar } from "./PlatformNav";
import { PlatformPageTransition } from "./PlatformPageTransition";

type PlatformShellProps = {
  children: ReactNode;
};

function CalorieCalculatorHost() {
  const { calorieSheetOpen, closeCalorieCalculator } = useTools();
  return <CalorieCalculatorSheet open={calorieSheetOpen} onClose={closeCalorieCalculator} />;
}

export function PlatformShell({ children }: PlatformShellProps) {
  const location = useLocation();
  const isStudioRoute = location.pathname.startsWith("/app/studio");
  const isCoachChatRoute = location.pathname.startsWith("/app/support/chat");

  return (
    <UpgradeProvider>
      <ToolsProvider>
        <WaterProvider>
          <div dir="rtl" lang="ar" className="platform-shell min-h-dvh font-sans text-foreground">
            <div
              className={cn(
                "platform-shell__layout mx-auto flex min-h-dvh w-full min-w-0 max-w-full overflow-x-clip",
                isStudioRoute ? "max-w-none" : "max-w-7xl",
              )}
            >
              <PlatformSidebar />
              <div
                className={cn(
                  "flex min-h-0 min-w-0 flex-1 flex-col",
                  isCoachChatRoute && "h-full overflow-hidden",
                )}
              >
                <main
                  className={cn(
                    "platform-main",
                    isStudioRoute && "platform-main--studio",
                    isCoachChatRoute && "platform-main--coach-chat",
                  )}
                >
                  {isStudioRoute || isCoachChatRoute ? (
                    children
                  ) : (
                    <PlatformFrame>
                      <PlatformPageTransition>{children}</PlatformPageTransition>
                    </PlatformFrame>
                  )}
                </main>
              </div>
            </div>
            {isCoachChatRoute ? null : <PlatformMobileNav />}
            <MembershipUpgradeSheet />
            <CalorieCalculatorHost />
            <WaterBottomSheet />
            <WaterUndoToast />
            <WaterGoalFeedback />
          </div>
        </WaterProvider>
      </ToolsProvider>
    </UpgradeProvider>
  );
}
