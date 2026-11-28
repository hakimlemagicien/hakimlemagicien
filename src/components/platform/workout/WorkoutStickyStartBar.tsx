import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type WorkoutStickyStartBarProps = {
  /** The in-page start button; the bar shows only while it is off-screen. */
  anchor: HTMLElement | null;
  title: string;
  meta: string;
  /** The same action as the in-page button (Link or button), rendered compact. */
  action: ReactNode;
};

/** One start action per page: floats above the bottom nav only while the card button is out of view. */
export function WorkoutStickyStartBar({ anchor, title, meta, action }: WorkoutStickyStartBarProps) {
  const [anchorVisible, setAnchorVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = anchor;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setAnchorVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [anchor]);

  return (
    <AnimatePresence>
      {anchorVisible ? null : (
        <motion.div
          key="workout-sticky-start"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-0 z-[38] px-4"
          style={{
            bottom:
              "calc(var(--platform-nav-h) + var(--platform-nav-fab-lift) + env(safe-area-inset-bottom, 0px) + 10px)",
          }}
        >
          <div
            dir="rtl"
            className="pointer-events-auto mx-auto flex max-w-[520px] items-center gap-3 rounded-2xl border border-border/60 bg-card/95 py-2 ps-3.5 pe-2 shadow-[0_14px_34px_-14px_rgba(15,23,42,0.35)] backdrop-blur-md"
          >
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-[13px] font-black leading-tight text-foreground">
                {title}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold text-muted-foreground">{meta}</p>
            </div>
            {action}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
