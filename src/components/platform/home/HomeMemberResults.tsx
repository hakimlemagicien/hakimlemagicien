import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronsLeft, Sparkles, Star, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { MEMBER_RESULT_STORIES, type MemberResultStory } from "@/lib/platform/member-results-stories";
import { cn } from "@/lib/utils";

function BeforeAfterCompare({ before, after }: { before: string; after: string }) {
  const compareRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [compareWidth, setCompareWidth] = useState(0);

  useEffect(() => {
    const node = compareRef.current;
    if (!node) return;

    const updateWidth = () => setCompareWidth(node.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={compareRef}
      className="platform-home-results__compare"
      style={
        compareWidth > 0
          ? ({ "--compare-w": `${compareWidth}px` } as CSSProperties)
          : undefined
      }
    >
      <OptimizedImage
        src={before}
        alt=""
        className="platform-home-results__photo platform-home-results__photo--before"
        objectFit="cover"
        width={622}
        height={1253}
        sizes="(max-width: 430px) 100vw, 390px"
      />
      <div className="platform-home-results__after-clip" style={{ width: `${position}%` }}>
        <OptimizedImage
          src={after}
          alt=""
          className="platform-home-results__photo platform-home-results__photo--after"
          objectFit="cover"
          width={622}
          height={1253}
          sizes="(max-width: 430px) 100vw, 390px"
        />
      </div>
      <span className="platform-home-results__tag platform-home-results__tag--before">قبل</span>
      <span className="platform-home-results__tag platform-home-results__tag--after">بعد</span>
      <span
        className="platform-home-results__handle"
        style={{ insetInlineStart: `calc(${position}% - 18px)` }}
        aria-hidden
      >
        <ChevronsLeft className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <input
        type="range"
        min={10}
        max={90}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        className="platform-home-results__slider"
        aria-label="اسحب لمقارنة صورة قبل وبعد"
      />
    </div>
  );
}

function ResultStoryCard({ story }: { story: MemberResultStory }) {
  return (
    <article className="platform-home-results__card">
      <BeforeAfterCompare before={story.before} after={story.after} />

      <div className="platform-home-results__stats">
        <div className="platform-home-results__stat platform-home-results__stat--accent">
          <span className="platform-home-results__stat-value">{story.weightLost}</span>
          <span className="platform-home-results__stat-label">{story.weightLabel}</span>
        </div>
        <div className="platform-home-results__stat platform-home-results__stat--rating">
          <div className="platform-home-results__stars" aria-label={`تقييم ${story.rating} من 5`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
            ))}
          </div>
          <span className="platform-home-results__rating-text">
            {story.rating} ({story.reviewCount} تقييم)
          </span>
        </div>
        <div className="platform-home-results__stat platform-home-results__stat--accent">
          <span className="platform-home-results__stat-value">{story.days}</span>
          <span className="platform-home-results__stat-label">{story.daysLabel}</span>
        </div>
      </div>

      <blockquote className="platform-home-results__quote">
        <span className="platform-home-results__quote-mark" aria-hidden>
          "
        </span>
        <p>{story.quote}</p>
      </blockquote>

      <footer className="platform-home-results__member">
        <p className="platform-home-results__member-name">{story.name}</p>
        <p className="platform-home-results__member-country">
          <span aria-hidden>{story.countryFlag}</span>
          {story.country}
        </p>
      </footer>
    </article>
  );
}

export function HomeMemberResults() {
  const { openUpgrade } = useUpgradeFlow();
  const [activeIndex, setActiveIndex] = useState(0);
  const story = MEMBER_RESULT_STORIES[activeIndex] ?? MEMBER_RESULT_STORIES[0];

  const goTo = useCallback((index: number) => {
    setActiveIndex(index % MEMBER_RESULT_STORIES.length);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % MEMBER_RESULT_STORIES.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      className="platform-home-results platform-home-enter platform-home-enter--d5"
      aria-labelledby="home-results-title"
    >
      <header className="platform-home-results__head">
        <span className="platform-home-results__badge">
          <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
          مميز للمشتركين فقط
        </span>
        <span className="platform-home-results__head-icon" aria-hidden>
          <Users className="h-5 w-5" strokeWidth={2.1} />
        </span>

        <h2 id="home-results-title" className="platform-home-results__title">
          شاهد <span className="platform-home-results__accent">نتائج</span> أعضائنا
        </h2>
        <p className="platform-home-results__lead">
          آلاف الأعضاء حققوا أهدافهم مع برامج حكيم المخصصة
        </p>
      </header>

      <ResultStoryCard key={story.id} story={story} />

      <div className="platform-home-results__dots" role="tablist" aria-label="قصص النجاح">
        {MEMBER_RESULT_STORIES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`قصة ${item.name}`}
            className={cn(index === activeIndex && "is-active")}
            onClick={() => goTo(index)}
          />
        ))}
      </div>

      <Link to="/" hash="stories" className="platform-home-results__all platform-touch">
        <span className="platform-home-results__all-avatars" aria-hidden>
          {MEMBER_RESULT_STORIES.slice(0, 3).map((item) => (
            <span key={item.id} className="platform-home-results__all-dot" />
          ))}
        </span>
        <span className="platform-home-results__all-text">عرض جميع قصص النجاح</span>
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
      </Link>

      <button
        type="button"
        className="platform-home-unlock platform-home-enter platform-home-enter--d6 platform-touch"
        onClick={() =>
          openUpgrade("افتح كل مميزات برنامجك: تدريب، تغذية، تتبع، ودعم الكوتش.")
        }
      >
        <span className="platform-home-unlock__glow" aria-hidden />
        <span className="platform-home-unlock__icon" aria-hidden>
          <Sparkles className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <span className="platform-home-unlock__copy">
          <span className="platform-home-unlock__title">افتح كل مميزات برنامجك للبدء</span>
          <span className="platform-home-unlock__hint">ترقية سريعة · ابدأ اليوم</span>
        </span>
        <ChevronLeft className="platform-home-unlock__chevron h-4 w-4 shrink-0" aria-hidden />
      </button>
    </section>
  );
}
