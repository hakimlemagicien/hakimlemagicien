import { createFileRoute } from "@tanstack/react-router";
import { AchievementsExperience } from "@/components/platform/achievements/AchievementsExperience";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";

export const Route = createFileRoute("/_platform/app/achievements")({
  head: () => ({ meta: [{ title: "الإنجازات | Hakim Platform" }] }),
  component: AchievementsPage,
});

function AchievementsPage() {
  return (
    <PlatformStack>
      <AchievementsExperience />
    </PlatformStack>
  );
}
