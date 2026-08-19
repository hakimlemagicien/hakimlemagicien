import { useMemo, useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Dumbbell, FileText, Footprints, MoreVertical, Play, Star, UtensilsCrossed } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { DiscoverContentListItem } from "@/components/platform/discover/DiscoverCards";
import { DiscoverSectionHead } from "@/components/platform/discover/DiscoverShared";
import {
  DISCOVER_HOME_CHIPS,
  DISCOVER_HOME_IDS,
  type DiscoverContentItem,
  type DiscoverFeed,
  type DiscoverHomeChip,
  formatDiscoverMinutes,
  getDiscoverContentById,
  getDiscoverKindLabel,
} from "@/lib/platform/discover-content";
import { cn } from "@/lib/utils";

function itemMinutes(item: DiscoverContentItem) {
  return (
    item.readingTimeMinutes ??
    (item.videoDurationSeconds ? Math.max(1, Math.round(item.videoDurationSeconds / 60)) : null) ??
    item.recipe?.prepMinutes ??
    0
  );
}

function KindIcon({ type }: { type: DiscoverContentItem["type"] }) {
  if (type === "recipe") return <UtensilsCrossed className="h-3.5 w-3.5" strokeWidth={1.9} />;
  if (type === "video") return <Dumbbell className="h-3.5 w-3.5" strokeWidth={1.9} />;
  return <FileText className="h-3.5 w-3.5" strokeWidth={1.9} />;
}

function filterFeedItems(feed: DiscoverFeed, chip: DiscoverHomeChip): DiscoverContentItem[] {
  if (chip === "video") return feed.videos;
  if (chip === "article") return feed.articles;
  if (chip === "nutrition") return [...feed.recipes, ...feed.articles.filter((item) => item.categoryId === "nutrition")];
  if (chip === "exercises") {
    return [...feed.videos, ...feed.articles].filter((item) =>
      ["exercises", "muscle", "cardio", "fat-loss"].includes(item.categoryId),
    );
  }
  return [];
}

function DiscoverHeroCard({ item }: { item: DiscoverContentItem }) {
  const minutes = itemMinutes(item);
  return (
    <Link to="/app/discover/$slug" params={{ slug: item.slug }} className="discover-hero">
      <span className="discover-hero__media">
        <OptimizedImage src={item.coverImage} alt="" width={390} height={196} priority />
      </span>
      <span className="discover-hero__shade" aria-hidden />
      <span className="discover-hero__badge">
        <Star className="h-3 w-3 fill-current" />
        {item.badge || "مختار لك"}
      </span>
      <div className="discover-hero__copy">
        <h3>{item.title}</h3>
        <p>
          {item.shortDescription}
          {minutes ? ` • ${minutes} دقائق` : null}
        </p>
      </div>
      <span className="discover-hero__play" aria-hidden>
        <Play className="h-4 w-4 fill-current" />
      </span>
    </Link>
  );
}

function DiscoverGoalCard({ item }: { item: DiscoverContentItem }) {
  const duration = formatDiscoverMinutes(item);
  return (
    <Link to="/app/discover/$slug" params={{ slug: item.slug }} className="discover-goal-card">
      <div className="discover-goal-card__media">
        <OptimizedImage src={item.coverImage} alt="" width={160} height={118} />
        {duration ? <span className="discover-goal-card__time">{duration}</span> : null}
      </div>
      <p className="discover-goal-card__kind">
        <KindIcon type={item.type} />
        {getDiscoverKindLabel(item.type)}
      </p>
      <h3>{item.title}</h3>
      <p className="discover-goal-card__desc">{item.shortDescription}</p>
    </Link>
  );
}

