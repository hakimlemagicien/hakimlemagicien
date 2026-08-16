import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { premiumEase } from "@/lib/motion";

export type HubOrigin = {
  x: number;
  y: number;
};

type HubOverlayShellProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  origin: HubOrigin | null;
  children: ReactNode;
};

const NAV_RESERVE = 72;

function originOffset(origin: HubOrigin | null) {
  if (typeof window === "undefined") {
    return { x: 0, y: 96, scale: 0.18 };
  }
  const centerX = window.innerWidth / 2;
  const centerY = (window.innerHeight - NAV_RESERVE) / 2;
  if (!origin) {
    return { x: 0, y: 88, scale: 0.2 };
  }
  return {
    x: origin.x - centerX,
    y: origin.y - centerY,
    scale: 0.18,
  };
}

export function HubOverlayShell({
  open,
  onClose,
  label,
  closeLabel,
  origin,
  children,
}: HubOverlayShellProps) {
  const reduceMotion = useReducedMotion();
  const fromOrigin = useMemo(() => originOffset(origin), [origin]);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="daily-hub-overlay md:hidden" role="presentation">
          <motion.button
            type="button"
            aria-label={closeLabel}
            className="daily-hub-overlay__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: premiumEase }}
            onClick={onClose}
          />

          <motion.div
            className="daily-hub-overlay__cluster"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0.72, x: fromOrigin.x, y: fromOrigin.y, scale: fromOrigin.scale }
            }
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0.55, x: fromOrigin.x, y: fromOrigin.y, scale: fromOrigin.scale }
            }
            transition={{ duration: reduceMotion ? 0.14 : 0.42, ease: premiumEase }}
          >
            <div
              dir="rtl"
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="daily-hub-overlay__panel"
            >
              {children}
            </div>

            <motion.button
              type="button"
              aria-label={closeLabel}
              className="daily-hub-overlay__close"
              onClick={onClose}
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.22, ease: premiumEase }}
            >
              <X className="h-4 w-4" strokeWidth={2.25} />
            </motion.button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
