import { MotionConfig, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { premiumTransition } from "@/lib/motion";

/**
 * Global motion defaults. Uses MotionConfig only so existing `motion.*` usage
 * across the app stays compatible (LazyMotion strict breaks `motion.div`).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig
      reducedMotion={prefersReducedMotion ? "always" : "user"}
      transition={premiumTransition}
    >
      {children}
    </MotionConfig>
  );
}
