import { animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AnimatedMetricValueProps = {
  value: number;
  initial?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

function formatNumber(value: number, decimals: number) {
  const rounded = decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
  if (decimals > 0 && !Number.isInteger(rounded)) return rounded.toFixed(decimals);
  return String(Math.round(rounded));
}

export function AnimatedMetricValue({
  value,
  initial,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 0.95,
  className,
}: AnimatedMetricValueProps) {
  const reduceMotion = useReducedMotion();
  const from = initial ?? value;
  const prevRef = useRef(from);
  const displayedRef = useRef(from);
  const [text, setText] = useState(() => `${prefix}${formatNumber(from, decimals)}${suffix}`);

  useEffect(() => {
    if (reduceMotion) {
      prevRef.current = value;
      displayedRef.current = value;
      setText(`${prefix}${formatNumber(value, decimals)}${suffix}`);
      return;
    }

    const start = prevRef.current;
    if (start === value) {
      setText(`${prefix}${formatNumber(value, decimals)}${suffix}`);
      return;
    }

    const controls = animate(start, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        displayedRef.current = latest;
        setText(`${prefix}${formatNumber(latest, decimals)}${suffix}`);
      },
      onComplete: () => {
        displayedRef.current = value;
        prevRef.current = value;
        setText(`${prefix}${formatNumber(value, decimals)}${suffix}`);
      },
    });

    return () => {
      controls.stop();
      prevRef.current = displayedRef.current;
    };
  }, [decimals, duration, prefix, reduceMotion, suffix, value]);

  return (
    <motion.span
      className={className}
      initial={reduceMotion || from === value ? false : { scale: 0.88, opacity: 0.6 }}
      animate={{ scale: from === value ? 1 : [0.88, 1.08, 1], opacity: 1 }}
      transition={{ duration: Math.min(duration, 1.2), ease: [0.16, 1, 0.3, 1] }}
    >
      {text}
    </motion.span>
  );
}

export function AnimatedRepRange({
  min,
  max,
  initialMin,
  initialMax,
  duration = 0.95,
  className,
}: {
  min: number;
  max: number;
  initialMin?: number;
  initialMax?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      <AnimatedMetricValue value={min} initial={initialMin} duration={duration} />
      –
      <AnimatedMetricValue value={max} initial={initialMax} duration={duration} />
    </span>
  );
}
