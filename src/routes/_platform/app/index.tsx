import { createFileRoute } from "@tanstack/react-router";
import {
  DailyTasksSection,
  FeaturedContentSection,
  HomeHeader,
  QuickGlanceSection,
  SummaryCard,
  UpgradeBanner,
} from "@/components/platform/home/HomeSections";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useMembership } from "@/hooks/useMembership";
import { useStreak } from "@/hooks/useStreak";

export const Route = createFileRoute("/_platform/app/")({
  head: () => ({ meta: [{ title: "الرئيسية | Hakim Platform" }] }),
  component: PlatformHomePage,
});

function PlatformHomePage() {
  const { displayName, isPremium, loading } = useMembership();
  const { count, points } = useStreak();

  if (loading) return null;

  return (
    <PlatformStack>
      <HomeHeader name={displayName} isPremium={isPremium} />
      <SummaryCard streak={count} points={points} />
      <DailyTasksSection locked={!isPremium} />
      <QuickGlanceSection />
      <FeaturedContentSection />
      {!isPremium ? <UpgradeBanner /> : null}
    </PlatformStack>
  );
}
