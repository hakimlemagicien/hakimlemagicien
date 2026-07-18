import {
  ChevronLeft,
  ClipboardList,
  Flame,
  Lock,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import homeNutritionHero from "@/assets/home-nutrition-hero.webp";
import { cn } from "@/lib/utils";

const NUTRITION_BENEFITS = [
  {
    icon: UtensilsCrossed,
    tone: "is-purple",
    title: "خطط غذائية مخصصة لك",
  },
  {
    icon: Flame,
    tone: "is-green",
    title: "سعرات محسوبة بدقة",
  },
  {
    icon: ClipboardList,
    tone: "is-orange",
    title: "قوائم تسوق أسبوعية",
  },
  {
    icon: TrendingUp,
    tone: "is-blue",
    title: "متابعة وتعديل حسب تقدمك",
  },
] as const;

export function HomePersonalNutritionCard() {
  const { openUpgrade } = useUpgradeFlow();

  return (
    <section
      className="platform-home-nutrition platform-home-enter platform-home-enter--d7"
      aria-labelledby="home-nutrition-title"
    >
      <article className="platform-home-nutrition__card">
        <span className="platform-home-nutrition__badge">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          مميز للمشتركين فقط
        </span>

        <div className="platform-home-nutrition__hero">
          <div className="platform-home-nutrition__hero-copy">
            <h2 id="home-nutrition-title" className="platform-home-nutrition__title">
              اكتشف <span className="platform-home-nutrition__accent">التغذية</span> المخصصة
            </h2>
            <p className="platform-home-nutrition__lead">
              خطة غذائية مخصصة لأهدافك، بناءً على جسمك واحتياجاتك.
            </p>
          </div>

          <OptimizedImage
            src={homeNutritionHero}
            alt="خطة غذائية شخصية — وجبات متوازنة ومحسوبة تناسب أهدافك"
            className="platform-home-nutrition__hero-img"
            width={1024}
            height={682}
            objectFit="contain"
          />
        </div>

        <div className="platform-home-nutrition__panel">
          <p className="platform-home-nutrition__panel-head">✦ ستحصل على: ✦</p>

          <div className="platform-home-nutrition__benefits">
            {NUTRITION_BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="platform-home-nutrition__benefit">
                  <span className={cn("platform-home-nutrition__benefit-icon", item.tone)}>
                    <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                    <span className="platform-home-nutrition__benefit-lock" aria-hidden>
                      <Lock className="h-2 w-2" strokeWidth={2.8} />
                    </span>
                  </span>
                  <p className="platform-home-nutrition__benefit-title">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="platform-home-nutrition__cta platform-touch"
          onClick={() =>
            openUpgrade("افتح خطتك الغذائية المخصصة: وجبات محسوبة، قوائم تسوق، ومتابعة حسب تقدمك.")
          }
        >
          <Lock className="h-4 w-4" aria-hidden />
          ترقية الآن لفتح خطتك الغذائية
        </button>

        <button
          type="button"
          className="platform-home-nutrition__more"
          onClick={() => openUpgrade("اعرف المزيد عن باقات Hakim Coaching.")}
        >
          اعرف المزيد عن الباقات
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      </article>
    </section>
  );
}
