import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const WHATSAPP_URL = "https://wa.me/971505129019";
const HERO_INLINE_CTA_ID = "hero-inline-quiz-cta";
const STICKY_QUIZ_BAR_ID = "hero-sticky-quiz-bar";
const WHATSAPP_SIZE = 52;
const GAP_ABOVE_STICKY = 16;

export function FloatingWhatsApp() {
  const [stickyQuizActive, setStickyQuizActive] = useState(false);
  const [liftedBottomPx, setLiftedBottomPx] = useState(20);

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

  const bottom = stickyQuizActive
    ? `${liftedBottomPx}px`
    : "calc(1.25rem + env(safe-area-inset-bottom, 0px))";

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed z-[60] grid place-items-center rounded-full bg-[#25D366] shadow-[0_8px_22px_-6px_rgba(37,211,102,0.5)] transition-[transform,bottom] duration-500 ease-out hover:scale-105 active:scale-95 animate-whatsapp-pulse animate-whatsapp-enter max-lg:right-4 lg:right-5"
      style={{
        width: WHATSAPP_SIZE,
        height: WHATSAPP_SIZE,
        bottom,
      }}
    >
      <WhatsAppIcon className="h-7 w-7 text-white" />
    </a>
  );
}
