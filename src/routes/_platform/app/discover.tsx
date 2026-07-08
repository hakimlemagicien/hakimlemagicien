import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageHeader, PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { PlaceholderState } from "@/components/platform/shared/PlaceholderState";

export const Route = createFileRoute("/_platform/app/discover")({
  head: () => ({ meta: [{ title: "Discover | Hakim Platform" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  return (
    <PlatformStack>
      <PlatformPageHeader
        title="اكتشف"
        subtitle="مقالات، فيديوهات، وصفات، وتحديات — مجاناً للجميع."
      />
      <PlaceholderState
        title="المكتبة قادمة قريباً"
        description="Phase 4: المحتوى المجاني سيظهر هنا."
      />
    </PlatformStack>
  );
}
