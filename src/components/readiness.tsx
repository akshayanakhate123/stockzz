"use client";

import { useEffect, useState } from "react";
import { LESSONS } from "@/content/lessons";
import { missingFor } from "@/content/path";
import { useApp } from "@/lib/store";
import { Icon } from "./icons";
import { LinkButton } from "./ui";

const key = (round: number) => `stockzz-skip-prereq-${round}`;

/**
 * Warns, but never blocks, when a round relies on lessons the learner hasn't finished.
 * "Play anyway" hides it for this browser session.
 */
export function ReadinessCard({ round, compact = false }: { round: number; compact?: boolean }) {
  const { state, hydrated } = useApp();
  const [skipped, setSkipped] = useState(true);

  useEffect(() => {
    try {
      setSkipped(sessionStorage.getItem(key(round)) === "1");
    } catch {
      setSkipped(false);
    }
  }, [round]);

  const missing = missingFor(round, state);
  if (!hydrated || missing.length === 0 || skipped) return null;

  const minutes = missing.reduce((s, l) => s + l.minutes, 0);
  const shown = round === 10 ? missing.slice(0, 4) : missing;
  const skip = () => {
    try {
      sessionStorage.setItem(key(round), "1");
    } catch {
      /* storage blocked, hide for this render only */
    }
    setSkipped(true);
  };

  return (
    <section aria-label={`Before Round ${round}`} className="rounded-2xl border border-brand/40 bg-brand-soft p-5">
      <p className="flex items-center gap-2 text-sm font-extrabold">
        <Icon name="book" size={16} className="text-brand" /> Before you play Round {round}
      </p>
      <p className="mt-1 text-sm text-fg/85">
        {round === 10
          ? `The final round pulls together every lesson. You still have ${missing.length} to go (about ${minutes} min).`
          : `This round uses ideas from ${missing.length === 1 ? "a lesson" : `${missing.length} lessons`} you haven't finished yet, about ${minutes} min.`}{" "}
        You can still play. The debrief will explain anything new.
      </p>
      <ul className={compact ? "mt-3 flex flex-wrap gap-2" : "mt-3 grid gap-2 sm:grid-cols-2"}>
        {shown.map((l) => (
          <li key={l.slug} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-3 py-2">
            <span className="min-w-0 text-sm">
              <span className="font-bold">
                Lesson {LESSONS.indexOf(l) + 1}: {l.title}
              </span>
              <span className="block text-xs text-muted">{l.minutes} min</span>
            </span>
            <LinkButton href={`/learn/${l.slug}`} size="sm" className="shrink-0 whitespace-nowrap">
              Take lesson
            </LinkButton>
          </li>
        ))}
      </ul>
      {round === 10 && missing.length > shown.length && <p className="mt-2 text-xs text-muted">+ {missing.length - shown.length} more in the lesson library.</p>}
      <button type="button" onClick={skip} className="mt-3 text-sm font-semibold text-muted underline-offset-2 hover:text-fg hover:underline">
        Play anyway
      </button>
    </section>
  );
}
