import { Link } from "@tanstack/react-router";
import { Bookmark, Lightbulb, Share2 } from "lucide-react";
import {
  type DiscoverCategory,
  type DiscoverContentItem,
  type DiscoverFeed,
  getDiscoverCategory,
} from "@/lib/platform/discover-content";
import { isChallengeJoined, joinDiscoverChallenge } from "@/lib/platform/discover-storage";
import {
  DiscoverArticleCard,
  DiscoverChallengeCard,
  DiscoverRecipeCard,
  DiscoverRecentCard,
  DiscoverStoryCard,
  DiscoverVideoCard,
} from "./DiscoverCards";
import { DiscoverFeaturedCarousel } from "./DiscoverFeaturedCarousel";
import {
  DiscoverCategoryIcon,
  DiscoverMotionSection,
  DiscoverSectionHead,
  discoverCardClass,
} from "./DiscoverShared";
import { cn } from "@/lib/utils";

function HorizontalRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div
      className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function DiscoverCategoriesSection({ categories }: { categories: DiscoverCategory[] }) {
  if (!categories.length) return null;

  return (
    <DiscoverMotionSection delay={0.06}>
      <DiscoverSectionHead title="الأقسام" actionLabel="عرض الكل" actionTo="/app/discover/search" />
      <HorizontalRow label="تصنيفات المحتوى">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to="/app/discover/category/$slug"
            params={{ slug: cat.slug }}
            className="platform-touch flex w-20 shrink-0 flex-col items-center gap-2"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
              <DiscoverCategoryIcon icon={cat.icon} className="h-6 w-6" />
            </span>
            <span className="text-center text-[11px] font-black leading-tight text-foreground">
              {cat.name}
            </span>
          </Link>
        ))}
      </HorizontalRow>
    </DiscoverMotionSection>
  );
}

export function DiscoverDailyTipSection({
  tip,
  saved,
  onToggleSave,
  onShare,
}: {
  tip: DiscoverContentItem;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  onShare?: (item: DiscoverContentItem) => void;
}) {
  const category = getDiscoverCategory(tip.categoryId)?.name;

  return (
    <DiscoverMotionSection delay={0.08}>
      <DiscoverSectionHead title="نصيحة اليوم" />
      <div className={cn(discoverCardClass, "bg-[#FFFBEB] p-4")}>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FEF3C7] text-amber-600">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            {category ? (
              <p className="text-[10px] font-black text-amber-700">{category}</p>
            ) : null}
            <p className="text-sm font-black leading-relaxed text-foreground">{tip.shortDescription}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={saved ? "إزالة من المحفوظات" : "حفظ النصيحة"}
                aria-pressed={saved}
                onClick={() => onToggleSave?.(tip.id)}
                className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground"
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-primary text-primary")} />
              </button>
              <button
                type="button"
                aria-label="مشاركة النصيحة"
                onClick={() => onShare?.(tip)}
                className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DiscoverMotionSection>
  );
}

export function DiscoverVideosSection({ items }: { items: DiscoverContentItem[] }) {
  if (!items.length) return null;
  return (
    <DiscoverMotionSection delay={0.1}>
      <DiscoverSectionHead title="مكتبة الفيديو" actionLabel="عرض الكل" actionTo="/app/discover/search" />
      <HorizontalRow label="فيديوهات">
        {items.map((item) => (
          <DiscoverVideoCard key={item.id} item={item} compact />
        ))}
      </HorizontalRow>
    </DiscoverMotionSection>
  );
}

