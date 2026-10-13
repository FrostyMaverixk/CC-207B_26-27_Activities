"use client";

import * as React from "react";
import { useReducedMotion } from "@/components/ui/text-animate-utils/use-reduced-motion";
import { cn } from "@/lib/utils";

type TextAnimateProps = React.ComponentProps<"span"> & {
  children: string;
  duration?: number;
  delay?: number;
};

export function TextAnimate({ children, duration = 1.6, delay = 0, className, ...props }: TextAnimateProps) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = React.useState(reduced ? 1 : 0);

  React.useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const delayMs = delay * 1000;
    const durationMs = Math.max(duration, 0.1) * 1000;
    const tick = (now: number) => {
      if (start === null) start = now + delayMs;
      const value = Math.max(0, now - start) / durationMs;
      setProgress(Math.min(value, 1));
      if (value < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [delay, duration, reduced]);

  const visibleCount = Math.ceil(children.length * progress);
  return (
    <span className={cn("text-animate", className)} {...props}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {Array.from(children).map((character, index) => (
          <span key={`${character}-${index}`} className="text-animate-unit" style={{ opacity: index < visibleCount ? 1 : 0 }}>
            {index < visibleCount ? character : "\u00a0"}
          </span>
        ))}
      </span>
    </span>
  );
}
