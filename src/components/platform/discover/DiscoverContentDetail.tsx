import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  Clock,
  Heart,
  Play,
  Share2,
  Users,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  type DiscoverContentItem,
  formatDiscoverDuration,
  formatDiscoverRelativeDate,
  getDiscoverCategory,
  getDiscoverTypeLabel,
} from "@/lib/platform/discover-content";
import { joinDiscoverChallenge } from "@/lib/platform/discover-storage";
import { DiscoverContentListItem } from "./DiscoverCards";
import {
  DiscoverHeader,
  DiscoverPremiumBadge,
  DiscoverTypeBadge,
  discoverCardClass,
} from "./DiscoverShared";
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

export function DiscoverContentDetailView({
  content,
  related,
  saved,
  liked,
  joinedChallenge,
  locked,
  onToggleSave,
  onToggleLike,
  onShare,
  onUpgrade,
}: {
  content: DiscoverContentItem;
  related: DiscoverContentItem[];
  saved: boolean;
  liked: boolean;
  joinedChallenge: boolean;
  locked: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onUpgrade: () => void;
}) {
  const category = getDiscoverCategory(content.categoryId)?.name;
  const duration = formatDiscoverDuration(content.videoDurationSeconds);

  const handleJoinChallenge = () => {
    if (locked || joinedChallenge) return;
    joinDiscoverChallenge(content.id);
  };

  return (
    <div className="space-y-5 pb-8">
      <DiscoverHeader title="تفاصيل المحتوى" backTo="/app/discover" />

      <article className="space-y-4">
        <div className="relative overflow-hidden rounded-[24px]">
          <OptimizedImage
            src={content.coverImage}
            alt=""
            width={390}
            height={240}
            priority
          />
          {content.type === "video" && !locked ? (
            <span className="absolute inset-0 grid place-items-center bg-black/20">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-primary">
                <Play className="h-6 w-6 fill-current" />
              </span>
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-0.5">
          <DiscoverTypeBadge label={getDiscoverTypeLabel(content.type)} />
          {category ? <DiscoverTypeBadge label={category} /> : null}
          {content.accessLevel === "premium" ? <DiscoverPremiumBadge /> : null}
        </div>

        <div className="space-y-2 px-0.5">
          <h1 className="text-xl font-black leading-snug text-foreground">{content.title}</h1>
          <p className="text-sm font-medium text-muted-foreground">{content.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-muted-foreground">
            <span>{content.authorName}</span>
            <span>{formatDiscoverRelativeDate(content.publishDate)}</span>
            {content.readingTimeMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {content.readingTimeMinutes} د قراءة
              </span>
            ) : null}
            {duration ? (
              <span className="inline-flex items-center gap-1">
                <Play className="h-3.5 w-3.5" />
                {duration}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 px-0.5">
          <button
            type="button"
            aria-label={saved ? "إزالة من المحفوظات" : "حفظ"}
            aria-pressed={saved}
            onClick={onToggleSave}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-muted-foreground transition-transform active:scale-95"
          >
            <Bookmark className={cn("h-5 w-5", saved && "fill-primary text-primary")} />
          </button>
          <button
            type="button"
            aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"}
            aria-pressed={liked}
            onClick={onToggleLike}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-muted-foreground transition-transform active:scale-95"
          >
            <Heart className={cn("h-5 w-5", liked && "fill-rose-500 text-rose-500")} />
          </button>
          <button
            type="button"
            aria-label="مشاركة"
            onClick={onShare}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-muted-foreground"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        {locked ? (
          <div className={cn(discoverCardClass, "space-y-3 p-5 text-center")}>
            <p className="text-sm font-black text-foreground">محتوى Premium</p>
            <p className="text-xs font-medium text-muted-foreground">
              يمكنك قراءة الملخص — افتح العضوية للوصول الكامل.
            </p>
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground"
            >
              ترقية العضوية
            </button>
          </div>
        ) : (
          <>
            <DiscoverBody body={content.body} />

            {content.type === "recipe" && content.recipe ? (
              <div className={cn(discoverCardClass, "space-y-4 p-4")}>
                <p className="text-sm font-black">المكونات</p>
                <ul className="list-disc space-y-1 pr-5 text-sm">
                  {content.recipe.ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-sm font-black">الخطوات</p>
                <ol className="list-decimal space-y-1 pr-5 text-sm">
                  {content.recipe.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <p className="text-[11px] font-medium text-muted-foreground">
                  القيم الغذائية تقريبية — {content.recipe.servings} حصة · {content.recipe.prepMinutes} د
                </p>
              </div>
            ) : null}

            {content.type === "success_story" && content.successStory ? (
              <div className="space-y-3">
                {content.successStory.beforeImage && content.successStory.afterImage ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-[20px]">
                      <OptimizedImage
                        src={content.successStory.beforeImage}
                        alt="قبل — بموافقة معتمدة"
                        width={180}
                        height={240}
                      />
                    </div>
                    <div className="overflow-hidden rounded-[20px]">
                      <OptimizedImage
                        src={content.successStory.afterImage}
                        alt="بعد — بموافقة معتمدة"
                        width={180}
                        height={240}
                      />
                    </div>
                  </div>
                ) : null}
                <p className="text-[11px] font-medium text-muted-foreground">
                  {content.successStory.disclaimer}
                </p>
              </div>
            ) : null}

            {content.type === "challenge" && content.challenge ? (
              <div className={cn(discoverCardClass, "space-y-3 p-4")}>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground">
                  <span>{content.challenge.days} أيام</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {content.challenge.participantCount} مشارك
                  </span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  تحدي عام اختياري — لا يغيّر برنامجك الشخصي.
                </p>
                <button
                  type="button"
                  disabled={joinedChallenge || content.challenge.status !== "active"}
                  onClick={handleJoinChallenge}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground disabled:opacity-50"
                >
                  {joinedChallenge ? "أنت منضم بالفعل" : "انضم إلى التحدي"}
                </button>
              </div>
            ) : null}

            {content.type === "video" ? (
              <p className="text-[11px] font-medium text-muted-foreground">
                لا يتم تشغيل الفيديو تلقائياً — اضغط للتشغيل عند توفر المصدر.
              </p>
            ) : null}
          </>
        )}

        {related.length ? (
          <section className="space-y-3 pt-2">
            <h2 className="text-sm font-black text-foreground">محتوى مشابه</h2>
            <div className="space-y-3">
              {related.map((item) => (
                <DiscoverContentListItem key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
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
