"use client";

import { useState } from "react";
import { PROFILES } from "@/content/market";
import type { ProfileId } from "@/lib/types";
import { cx } from "@/lib/format";
import { Icon } from "./icons";

const QUESTIONS: { q: string; options: { label: string; points: number }[] }[] = [
  {
    q: "Your ₹1,00,000 drops to ₹85,000 in a month. What's your gut reaction?",
    options: [
      { label: "Sell before it falls further", points: 0 },
      { label: "Wait and see", points: 1 },
      { label: "Buy more while it's cheaper", points: 2 },
    ],
  },
  {
    q: "In real life, when might you need money you invest?",
    options: [
      { label: "Within a year or two", points: 0 },
      { label: "In 3–5 years", points: 1 },
      { label: "Not for 5+ years", points: 2 },
    ],
  },
  {
    q: "How much investing have you done before?",
    options: [
      { label: "None. I'm new", points: 0 },
      { label: "A little (FDs, an SIP, a few shares)", points: 1 },
      { label: "Quite a lot", points: 2 },
    ],
  },
];

/** Three quick questions that suggest a risk profile. Purely advisory. */
export function ProfileHelper({ onPick }: { onPick: (p: ProfileId) => void }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const done = answers.every((a) => a !== null);
  const total = answers.reduce<number>((s, a) => s + (a ?? 0), 0);
  const suggestion: ProfileId = total <= 2 ? "cautious" : total <= 4 ? "balanced" : "growth";

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold">
        <span className="flex items-center gap-2">
          <Icon name="sparkle" size={16} className="text-brand" /> Help me choose: 3 quick questions
        </span>
        <Icon name="chevronRight" size={16} className={cx("text-muted transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          {QUESTIONS.map((item, qi) => (
            <fieldset key={item.q}>
              <legend className="text-sm font-semibold">
                {qi + 1}. {item.q}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={answers[qi] === o.points}
                    onClick={() => setAnswers((cur) => cur.map((a, i) => (i === qi ? o.points : a)))}
                    className={cx(
                      "rounded-lg border px-3 py-1.5 text-sm transition",
                      answers[qi] === o.points ? "border-brand bg-brand-soft font-semibold" : "border-line bg-card hover:border-brand/40",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          {done && (
            <div className="flex flex-col gap-3 rounded-xl border border-brand/40 bg-brand-soft p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                Suggested: <span className="font-extrabold">{PROFILES[suggestion].name}</span>: {PROFILES[suggestion].summary}
              </p>
              <button
                type="button"
                onClick={() => {
                  onPick(suggestion);
                  setOpen(false);
                }}
                className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-on-brand"
              >
                Use {PROFILES[suggestion].name}
              </button>
            </div>
          )}
          <p className="text-xs text-muted">This only picks a practice profile for the game. It isn't financial advice.</p>
        </div>
      )}
    </div>
  );
}
