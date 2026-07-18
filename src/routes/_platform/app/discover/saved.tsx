import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { DiscoverContentListItem } from "@/components/platform/discover/DiscoverCards";
import { DiscoverEmptyState, DiscoverHeader } from "@/components/platform/discover/DiscoverShared";
import { useDiscoverSavedItems } from "@/hooks/useDiscoverExperience";

export const Route = createFileRoute("/_platform/app/discover/saved")({
  head: () => ({ meta: [{ title: "المحفوظات | اكتشف" }] }),
  component: DiscoverSavedPage,
});

function DiscoverSavedPage() {
  const items = useDiscoverSavedItems();

  return (
    <PlatformStack>
      <div className="space-y-4 pb-6">
        <DiscoverHeader title="المحفوظات" backTo="/app/discover" />
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <DiscoverContentListItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <DiscoverEmptyState
            title="لا يوجد محتوى محفوظ"
            description="احفظ المقالات والفيديوهات والوصفات للعودة إليها لاحقاً."
          />
        )}
      </div>
    </PlatformStack>
  );
}
