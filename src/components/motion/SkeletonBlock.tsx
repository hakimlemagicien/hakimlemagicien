import { motion } from "framer-motion";
import { skeletonVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Placeholder block for upcoming skeleton loaders — RTL-safe by default. */
export function SkeletonBlock({
  className,
  rounded = "rounded-xl",
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <motion.div
      aria-hidden
      variants={skeletonVariants}
      initial="initial"
      animate="animate"
      className={cn("bg-neutral-200/70", rounded, className)}
    />
  );
}
