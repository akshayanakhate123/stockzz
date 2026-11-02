import type { AppState } from "./types";

export const DIMENSIONS = [
  {
    id: "comprehension",
    name: "Concept understanding",
    description: "Share of quiz and debrief questions you got right on the first try.",
  },
  {
    id: "reasoning",
    name: "Decision reasoning",
    description: "How sound your stated reason was, plus how sensible your action was given only what you knew before the outcome.",
  },
  {
    id: "risk",
    name: "Risk awareness",
    description: "70% from the risk you named before deciding, 30% from position sizing against your profile.",
  },
  {
    id: "diversification",
    name: "Diversification",
    description: "How many sectors effectively carry your invested money. Rounds with under 15% invested are skipped.",
  },
  {
    id: "consistency",
    name: "Consistency",
    description: "Share of rounds where your action matched the reasoning you said you followed.",
  },
] as const;

export type DimensionId = (typeof DIMENSIONS)[number]["id"];

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

export function buildReport(s: AppState) {
  const rounds = s.sim?.rounds ?? [];
  const quiz = Object.values(s.lessons).flatMap((l) => Object.values(l.quiz).map((q) => (q.correct ? 100 : 0)));
  const debrief = rounds.map((r) => r.scores.comprehension).filter((x): x is number => x !== null);
  const div = rounds.map((r) => r.scores.diversification).filter((x): x is number => x !== null);
  const scores: Record<DimensionId, { score: number | null; samples: number }> = {
    comprehension: { score: avg([...quiz, ...debrief]), samples: quiz.length + debrief.length },
    reasoning: { score: avg(rounds.map((r) => r.scores.reasoning)), samples: rounds.length },
    risk: { score: avg(rounds.map((r) => r.scores.risk)), samples: rounds.length },
    diversification: { score: avg(div), samples: div.length },
    consistency: {
      score: rounds.length ? Math.round((rounds.filter((r) => r.scores.consistent).length / rounds.length) * 100) : null,
      samples: rounds.length,
    },
  };
  const dims = DIMENSIONS.map((d) => ({ ...d, ...scores[d.id] }));
  const overall = avg(dims.map((d) => d.score).filter((x): x is number => x !== null));
  return { dims, overall };
}
