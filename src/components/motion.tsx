"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts from the previous value to the new one, and flashes green or red when it changes. */
export function AnimatedNumber({
  value,
  format,
  className,
  countFrom,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
  /** Count up from this number on first show, without the flash. */
  countFrom?: number;
}) {
  const [shown, setShown] = useState(countFrom ?? value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  // What's on screen right now, so an interrupted tween resumes from there.
  const onScreen = useRef(countFrom ?? value);
  const target = useRef(countFrom ?? value);
  const counted = useRef(countFrom === undefined);

  useEffect(() => {
    if (target.current !== value) {
      if (counted.current) setFlash(value > target.current ? "up" : "down");
      target.current = value;
    }
    counted.current = true;
    const start = onScreen.current;
    if (start === value) return;
    if (reduced()) {
      onScreen.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      const n = Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3)));
      onScreen.current = n;
      setShown(n);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span
      key={value}
      onAnimationEnd={() => setFlash(null)}
      className={cx("-mx-1 rounded-md px-1", flash === "up" && "flash-up", flash === "down" && "flash-down", className)}
    >
      {format(shown)}
    </span>
  );
}

const BURST_COLORS = ["var(--brand)", "var(--up)", "var(--brand-strong)", "#facc15"];

/** A small one-off burst of dots, used when an answer is right. */
export function Burst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="burst-dot"
          style={{ ["--a" as string]: `${i * 30}deg`, background: BURST_COLORS[i % BURST_COLORS.length], animationDelay: `${(i % 3) * 30}ms` }}
        />
      ))}
    </span>
  );
}
