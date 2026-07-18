import { createFileRoute } from "@tanstack/react-router";
import { PlatformStack } from "@/components/platform/layout/PlatformLayout";
import { DiscoverContentListItem } from "@/components/platform/discover/DiscoverCards";
import { DiscoverEmptyState, DiscoverHeader } from "@/components/platform/discover/DiscoverShared";
import { getDiscoverCategoryBySlug, searchDiscoverContent } from "@/lib/platform/discover-content";

export const Route = createFileRoute("/_platform/app/discover/category/$slug")({
  head: ({ params }) => ({
    meta: [{ title: `${getDiscoverCategoryBySlug(params.slug)?.name ?? "تصنيف"} | اكتشف` }],
  }),
  component: DiscoverCategoryPage,
});

function DiscoverCategoryPage() {
  const { slug } = Route.useParams();
  const category = getDiscoverCategoryBySlug(slug);
  const items = category ? searchDiscoverContent("", { categoryId: category.id }) : [];

  if (!category) {
    return (
      <PlatformStack>
        <DiscoverEmptyState title="التصنيف غير متاح" />
      </PlatformStack>
    );
  }

  return (
    <PlatformStack>
      <div className="space-y-4 pb-6">
        <DiscoverHeader title={category.name} backTo="/app/discover" />
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <DiscoverContentListItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <DiscoverEmptyState title="لا يوجد محتوى في هذا التصنيف حالياً." />
        )}
      </div>
    </PlatformStack>
  );
}
