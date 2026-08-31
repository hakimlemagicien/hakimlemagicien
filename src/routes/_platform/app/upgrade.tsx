import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { AppUpgradePage } from "@/components/platform/upgrade/AppUpgradePage";

type UpgradeSearch = {
  plan?: "essential" | "premium";
  term?: 3 | 6;
  checkout?: "return";
};

export const Route = createFileRoute("/_platform/app/upgrade")({
  head: () => ({ meta: [{ title: "ترقية الاشتراك | MAAKFIT" }] }),
  validateSearch: (search: Record<string, unknown>): UpgradeSearch => ({
    plan: search.plan === "essential" || search.plan === "premium" ? search.plan : undefined,
    term: search.term === 3 || search.term === "3" ? 3 : search.term === 6 || search.term === "6" ? 6 : undefined,
    checkout: search.checkout === "return" ? "return" : undefined,
  }),
  component: UpgradeRoutePage,
});

function UpgradeRoutePage() {
  const search = Route.useSearch();
  return (
    <PlatformStack className="space-y-4 pb-6">
      <AppUpgradePage initialPlan={search.plan} initialTerm={search.term} checkoutReturn={search.checkout === "return"} />
    </PlatformStack>
  );
}
