import { ChevronLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpgradeFlow } from "@/components/platform/upgrade/UpgradeContext";
import { cn } from "@/lib/utils";

function getScrollRoot(): HTMLElement | null {
  return document.querySelector(".platform-main");
}

export function HomeStickyUpgradeFooter() {
  const { openUpgrade } = useUpgradeFlow();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollRoot = getScrollRoot();
    const unlockCard = document.querySelector(".platform-home-unlock");
    const hero = document.querySelector(".platform-home-hero");

    if (!scrollRoot || !hero) return;

    let heroPassed = false;
    let unlockVisible = false;

    const update = () => {
      setVisible(heroPassed && !unlockVisible);
    };

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroPassed = !entry.isIntersecting;
        update();
      },
      { root: scrollRoot, threshold: 0.05 },
    );

    heroObserver.observe(hero);

    let unlockObserver: IntersectionObserver | null = null;
    if (unlockCard) {
      unlockObserver = new IntersectionObserver(
        ([entry]) => {
          unlockVisible = entry.isIntersecting;
          update();
        },
        { root: scrollRoot, threshold: 0.35 },
      );
      unlockObserver.observe(unlockCard);
    }

    return () => {
      heroObserver.disconnect();
      unlockObserver?.disconnect();
    };
  }, []);

  return (
    <div
      className={cn("platform-home-sticky-upgrade", visible && "is-visible")}
      role="complementary"
      aria-label="ترقية سريعة"
      aria-hidden={!visible}
    >
      <button
        type="button"
        className="platform-home-sticky-upgrade__bar platform-touch"
        onClick={() =>
          openUpgrade("افتح كل مميزات برنامجك: تدريب، تغذية، تتبع، ودعم الكوتش.")
        }
      >
        <span className="platform-home-sticky-upgrade__pulse" aria-hidden />
        <span className="platform-home-sticky-upgrade__icon" aria-hidden>
          <Sparkles className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <span className="platform-home-sticky-upgrade__copy">
          <span className="platform-home-sticky-upgrade__title">افتح كل مميزات برنامجك للبدء</span>
        </span>
        <span className="platform-home-sticky-upgrade__action">ترقية</span>
        <ChevronLeft className="platform-home-sticky-upgrade__chevron h-4 w-4 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
