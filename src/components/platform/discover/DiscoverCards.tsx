import { Link } from "@tanstack/react-router";
import { Bookmark, Clock, Eye, Play, Users } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  type DiscoverContentItem,
  formatDiscoverDuration,
  formatDiscoverRelativeDate,
  getDiscoverCategory,
  getDiscoverTypeLabel,
} from "@/lib/platform/discover-content";
import {
  DiscoverPremiumBadge,
  DiscoverTypeBadge,
  discoverCardClass,
} from "./DiscoverShared";
import { cn } from "@/lib/utils";

type CardProps = {
  item: DiscoverContentItem;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  compact?: boolean;
};

function DiscoverCardShell({
  item,
  children,
  className,
}: {
  item: DiscoverContentItem;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to="/app/discover/$slug"
      params={{ slug: item.slug }}
      className={cn(
        discoverCardClass,
        "platform-touch block overflow-hidden transition-transform active:scale-[0.985]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function DiscoverVideoCard({ item, compact }: CardProps) {
  const category = getDiscoverCategory(item.categoryId)?.name;
  const duration = formatDiscoverDuration(item.videoDurationSeconds);

  if (compact) {
    return (
      <DiscoverCardShell item={item} className="w-44 shrink-0">
        <div className="relative h-28 w-full">
          <OptimizedImage src={item.coverImage} alt="" width={176} height={112} />
          <span className="absolute inset-0 grid place-items-center bg-black/20">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-primary">
              <Play className="h-4 w-4 fill-current" />
            </span>
          </span>
          {duration ? (
            <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {duration}
            </span>
          ) : null}
          {item.accessLevel === "premium" ? (
            <span className="absolute right-2 top-2">
              <DiscoverPremiumBadge />
            </span>
          ) : null}
        </div>
        <div className="space-y-1 p-3">
          <p className="line-clamp-2 text-xs font-black leading-snug text-foreground">{item.title}</p>
          {category ? <p className="text-[10px] font-bold text-muted-foreground">{category}</p> : null}
        </div>
      </DiscoverCardShell>
    );
  }

  return (
    <DiscoverCardShell item={item}>
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl">
          <OptimizedImage src={item.coverImage} alt="" width={112} height={80} />
          <span className="absolute inset-0 grid place-items-center bg-black/15">
            <Play className="h-5 w-5 fill-white text-white" />
          </span>
          {duration ? (
            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] font-bold text-white">
              {duration}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <DiscoverTypeBadge label={getDiscoverTypeLabel(item.type)} />
            {item.accessLevel === "premium" ? <DiscoverPremiumBadge /> : null}
          </div>
          <p className="line-clamp-2 text-sm font-black text-foreground">{item.title}</p>
          <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
            {category ? <span>{category}</span> : null}
            <span>{formatDiscoverRelativeDate(item.publishDate)}</span>
            {item.viewCount ? (
              <span className="inline-flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {item.viewCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </DiscoverCardShell>
  );
}

export function DiscoverArticleCard({ item, saved, onToggleSave }: CardProps) {
  const category = getDiscoverCategory(item.categoryId)?.name;

  return (
    <DiscoverCardShell item={item}>
      <div className="flex gap-3 p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
          <OptimizedImage src={item.coverImage} alt="" width={80} height={80} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <DiscoverTypeBadge label={getDiscoverTypeLabel(item.type)} />
              {item.accessLevel === "premium" ? <DiscoverPremiumBadge /> : null}
            </div>
            {onToggleSave ? (
              <button
                type="button"
                aria-label={saved ? "إزالة من المحفوظات" : "حفظ"}
                aria-pressed={saved}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleSave(item.id);
                }}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground"
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-primary text-primary")} />
              </button>
            ) : null}
          </div>
          <p className="line-clamp-2 text-sm font-black text-foreground">{item.title}</p>
          <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
            {category ? <span>{category}</span> : null}
            {item.readingTimeMinutes ? (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {item.readingTimeMinutes} د
              </span>
            ) : null}
            <span>{formatDiscoverRelativeDate(item.publishDate)}</span>
          </div>
        </div>
      </div>
    </DiscoverCardShell>
  );
}

export function DiscoverRecipeCard({ item }: CardProps) {
  const category = getDiscoverCategory(item.categoryId)?.name;
  const recipe = item.recipe;

  return (
    <DiscoverCardShell item={item} className="w-48 shrink-0">
      <div className="relative h-32 w-full">
        <OptimizedImage src={item.coverImage} alt="" width={192} height={128} />
        {item.accessLevel === "premium" ? (
          <span className="absolute right-2 top-2">
            <DiscoverPremiumBadge />
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-xs font-black text-foreground">{item.title}</p>
        {recipe ? (
          <p className="text-[10px] font-bold text-muted-foreground">
            {recipe.calories} سعرة · {recipe.protein}غ بروتين · {recipe.prepMinutes} د
          </p>
        ) : null}
        {category ? <p className="text-[10px] font-bold text-primary">{category}</p> : null}
      </div>
    </DiscoverCardShell>
  );
}

export function DiscoverStoryCard({ item }: CardProps) {
  const story = item.successStory;
  if (!story?.consentApproved) return null;

  return (
    <DiscoverCardShell item={item} className="w-56 shrink-0">
      <div className="relative h-36 w-full">
        <OptimizedImage src={item.coverImage} alt="" width={224} height={144} />
      </div>
      <div className="space-y-1 p-3">
        <p className="text-xs font-black text-foreground">{story.displayName}</p>
        <p className="line-clamp-2 text-[11px] font-medium text-muted-foreground">{story.resultSummary}</p>
        <p className="text-[10px] font-bold text-muted-foreground">
          {story.journeyDays} يوم{story.country ? ` · ${story.country}` : ""}
        </p>
      </div>
    </DiscoverCardShell>
  );
}

export function DiscoverChallengeCard({ item, joined }: CardProps & { joined?: boolean }) {
  const challenge = item.challenge;
  if (!challenge) return null;

  const statusLabel =
    challenge.status === "active"
      ? "نشط"
      : challenge.status === "upcoming"
        ? "قريباً"
        : challenge.status === "completed"
          ? "مكتمل"
          : "مغلق";

  return (
    <DiscoverCardShell item={item}>
      <div className="flex gap-3 p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
          <OptimizedImage src={item.coverImage} alt="" width={80} height={80} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <DiscoverTypeBadge label={statusLabel} />
            {joined ? (
              <span className="text-[10px] font-black text-success">منضم</span>
            ) : null}
          </div>
          <p className="line-clamp-2 text-sm font-black text-foreground">{item.title}</p>
          <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-muted-foreground">
            <span>{challenge.days} أيام</span>
            <span className="inline-flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {challenge.participantCount}
            </span>
          </div>
        </div>
      </div>
    </DiscoverCardShell>
  );
}

export function DiscoverRecentCard({ item }: CardProps) {
  const category = getDiscoverCategory(item.categoryId)?.name;

  return (
    <DiscoverCardShell item={item}>
      <div className="flex items-center gap-3 p-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
          <OptimizedImage src={item.coverImage} alt="" width={56} height={56} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <DiscoverTypeBadge label={getDiscoverTypeLabel(item.type)} />
            {item.accessLevel === "premium" ? <DiscoverPremiumBadge /> : null}
          </div>
          <p className="line-clamp-1 text-sm font-black text-foreground">{item.title}</p>
          <p className="text-[10px] font-bold text-muted-foreground">
            {category ? `${category} · ` : ""}
            {formatDiscoverRelativeDate(item.publishDate)}
          </p>
        </div>
      </div>
    </DiscoverCardShell>
  );
}

export function DiscoverContentListItem({ item }: { item: DiscoverContentItem }) {
  switch (item.type) {
    case "video":
      return <DiscoverVideoCard item={item} />;
    case "recipe":
      return <DiscoverRecipeCard item={item} />;
    case "success_story":
      return <DiscoverStoryCard item={item} />;
    case "challenge":
      return <DiscoverChallengeCard item={item} />;
    default:
      return <DiscoverArticleCard item={item} />;
  }
}
