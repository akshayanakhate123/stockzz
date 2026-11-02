"use client";

import { useState, type ReactNode } from "react";
import type { QuizQuestion } from "@/lib/types";
import { cx } from "@/lib/format";
import { Icon } from "./icons";
import { Button, Callout } from "./ui";
import { Burst } from "./motion";

/** Pick an option, then press "Check answer". Only the first checked answer counts. */
export function Question({
  n,
  q,
  answered,
  onAnswer,
  review,
}: {
  n?: number;
  q: QuizQuestion;
  answered?: number | null;
  onAnswer: (a: number) => void;
  /** Shown after a wrong answer, a link back to where this is taught. */
  review?: ReactNode;
}) {
  const done = answered !== undefined && answered !== null;
  const [pick, setPick] = useState<number | null>(null);
  // Only animate an answer checked in this visit, not one restored from storage.
  const [justChecked, setJustChecked] = useState(false);
  return (
    <fieldset>
      <legend className="font-bold">
        {n !== undefined && <span className="mr-2 text-brand">Q{n}.</span>}
        {q.question}
      </legend>
      <div className="mt-3 grid gap-2" role="radiogroup">
        {q.options.map((o, i) => {
          const isAnswer = i === q.answer;
          const picked = done ? answered === i : pick === i;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={picked}
              disabled={done}
              onClick={() => setPick(i)}
              className={cx(
                "relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition duration-150",
                !done && "active:scale-[0.99] hover:-translate-y-px",
                justChecked && picked && (isAnswer ? "animate-pop" : "animate-shake"),
                !done && (picked ? "border-brand bg-brand-soft" : "border-line hover:border-brand/50"),
                done && isAnswer && "border-up bg-up-soft",
                done && picked && !isAnswer && "border-down bg-down-soft",
                done && !picked && !isAnswer && "border-line opacity-60",
              )}
            >
              <span
                className={cx(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                  done && isAnswer ? "border-up text-up" : done && picked ? "border-down text-down" : picked ? "border-brand" : "border-line-strong",
                )}
              >
                {done && isAnswer ? <Icon name="check" size={11} /> : done && picked ? <Icon name="x" size={11} /> : picked ? <span className="h-2 w-2 animate-pop rounded-full bg-brand" /> : null}
              </span>
              {o}
              {justChecked && picked && isAnswer && <Burst />}
            </button>
          );
        })}
      </div>
      {!done && (
        <Button className="mt-3" size="sm" disabled={pick === null} onClick={() => {
            if (pick === null) return;
            setJustChecked(true);
            onAnswer(pick);
          }}>
          Check answer
        </Button>
      )}
      {done && (
        <div className="mt-3 animate-rise">
          <Callout tone={answered === q.answer ? "up" : "down"} title={answered === q.answer ? "Correct" : "Not quite"}>
            {q.why}
            {answered !== q.answer && review && <span className="mt-2 block">{review}</span>}
          </Callout>
        </div>
      )}
    </fieldset>
  );
}
