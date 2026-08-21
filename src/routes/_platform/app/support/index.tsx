import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { SupportHub } from "@/components/platform/support/SupportHub";

export const Route = createFileRoute("/_platform/app/support/")({
  head: () => ({ meta: [{ title: "الدعم | MAAKFIT" }] }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <PlatformStack>
      <SupportHub />
    </PlatformStack>
  );
}
