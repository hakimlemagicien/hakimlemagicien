import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { BillingSettings } from "@/components/platform/billing/BillingSettings";

export const Route = createFileRoute("/_platform/app/billing")({
  head: () => ({ meta: [{ title: "الاشتراك والفوترة | MAAKFIT" }] }),
  component: BillingPage,
});

function BillingPage() {
  return (
    <PlatformStack className="space-y-4 pb-6">
      <BillingSettings />
    </PlatformStack>
  );
}
