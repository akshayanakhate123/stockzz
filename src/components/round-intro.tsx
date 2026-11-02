"use client";

import { useEffect, useState } from "react";
import { CONFIG } from "@/content/market";
import type { Round } from "@/lib/types";
import { cx } from "@/lib/format";
import { prefersReducedMotion } from "./motion";

const SHOW_MS = 1900;

/** A short title card between rounds: the round number rolls over and the new topic drops in. */
export function RoundIntro({ round, onDone }: { round: Round; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), prefersReducedMotion() ? 700 : SHOW_MS);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLeaving(true);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setLeaving(true)}
      onAnimationEnd={(e) => e.target === e.currentTarget && leaving && onDone()}
      className={cx("fixed inset-0 z-[70] grid cursor-pointer place-items-center bg-bg/90 p-6 backdrop-blur-md", leaving ? "intro-out" : "animate-fade")}
    >
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-brand">Round</p>
        <div className="num relative mx-auto mt-2 h-24 w-40 overflow-hidden text-8xl font-extrabold leading-none tracking-tight">
          {round.id > 1 && <span className="roll-out absolute inset-0 grid place-items-center text-muted">{round.id - 1}</span>}
          <span className="roll-in absolute inset-0 grid place-items-center">{round.id}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-muted">of {CONFIG.totalRounds}</p>
        <h2 className="animate-alert mt-5 text-3xl font-extrabold tracking-tight" style={{ animationDelay: "0.35s" }}>
          {round.title}
        </h2>
        <p className="animate-alert mt-1 text-sm font-bold uppercase tracking-[0.14em] text-brand" style={{ animationDelay: "0.5s" }}>
          {round.concepts.join(" · ")}
        </p>
        <div className="mt-6 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: CONFIG.totalRounds }, (_, k) => (
            <span
              key={k}
              className={cx("h-1.5 rounded-full transition-all duration-500", k + 1 < round.id ? "w-4 bg-up" : k + 1 === round.id ? "w-8 bg-brand" : "w-4 bg-line")}
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-muted">Click or press Esc to skip</p>
      </div>
    </div>
  );
}
