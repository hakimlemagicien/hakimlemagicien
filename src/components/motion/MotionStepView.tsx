import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition, pageVariants } from "@/lib/motion";
import type { QuizTransitionPhase } from "@/hooks/use-quiz-step-transition";

export function MotionStepView({
  phase,
  children,
  className = "",
}: {
  phase: QuizTransitionPhase;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`w-full h-full ${className}`}
      variants={pageVariants}
      initial={false}
      animate={phase === "in" ? "animate" : "exit"}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
