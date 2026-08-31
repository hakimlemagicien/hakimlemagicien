import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { AppUpgradePage } from "@/components/platform/upgrade/AppUpgradePage";
import type { CheckoutReturnSurface } from "@/lib/payments/types";

type UpgradeSearch = {
  plan?: "essential" | "premium";
  term?: 3 | 6;
  checkout?: "return";
  surface?: CheckoutReturnSurface;
};

function parseSurface(value: unknown): CheckoutReturnSurface | undefined {
  if (
    value === "TRAINING" ||
    value === "NUTRITION" ||
    value === "DIRECT_UPGRADE" ||
    value === "BILLING"
  ) {
    return value;
  }
  return undefined;
}

export const Route = createFileRoute("/_platform/app/upgrade")({
  head: () => ({ meta: [{ title: "ترقية الاشتراك | MAAKFIT" }] }),
  validateSearch: (search: Record<string, unknown>): UpgradeSearch => ({
    plan: search.plan === "essential" || search.plan === "premium" ? search.plan : undefined,
    term:
      search.term === 3 || search.term === "3"
        ? 3
        : search.term === 6 || search.term === "6"
          ? 6
          : undefined,
    checkout: search.checkout === "return" ? "return" : undefined,
    surface: parseSurface(search.surface),
  }),
  component: UpgradeRoutePage,
});

function UpgradeRoutePage() {
  const search = Route.useSearch();
  return (
    <PlatformStack className="space-y-4 pb-6">
      <AppUpgradePage
        initialPlan={search.plan}
        initialTerm={search.term}
        checkoutReturn={search.checkout === "return"}
        surface={search.surface ?? "DIRECT_UPGRADE"}
      />
    </PlatformStack>
  );
}
