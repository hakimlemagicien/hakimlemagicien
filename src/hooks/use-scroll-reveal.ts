import { useScroll, useTransform, type MotionValue } from "framer-motion";
import type { RefObject } from "react";

type ScrollRevealOptions = {
  target: RefObject<HTMLElement | null>;
  offset?: [string, string];
};

/**
 * Foundation for scroll-driven animations (parallax, progress bars, section reveals).
 */
export function useScrollRevealProgress({
  target,
  offset = ["start end", "end start"],
}: ScrollRevealOptions): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target, offset });
  return scrollYProgress;
}

export function useScrollRevealOpacity({
  target,
  offset = ["start 85%", "start 55%"],
}: ScrollRevealOptions): MotionValue<number> {
  const progress = useScrollRevealProgress({ target, offset });
  return useTransform(progress, [0, 1], [0, 1]);
}
