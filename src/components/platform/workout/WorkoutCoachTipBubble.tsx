import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import coachPortrait from "@/assets/Coach_Hakim_Branded_Profile_PNG/03_Black_Guidance.png";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

const APPEAR_DELAY_MS = 3000;

type WorkoutCoachTipBubbleProps = {
  tipKey: string;
  message: string;
  collapsedLabel?: string;
  className?: string;
};

/**
 * Messenger-style coach tip floating above the set/rest sheet (absolute — does not shift the panel).
 * Appears after 3s as a soft cloudy bubble from the right, with a light idle tremble.
 */
export function WorkoutCoachTipBubble({
  tipKey,
  message,
  collapsedLabel = "رسالة من الكوتش",
  className,
}: WorkoutCoachTipBubbleProps) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setOpen(false);
    setVisible(false);
    const id = window.setTimeout(() => setVisible(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [tipKey]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-full z-20 mb-3 flex justify-end",
        className,
      )}
      dir="ltr"
    >
      <AnimatePresence mode="wait">
        {visible ? (
          open ? (
            <motion.div
              key={`${tipKey}-open`}
              id={panelId}
              role="dialog"
              aria-label="رسالة الكوتش"
              dir="rtl"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 72, y: 10, scale: 0.55, filter: "blur(8px)" }
              }
              animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 36, scale: 0.9, filter: "blur(4px)" }
              }
              transition={{ type: "spring", stiffness: 380, damping: 22, mass: 0.75 }}
              className="pointer-events-auto w-full max-w-[min(100%,20rem)] rounded-2xl border border-white/55 bg-card/95 p-3 text-right shadow-[0_14px_36px_-14px_rgba(15,23,42,0.5)] backdrop-blur-md"
            >
              <div className="flex items-start gap-2.5">
                <div className="size-9 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted">
                  <OptimizedImage
                    src={coachPortrait}
                    alt=""
                    width={72}
                    height={72}
                    sizes="36px"
                    objectFit="cover"
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black text-foreground">الكوتش حكيم</p>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground"
                    >
                      إغلاق
                    </button>
                  </div>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-foreground/90">{message}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key={`${tipKey}-chip`}
              type="button"
              aria-expanded={false}
              aria-controls={panelId}
              dir="rtl"
              onClick={() => setOpen(true)}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 88, y: 14, scale: 0.35, filter: "blur(10px)" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      x: 0,
                      y: 0,
                      scale: 1,
                      filter: "blur(0px)",
                    }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 40, scale: 0.85, filter: "blur(6px)" }
              }
              transition={{ type: "spring", stiffness: 420, damping: 18, mass: 0.7 }}
              className="pointer-events-auto origin-right"
            >
              <span
                className={cn(
                  "flex max-w-[min(100%,16.5rem)] items-center gap-2 rounded-full border border-border/60 bg-card/95 py-1.5 pe-3 ps-1.5 text-right",
                  "shadow-[0_8px_22px_-14px_rgba(15,23,42,0.4)] transition-transform duration-[120ms] active:scale-[0.98]",
                  !reduceMotion && "workout-coach-tip-float",
                )}
              >
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border/50 bg-muted">
                  <OptimizedImage
                    src={coachPortrait}
                    alt=""
                    width={64}
                    height={64}
                    sizes="32px"
                    objectFit="cover"
                    className="h-full w-full"
                  />
                  <span className="absolute -end-0.5 -top-0.5 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <MessageCircle className="size-2.5" strokeWidth={2.6} />
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-black text-foreground">{collapsedLabel}</span>
                  <span className="block truncate text-[9px] font-medium text-muted-foreground">اضغط للقراءة</span>
                </span>
              </span>
            </motion.button>
          )
        ) : null}
      </AnimatePresence>
    </div>
  );
}
