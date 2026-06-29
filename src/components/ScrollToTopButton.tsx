import { useEffect, useState, type CSSProperties } from "react";
import { ChevronUp } from "lucide-react";

const BOTTOM_THRESHOLD_PX = 24;
const HERO_INLINE_CTA_ID = "hero-inline-quiz-cta";
const STICKY_QUIZ_BAR_ID = "hero-sticky-quiz-bar";
const GAP_ABOVE_STICKY = 16;
const WHATSAPP_SIZE = 52;
const GAP_ABOVE_WHATSAPP = 12;

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [stickyQuizActive, setStickyQuizActive] = useState(false);
  const [liftedBottomPx, setLiftedBottomPx] = useState(20);

  useEffect(() => {
    const checkBottom = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const atBottom = scrollTop + viewportHeight >= documentHeight - BOTTOM_THRESHOLD_PX;
      setVisible(atBottom);
    };

    checkBottom();
    window.addEventListener("scroll", checkBottom, { passive: true });
    window.addEventListener("resize", checkBottom);

    return () => {
      window.removeEventListener("scroll", checkBottom);
      window.removeEventListener("resize", checkBottom);
    };
  }, []);

  useEffect(() => {
    const cta = document.getElementById(HERO_INLINE_CTA_ID);
    if (!cta) return;

    const mobileMq = window.matchMedia("(max-width: 1023px)");

    const sync = (intersecting: boolean) => {
      setStickyQuizActive(mobileMq.matches && !intersecting);
    };

    const observer = new IntersectionObserver(
      ([entry]) => sync(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(cta);

    const onMqChange = () => {
      const rect = cta.getBoundingClientRect();
      const inView = rect.bottom > 0 && rect.top < window.innerHeight;
      sync(inView);
    };
    mobileMq.addEventListener("change", onMqChange);

    return () => {
      observer.disconnect();
      mobileMq.removeEventListener("change", onMqChange);
    };
  }, []);

  useEffect(() => {
    if (!stickyQuizActive) return;

    const stickyBar = document.getElementById(STICKY_QUIZ_BAR_ID);
    if (!stickyBar) return;

    const updateBottom = () => {
      const barHeight = stickyBar.getBoundingClientRect().height;
      setLiftedBottomPx(barHeight + GAP_ABOVE_STICKY);
    };

    updateBottom();
    const resizeObserver = new ResizeObserver(updateBottom);
    resizeObserver.observe(stickyBar);
    window.addEventListener("resize", updateBottom);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateBottom);
    };
  }, [stickyQuizActive]);

  const bottomStyle: CSSProperties = stickyQuizActive
    ? { bottom: `${liftedBottomPx + WHATSAPP_SIZE + GAP_ABOVE_WHATSAPP}px` }
    : {};

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="العودة إلى أعلى الصفحة"
      aria-hidden={!visible}
      className={[
        "fixed z-[59] left-4 grid h-12 w-12 place-items-center rounded-full text-white shadow-[0_10px_28px_-8px_rgba(249,115,22,0.55)] transition-[opacity,transform,bottom] duration-300 ease-out lg:left-5",
        "bg-gradient-to-br from-[#F97316] to-[#FB923C]",
        "hover:scale-105 active:scale-95",
        !stickyQuizActive &&
          "max-lg:bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      ]
        .filter(Boolean)
        .join(" ")}
      style={bottomStyle}
    >
      <ChevronUp className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
