import type { AppState, Lesson } from "@/lib/types";
import { LESSON, LESSONS } from "./lessons";

/** Lessons each round relies on. Rounds warn (never block) when these are unfinished. */
export const ROUND_PREREQS: Record<number, string[]> = {
  1: ["what-is-a-share", "portfolio-pnl"],
  2: ["earnings-expectations"],
  3: ["interest-rates"],
  4: ["valuation-pe"],
  5: ["inflation-margins"],
  6: ["diversification"],
  7: ["volatility-drawdowns"],
  8: ["rumours-vs-facts"],
  9: ["rebalancing"],
  10: LESSONS.map((l) => l.slug),
};

/** The shortest route to a confident first round. */
export const STARTER_PATH = ROUND_PREREQS[1];

export const lessonDone = (s: AppState, slug: string) => s.lessons[slug]?.status === "completed";

export function missingFor(round: number, s: AppState): Lesson[] {
  return (ROUND_PREREQS[round] ?? []).filter((slug) => !lessonDone(s, slug)).map((slug) => LESSON[slug]);
}

export function starterRemaining(s: AppState): Lesson[] {
  return STARTER_PATH.filter((slug) => !lessonDone(s, slug)).map((slug) => LESSON[slug]);
}

/** Lesson that teaches what a round's knowledge check asks about. */
export const CHECK_LESSON: Record<number, string> = {
  1: "portfolio-pnl",
  10: "diversification",
};

/** Lesson step indexes used for deep links (?step=N). */
export const STEP = { intro: 0, visual: 1, example: 2, lab: 3, quiz: 4, apply: 5, done: 6 } as const;