export function DiscoverArticlesSection({
  items,
  savedIds,
  onToggleSave,
}: {
  items: DiscoverContentItem[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <DiscoverMotionSection delay={0.12}>
      <DiscoverSectionHead title="المقالات" actionLabel="عرض الكل" actionTo="/app/discover/search" />
      <div className="space-y-3">
        {items.map((item) => (
          <DiscoverArticleCard
            key={item.id}
            item={item}
            saved={savedIds.includes(item.id)}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>
    </DiscoverMotionSection>
  );
}

export function DiscoverStoriesSection({ items }: { items: DiscoverContentItem[] }) {
  if (!items.length) return null;
  return (
    <DiscoverMotionSection delay={0.14}>
      <DiscoverSectionHead title="قصص النجاح" actionLabel="عرض الكل" actionTo="/app/discover/search" />
      <HorizontalRow label="قصص النجاح">
        {items.map((item) => (
          <DiscoverStoryCard key={item.id} item={item} />
        ))}
      </HorizontalRow>
      <p className="mt-2 px-0.5 text-[10px] font-medium text-muted-foreground">
        النتائج تختلف بين الأشخاص — كل قصة معتمدة بموافقة صريحة.
      </p>
    </DiscoverMotionSection>
  );
}

export function DiscoverChallengesSection({ items }: { items: DiscoverContentItem[] }) {
  if (!items.length) return null;
  return (
    <DiscoverMotionSection delay={0.16}>
      <DiscoverSectionHead title="التحديات" actionLabel="عرض الكل" actionTo="/app/discover/search" />
      <div className="space-y-3">
        {items.map((item) => (
          <DiscoverChallengeCard key={item.id} item={item} joined={isChallengeJoined(item.id)} />
        ))}
      </div>
    </DiscoverMotionSection>
  );
}

export function DiscoverRecipesSection({ items }: { items: DiscoverContentItem[] }) {
  if (!items.length) return null;
  return (
    <DiscoverMotionSection delay={0.18}>
      <DiscoverSectionHead title="الوصفات الصحية" actionLabel="عرض الكل" actionTo="/app/discover/search" />
      <HorizontalRow label="وصفات">
        {items.map((item) => (
          <DiscoverRecipeCard key={item.id} item={item} />
        ))}
      </HorizontalRow>
      <p className="mt-2 px-0.5 text-[10px] font-medium text-muted-foreground">
        وصفات تعليمية عامة — لا تستبدل وجبات برنامجك الشخصي.
      </p>
    </DiscoverMotionSection>
  );
}

export function DiscoverRecentSection({ items }: { items: DiscoverContentItem[] }) {
  if (!items.length) return null;
  return (
    <DiscoverMotionSection delay={0.2}>
      <DiscoverSectionHead title="أحدث المحتوى" />
      <div className="space-y-3">
        {items.slice(0, 6).map((item) => (
          <DiscoverRecentCard key={item.id} item={item} />
        ))}
      </div>
    </DiscoverMotionSection>
  );
}

export function DiscoverFeedSections({
  feed,
  categories,
  savedIds,
  onToggleSave,
  onShareTip,
}: {
  feed: DiscoverFeed;
  categories: DiscoverCategory[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onShareTip?: (item: DiscoverContentItem) => void;
}) {
  return (
    <div className="space-y-6 pb-4">
      {feed.featured.length ? (
        <DiscoverMotionSection>
          <DiscoverSectionHead title="المحتوى المميز" />
          <DiscoverFeaturedCarousel items={feed.featured} />
        </DiscoverMotionSection>
      ) : null}

      <DiscoverCategoriesSection categories={categories} />

      {feed.dailyTip ? (
        <DiscoverDailyTipSection
          tip={feed.dailyTip}
          saved={savedIds.includes(feed.dailyTip.id)}
          onToggleSave={onToggleSave}
          onShare={onShareTip}
        />
      ) : null}

      <DiscoverVideosSection items={feed.videos} />
      <DiscoverArticlesSection items={feed.articles} savedIds={savedIds} onToggleSave={onToggleSave} />
      <DiscoverStoriesSection items={feed.successStories} />
      <DiscoverChallengesSection items={feed.challenges} />
      <DiscoverRecipesSection items={feed.recipes} />
      <DiscoverRecentSection items={feed.recent} />
    </div>
  );
}

export { joinDiscoverChallenge };
