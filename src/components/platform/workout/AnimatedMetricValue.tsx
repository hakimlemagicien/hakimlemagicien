import { animate, motion } from "framer-motion";
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
  duration = 1.75,
  className,
}: AnimatedMetricValueProps) {
  const from = initial ?? value;
  const prevRef = useRef(from);
  const displayedRef = useRef(from);
  const [text, setText] = useState(() => `${prefix}${formatNumber(from, decimals)}${suffix}`);

  useEffect(() => {
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
  }, [decimals, duration, prefix, suffix, value]);

  return (
    <motion.span
      key={value}
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
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
  duration = 1.75,
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
