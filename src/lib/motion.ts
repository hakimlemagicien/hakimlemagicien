import type { Transition, Variants } from "framer-motion";

/** Premium mobile easing — shared across page, scroll, and skeleton motion. */
export const premiumEase = [0.22, 1, 0.36, 1] as const;

export const premiumTransition: Transition = {
  duration: 0.32,
  ease: premiumEase,
};

export const pageTransition: Transition = {
  duration: 0.28,
  ease: premiumEase,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const skeletonVariants: Variants = {
  initial: { opacity: 0.45 },
  animate: {
    opacity: [0.45, 0.82, 0.45],
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
  },
};

/** RTL-safe horizontal reveal (positive X enters from the right in RTL layouts). */
export const rtlRevealVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: premiumEase },
  },
};
