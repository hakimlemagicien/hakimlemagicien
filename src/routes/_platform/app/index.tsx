import { createFileRoute } from "@tanstack/react-router";
import {
  DailyMotivationCard,
  DailyTasksSection,
  FeaturedContentSection,
  HomeHeader,
  MessageOfDayCard,
  QuickGlanceSection,
  UpgradeBanner,
} from "@/components/platform/home/HomeSections";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { useMembership } from "@/hooks/useMembership";
import { useStreak } from "@/hooks/useStreak";
import {
  buildDailyTasks,
  buildFeaturedForGoal,
  buildHealthScore,
  buildMessageOfDay,
  buildQuickGlance,
  isDailyTaskLocked,
  resolveNextMissionFromTasks,
  resolveUserGoal,
  shouldShowActivateCta,
} from "@/lib/platform/home-hub";

export const Route = createFileRoute("/_platform/app/")({
  head: () => ({ meta: [{ title: "الرئيسية | Hakim Platform" }] }),
  component: PlatformHomePage,
});

function PlatformHomePage() {
  const { displayName, tier, is_paid, features } = useMembership();
  const { count, hakimPoints } = useStreak();

  const TIER_LABELS = {
    visitor: "Visitor",
    free: "Free",
    essential: "Essential",
    premium: "Premium",
    vip: "VIP",
    admin: "Admin",
  } as const;

  const goal = resolveUserGoal("تنشيف");
  const tasks = buildDailyTasks({ features });
  const message = buildMessageOfDay({
    displayName,
    streak: count,
    goal,
  });
  const glance = buildQuickGlance({ streak: count });
  const healthScore = buildHealthScore(tasks);
  const featured = buildFeaturedForGoal(goal);
  const nextMission = resolveNextMissionFromTasks(
    tasks.filter((task) => !isDailyTaskLocked(task, features)),
  );

  return (
    <PlatformStack>
      <HomeHeader
        name={displayName}
        tierLabel={TIER_LABELS[tier as keyof typeof TIER_LABELS] ?? "Free"}
        showTierBadge={is_paid}
      />
      <DailyMotivationCard
        streak={count}
        hakimPoints={hakimPoints}
        nextMission={nextMission}
      />
      <MessageOfDayCard message={message} />
      <DailyTasksSection
        tasks={tasks}
        isTaskLocked={(task) => isDailyTaskLocked(task, features)}
      />
      {shouldShowActivateCta(tier, is_paid) ? <UpgradeBanner /> : null}
      <QuickGlanceSection items={glance} healthScore={healthScore} />
      <FeaturedContentSection items={featured} />
    </PlatformStack>
  );
}