function DiscoverChallengeStrip({ item }: { item: DiscoverContentItem }) {
  const total = item.challenge?.days ?? 7;
  const current = Math.min(item.challenge?.progressDays ?? 0, total);
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Link to="/app/discover/$slug" params={{ slug: item.slug }} className="discover-challenge">
      <span className="discover-challenge__icon" aria-hidden>
        <Footprints className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="discover-challenge__body">
        <h3>{item.title}</h3>
        <p>{item.shortDescription}</p>
        <span className="discover-challenge__bar" aria-hidden>
          <i style={{ width: `${percent}%` }} />
        </span>
      </div>
      <p className="discover-challenge__stat">
        <strong>{current}</strong>/{total} أيام
      </p>
    </Link>
  );
}

function DiscoverCoachRow({
  item,
  onMore,
}: {
  item: DiscoverContentItem;
  onMore: (event: MouseEvent<HTMLButtonElement>, item: DiscoverContentItem) => void;
}) {
  const minutes = itemMinutes(item);
  return (
    <Link to="/app/discover/$slug" params={{ slug: item.slug }} className="discover-coach">
      <span className="discover-coach__thumb">
        <OptimizedImage src={item.coverImage} alt="" width={84} height={84} />
        <span className="discover-coach__play" aria-hidden>
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </span>
      <div className="discover-coach__copy">
        <h3>{item.title}</h3>
        <p>{item.shortDescription}</p>
        {minutes ? (
          <span className="discover-coach__meta">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            {minutes} دقائق
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="discover-coach__more"
        aria-label="المزيد"
        onClick={(event) => onMore(event, item)}
      >
        <MoreVertical className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </Link>
  );
}

export function DiscoverHomeFeed({
  feed,
  onShare,
}: {
  feed: DiscoverFeed;
  onShare?: (item: DiscoverContentItem) => void;
}) {
  const [chip, setChip] = useState<DiscoverHomeChip>("all");
  const hero = getDiscoverContentById(DISCOVER_HOME_IDS.hero) ?? feed.featured[0] ?? null;
  const goals = [
    getDiscoverContentById(DISCOVER_HOME_IDS.sleep),
    getDiscoverContentById(DISCOVER_HOME_IDS.back),
    getDiscoverContentById(DISCOVER_HOME_IDS.salad),
  ].filter((item): item is DiscoverContentItem => Boolean(item));
  const challenge = getDiscoverContentById(DISCOVER_HOME_IDS.challenge) ?? feed.challenges[0] ?? null;
  const coach = getDiscoverContentById(DISCOVER_HOME_IDS.coach) ?? feed.videos[0] ?? null;
  const filtered = useMemo(() => filterFeedItems(feed, chip), [chip, feed]);

  return (
    <div className="discover-home">
      <div className="discover-chips" role="tablist" aria-label="تصفية المحتوى">
        {DISCOVER_HOME_CHIPS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={chip === item.id}
            className={cn("discover-chip", chip === item.id && "is-active")}
            onClick={() => setChip(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {chip !== "all" ? (
        <div className="space-y-3">
          {filtered.length ? (
            filtered.map((item) => <DiscoverContentListItem key={item.id} item={item} />)
          ) : (
            <p className="px-0.5 text-sm font-bold text-muted-foreground">لا يوجد محتوى في هذا القسم بعد.</p>
          )}
        </div>
      ) : (
        <>
          {hero ? <DiscoverHeroCard item={hero} /> : null}

          {goals.length ? (
            <section>
              <DiscoverSectionHead title="يناسب هدفك" actionLabel="عرض الكل" actionTo="/app/discover/search" />
              <div className="discover-goal-row" aria-label="محتوى يناسب هدفك">
                {goals.map((item) => (
                  <DiscoverGoalCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}

          {challenge ? (
            <section>
              <DiscoverSectionHead
                title="تحديات هذا الأسبوع"
                actionLabel="عرض الكل"
                actionTo="/app/discover/search"
              />
              <DiscoverChallengeStrip item={challenge} />
            </section>
          ) : null}

          {coach ? (
            <section>
              <DiscoverSectionHead title="من الكوتش حكيم" actionLabel="عرض الكل" actionTo="/app/discover/search" />
              <DiscoverCoachRow
                item={coach}
                onMore={(event, item) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onShare?.(item);
                }}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
