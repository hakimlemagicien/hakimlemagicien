import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Crown,
  Dumbbell,
  LineChart,
  Lock,
  LockOpen,
  MessageCircle,
  Salad,
} from "lucide-react";
import bodyMuscular from "@/assets/body-muscular.jpg";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  FEATURE_GRID_SEED,
  PROGRAM_CAROUSEL_SEED,
  type FeatureGridItem,
  type ProgramCarouselItem,
} from "@/lib/platform/seed-content";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = {
  coach: MessageCircle,
  exercises: Dumbbell,
  nutrition: Salad,
  progress: LineChart,
} as const;

function ProgramCarouselCard({
  item,
  locked,
}: {
  item: ProgramCarouselItem;
  locked: boolean;
}) {
  const cta = locked ? (
    <Link
      to="/quiz"
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold text-primary-foreground transition hover:bg-primary-hover md:h-10 md:px-5 md:text-xs"
    >
      {item.ctaLabel}
    </Link>
  ) : (
    <Link
      to={item.href}
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold text-primary-foreground transition hover:bg-primary-hover md:h-10 md:px-5 md:text-xs"
    >
      {item.ctaLabel}
    </Link>
  );

  return (
    <article className="flex h-[6.5rem] overflow-hidden rounded-2xl bg-foreground shadow-card md:h-52 md:rounded-3xl">
      <div className="relative w-[36%] shrink-0 md:w-[42%]">
        <OptimizedImage
          src={bodyMuscular}
          alt=""
          className="h-full w-full"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-foreground/20 to-transparent" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-2.5 text-white md:p-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[12px] font-black leading-tight md:text-lg">{item.title}</h3>
            {locked ? (
              <Lock className="h-3 w-3 shrink-0 text-locked md:h-4 md:w-4" />
            ) : (
              <LockOpen className="h-3 w-3 shrink-0 text-emerald-300 md:h-4 md:w-4" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-white/75 md:text-xs md:leading-relaxed">
            {item.description}
          </p>
        </div>
        <div className="flex justify-start">{cta}</div>
      </div>
    </article>
  );
}

function FeatureGridCard({ item, locked }: { item: FeatureGridItem; locked: boolean }) {
  const Icon = FEATURE_ICONS[item.icon];

  const inner = (
    <article
      className={cn(
        "relative flex h-[4.25rem] flex-col items-center justify-center rounded-2xl px-2 py-2 text-center shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition md:aspect-square md:h-auto md:p-4",
        item.bg,
        !locked && "hover:scale-[1.02]",
      )}
    >
      {locked ? (
        <Lock className="absolute start-2 top-2 h-3 w-3 text-locked md:h-4 md:w-4" />
      ) : null}
      <Icon className="mb-1 h-5 w-5 text-foreground/75 md:h-6 md:w-6" />
      <p className="text-[10px] font-black leading-tight text-foreground md:text-sm">{item.title}</p>
      <p className="mt-0.5 line-clamp-1 text-[8px] text-foreground/55 md:text-[11px]">{item.subtitle}</p>
    </article>
  );

  if (locked) {
    return (
      <Link to="/quiz" className="block">
        {inner}
      </Link>
    );
  }

  return (
    <Link to={item.href} className="block">
      {inner}
    </Link>
  );
}

export function PersonalProgramSection({ locked }: { locked: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const item = PROGRAM_CAROUSEL_SEED[activeIndex];

  return (
    <section className="shrink-0 space-y-2 md:space-y-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[13px] font-black text-foreground md:text-base">برنامجك الشخصي</h2>
          <Lock className="h-3.5 w-3.5 text-locked md:h-4 md:w-4" />
        </div>
        <p className="text-[10px] text-muted-foreground md:text-xs">مميزات حصرية للأعضاء المميزين</p>
      </div>

      <ProgramCarouselCard item={item} locked={locked} />

      <div className="flex justify-center gap-1.5">
        {PROGRAM_CAROUSEL_SEED.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            aria-label={`الشريحة ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all md:h-2",
              index === activeIndex ? "w-5 bg-primary md:w-6" : "w-1.5 bg-muted md:w-2",
            )}
          />
        ))}
      </div>
    </section>
  );
}

export function MoreFeaturesGrid({ locked }: { locked: boolean }) {
  return (
    <section className="min-h-0 shrink-0 space-y-2 md:space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 shrink-0 rounded-full bg-primary md:h-5" />
        <h2 className="text-[13px] font-black text-foreground md:text-base">المزيد من الميزات</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {FEATURE_GRID_SEED.map((feature) => (
          <FeatureGridCard key={feature.id} item={feature} locked={locked} />
        ))}
      </div>
    </section>
  );
}

export function UpgradeBannerCard() {
  return (
    <a
      href="/quiz"
      className="group flex shrink-0 items-center gap-2 rounded-2xl cta-gradient px-3 py-3 text-white shadow-cta transition hover:opacity-95 md:px-4 md:py-4"
    >
      <span className="order-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 md:h-10 md:w-10">
        <Crown className="h-[18px] w-[18px] text-amber-300 md:h-5 md:w-5" />
      </span>
      <div className="order-2 min-w-0 flex-1 text-center">
        <p className="text-[13px] font-black leading-tight md:text-sm">احصل على تجربة كاملة</p>
        <p className="text-[10px] text-white/85 md:text-xs">ابدأ رحلتك الاحترافية اليوم</p>
      </div>
      <ChevronLeft className="order-3 h-5 w-5 shrink-0 opacity-90" />
    </a>
  );
}

export function PremiumPreviewGrid({ locked }: { locked: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 md:gap-6">
      <PersonalProgramSection locked={locked} />
      <MoreFeaturesGrid locked={locked} />
      {locked ? <UpgradeBannerCard /> : null}
    </div>
  );
}
