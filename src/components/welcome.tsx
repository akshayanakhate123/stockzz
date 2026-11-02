"use client";

import { useEffect, useState } from "react";
import { LESSON } from "@/content/lessons";
import { STARTER_PATH } from "@/content/path";
import { useApp } from "@/lib/store";
import { Icon } from "./icons";
import { LinkButton } from "./ui";

const KEY = "stockzz-welcome-dismissed";

/** First-visit guide: shown until the learner opens a lesson, starts the simulation or dismisses it. */
export function WelcomeCard() {
  const { state, hydrated } = useApp();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const fresh = Object.keys(state.lessons).length === 0 && !state.sim;
  if (!hydrated || dismissed || !fresh) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* storage blocked */
    }
    setDismissed(true);
  };

  const steps = [
    ...STARTER_PATH.map((slug, i) => ({ label: `Lesson ${i + 1}`, title: LESSON[slug].title, meta: `${LESSON[slug].minutes} min` })),
    { label: "Round 1", title: "Your first decision", meta: "₹1,00,000 paper money" },
  ];

  return (
    <section aria-labelledby="welcome-title" className="relative animate-rise rounded-3xl border-2 border-brand/50 bg-card p-6 shadow-card sm:p-8">
      <button type="button" onClick={close} aria-label="Dismiss welcome" className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:text-fg">
        <Icon name="x" size={18} />
      </button>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">New here?</p>
      <h2 id="welcome-title" className="mt-1 pr-8 text-2xl font-extrabold tracking-tight">
        Start with two short lessons, then make your first trade
      </h2>
      <p className="mt-2 max-w-2xl text-muted">
        Round 1 shows your portfolio value, cash and profit &amp; loss. These two lessons (about 13 minutes) cover every number you'll see, so nothing on the
        screen is new.
      </p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-on-brand">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted">{s.label}</span>
              <span className="block font-bold leading-snug">{s.title}</span>
              <span className="block text-xs text-muted">{s.meta}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <LinkButton href={`/learn/${STARTER_PATH[0]}`} size="lg">
          Start lesson 1 <Icon name="arrowRight" size={16} />
        </LinkButton>
        <button type="button" onClick={close} className="text-sm font-semibold text-muted hover:text-fg hover:underline">
          I know the basics, hide this
        </button>
      </div>
    </section>
  );
}
