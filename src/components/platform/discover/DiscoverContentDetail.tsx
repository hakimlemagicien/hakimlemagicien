import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Bookmark, Check, ChevronLeft, ChevronRight, Play, Users } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import coachPhoto from "@/assets/coach-photo.png";
import {
  contentGalleryImages,
  type DiscoverContentItem,
  formatDiscoverClock,
  getDiscoverAuthorLabel,
  getDiscoverCategory,
  getDiscoverLearnings,
  getDiscoverTypeLabel,
} from "@/lib/platform/discover-content";
import {
  getDiscoverContentProgress,
  joinDiscoverChallenge,
  setDiscoverContentProgress,
} from "@/lib/platform/discover-storage";
import { DiscoverHeader, discoverCardClass } from "./DiscoverShared";
import { cn } from "@/lib/utils";

function DiscoverBody({ body }: { body: string }) {
  const blocks = body.split("\n\n");
  return (
    <div className="space-y-4 text-sm leading-7 text-foreground/90">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-black text-foreground">
              {block.replace(/^##\s/, "")}
            </h2>
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="rounded-2xl border-r-4 border-primary/40 bg-primary-soft/40 px-4 py-3 text-xs font-bold text-muted-foreground"
            >
              {block.replace(/^>\s/, "")}
            </blockquote>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

function contentCtaLabel(type: DiscoverContentItem["type"], progress: number, locked: boolean) {
  if (locked) return "ترقية العضوية";
  if (type === "video") {
    if (progress >= 100) return "إعادة المشاهدة";
    return progress > 0 ? "متابعة المشاهدة" : "شاهد الآن";
  }
  if (progress >= 100) return "إعادة القراءة";
  return "متابعة القراءة";
}

export function DiscoverContentDetailView({
  content,
  related,
  saved,
  locked,
  joinedChallenge,
  onToggleSave,
  onUpgrade,
  preview = false,
}: {
  content: DiscoverContentItem;
  related: DiscoverContentItem[];
  saved: boolean;
  liked: boolean;
  joinedChallenge: boolean;
  locked: boolean;
  preview?: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onUpgrade: () => void;
}) {
  const category = getDiscoverCategory(content.categoryId)?.name;
  const topic = content.tags[0] || category;
  const duration = formatDiscoverClock(content.videoDurationSeconds);
  const learnings = getDiscoverLearnings(content);
  const authorName = getDiscoverAuthorLabel(content.authorName);
  const isCoach = content.authorName.includes("حكيم");
  const intro = content.shortDescription || content.body.split("\n\n")[0];
  const suggested = preview ? undefined : related[0];
  const bodyRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(() => (preview ? 0 : getDiscoverContentProgress(content.id)));
  const [expanded, setExpanded] = useState(() => preview || getDiscoverContentProgress(content.id) > 0);
  const readingLabel = content.readingTimeMinutes
    ? `${content.readingTimeMinutes} دقائق قراءة`
    : duration
      ? `${Math.max(1, Math.round((content.videoDurationSeconds ?? 60) / 60))} دقائق`
      : null;

  const extras = useMemo(
    () => ({
      recipe: content.type === "recipe" ? content.recipe : null,
      story: content.type === "success_story" ? content.successStory : null,
      challenge: content.type === "challenge" ? content.challenge : null,
    }),
    [content],
  );

  const gallery = useMemo(
    () =>
      contentGalleryImages({
        coverImage: content.coverImage,
        galleryImages: content.galleryImages,
      }),
    [content.coverImage, content.galleryImages],
  );
  const [heroIndex, setHeroIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setHeroIndex(0);
  }, [content.id]);

  const openContent = () => {
    if (preview) {
      setExpanded(true);
      return;
    }
    if (locked) {
      onUpgrade();
      return;
    }
    const next = setDiscoverContentProgress(content.id, Math.max(progress, 40));
    setProgress(next);
    setExpanded(true);
    window.requestAnimationFrame(() => {
      bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="discover-detail">
      <header className="discover-detail__head">
        {preview ? (
          <span className="discover-detail__head-btn" aria-hidden>
            <ChevronRight className="h-6 w-6" />
          </span>
        ) : (
          <Link to="/app/discover" aria-label="رجوع" className="discover-detail__head-btn">
            <ChevronRight className="h-6 w-6" />
          </Link>
        )}
        <h1>تفاصيل المحتوى</h1>
        <button
          type="button"
          aria-label={saved ? "إزالة من المحفوظات" : "حفظ"}
          aria-pressed={saved}
          onClick={preview ? undefined : onToggleSave}
          disabled={preview}
          className={cn("discover-detail__head-btn", saved && "is-saved")}
        >
          <Bookmark className={cn("h-5 w-5", saved && "fill-current")} strokeWidth={1.9} />
        </button>
      </header>

      <div
        className="discover-detail__hero"
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (gallery.length < 2 || touchStartX.current == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) < 40) return;
          setHeroIndex((current) => {
            if (delta < 0) return (current + 1) % gallery.length;
            return (current - 1 + gallery.length) % gallery.length;
          });
        }}
      >
        <span className="discover-hero__media">
          <OptimizedImage
            key={gallery[heroIndex] || content.coverImage}
            src={gallery[heroIndex] || content.coverImage}
            alt=""
            width={1080}
            height={1350}
            priority
          />
        </span>
        <span className="discover-hero__shade" aria-hidden />
        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              className="discover-detail__nav is-prev"
              aria-label="الصورة السابقة"
              onClick={() => setHeroIndex((current) => (current - 1 + gallery.length) % gallery.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="discover-detail__nav is-next"
              aria-label="الصورة التالية"
              onClick={() => setHeroIndex((current) => (current + 1) % gallery.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="discover-detail__dots" aria-hidden>
              {gallery.map((src, index) => (
                <span key={src} className={index === heroIndex ? "is-active" : undefined} />
              ))}
            </span>
          </>
        ) : null}
        {content.videoDurationSeconds || content.type === "video" ? (
          <button type="button" aria-label="تشغيل" className="discover-detail__play" onClick={openContent}>
            <Play className="h-4 w-4 fill-current" />
          </button>
        ) : null}
        {duration ? <span className="discover-detail__duration">{duration}</span> : null}
      </div>

      <div className="discover-detail__chips">
        <span className="discover-detail__chip is-type">{getDiscoverTypeLabel(content.type)}</span>
        {topic ? <span className="discover-detail__chip is-topic">{topic}</span> : null}
        {content.featured ? <span className="discover-detail__chip is-type">مميز</span> : null}
      </div>

      <h2 className="discover-detail__title">{content.title}</h2>

      <div className="discover-detail__author">
        <span className="discover-detail__avatar">
          {isCoach ? (
            <OptimizedImage src={coachPhoto} alt="" width={40} height={40} className="h-full w-full" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[11px] font-black text-muted-foreground">
              {authorName.slice(0, 1)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1">
            {authorName}
            {isCoach ? <BadgeCheck className="h-4 w-4 fill-[#f97316] text-white" /> : null}
          </p>
          {readingLabel ? <span>{readingLabel}</span> : null}
        </div>
      </div>

      <p className="discover-detail__intro">{intro}</p>

      {learnings.length ? (
        <section className="discover-detail__card">
          <h2>ما ستتعلمه</h2>
          {learnings.map((item) => (
            <div key={item} className="discover-detail__learn">
              <span className="discover-detail__check">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              {item}
            </div>
          ))}
        </section>
      ) : null}

      {preview ? null : (
        <section className="discover-detail__card">
          <div className="discover-detail__progress">
            <p>أكملت</p>
            <strong>{progress}%</strong>
          </div>
          <div className="discover-detail__bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>
      )}

      <button type="button" onClick={openContent} className="discover-detail__cta">
        {contentCtaLabel(content.type, progress, locked)}
      </button>

      {suggested ? (
        <Link
          to="/app/discover/$slug"
          params={{ slug: suggested.slug }}
          className="discover-detail__suggest"
        >
          <span className="discover-detail__suggest-thumb">
            <OptimizedImage src={suggested.coverImage} alt="" width={64} height={64} className="h-full w-full" />
          </span>
          <span className="min-w-0 flex-1">
            <p>محتوى مقترح</p>
            <strong className="line-clamp-1">{suggested.title}</strong>
          </span>
          <ChevronLeft className="h-5 w-5" strokeWidth={2.4} />
        </Link>
      ) : null}

      {expanded && !locked ? (
        <div ref={bodyRef} className="space-y-4 pt-2">
          <DiscoverBody body={content.body} />

          {extras.recipe ? (
            <div className={cn(discoverCardClass, "space-y-4 p-4")}>
              <p className="text-sm font-black">المكونات</p>
              <ul className="list-disc space-y-1 pr-5 text-sm">
                {extras.recipe.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="text-sm font-black">الخطوات</p>
              <ol className="list-decimal space-y-1 pr-5 text-sm">
                {extras.recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {extras.story?.beforeImage && extras.story.afterImage ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="overflow-hidden rounded-[20px]">
                <OptimizedImage src={extras.story.beforeImage} alt="قبل — بموافقة معتمدة" width={180} height={240} />
              </div>
              <div className="overflow-hidden rounded-[20px]">
                <OptimizedImage src={extras.story.afterImage} alt="بعد — بموافقة معتمدة" width={180} height={240} />
              </div>
            </div>
          ) : null}

          {extras.challenge ? (
            <div className={cn(discoverCardClass, "space-y-3 p-4")}>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground">
                <span>{extras.challenge.days} أيام</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {extras.challenge.participantCount} مشارك
                </span>
              </div>
              <button
                type="button"
                disabled={preview || joinedChallenge || extras.challenge.status !== "active"}
                onClick={() => {
                  if (preview) return;
                  joinDiscoverChallenge(content.id);
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground disabled:opacity-50"
              >
                {joinedChallenge ? "أنت منضم بالفعل" : "انضم إلى التحدي"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function DiscoverUnavailableState({ reason }: { reason: "missing" | "offline" }) {
  return (
    <div className="space-y-4 py-8">
      <DiscoverHeader title="المحتوى" backTo="/app/discover" />
      <div className={cn(discoverCardClass, "p-6 text-center")}>
        <p className="text-sm font-black text-foreground">
          {reason === "offline" ? "تحقق من الاتصال" : "المحتوى غير متاح"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {reason === "offline"
            ? "تعذر تحميل المحتوى — حاول مجدداً عند عودة الشبكة."
            : "ربما تم إلغاء نشره أو لم يعد متاحاً."}
        </p>
        <Link
          to="/app/discover"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground"
        >
          العودة إلى اكتشف
        </Link>
      </div>
    </div>
  );
}
