import { LESSONS } from "@/content/lessons";
import { sectorWeights } from "./portfolio";
import type { AppState } from "./types";
import type { IconName } from "@/components/icons";

const lessonsDone = (s: AppState) => Object.values(s.lessons).filter((l) => l.status === "completed").length;
const pathIn = (s: AppState, round: number) => s.sim?.rounds.find((r) => r.round === round)?.pathId;

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  unlocked: (s: AppState) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first-lesson", title: "First step", description: "Finish your first lesson.", icon: "book", unlocked: (s) => lessonsDone(s) >= 1 },
  { id: "five-lessons", title: "Curious mind", description: "Finish five lessons.", icon: "brain", unlocked: (s) => lessonsDone(s) >= 5 },
  { id: "all-lessons", title: "Full syllabus", description: `Finish all ${LESSONS.length} lessons.`, icon: "graduation", unlocked: (s) => lessonsDone(s) >= LESSONS.length },
  { id: "first-order", title: "First trade", description: "Place your first virtual order.", icon: "cart", unlocked: (s) => (s.sim?.ledger.transactions.length ?? 0) > 0 },
  {
    id: "three-sectors",
    title: "Spread out",
    description: "Hold stocks in three or more sectors at once.",
    icon: "shapes",
    unlocked: (s) => !!s.sim && sectorWeights(s.sim.ledger, s.sim.prices).length >= 3,
  },
  { id: "halfway", title: "Halfway there", description: "Complete five simulation rounds.", icon: "flag", unlocked: (s) => (s.sim?.rounds.length ?? 0) >= 5 },
  {
    id: "sharp",
    title: "Sharp reader",
    description: "Get three debrief questions right first time.",
    icon: "target",
    unlocked: (s) => (s.sim?.rounds.filter((r) => r.scores.comprehension === 100).length ?? 0) >= 3,
  },
  {
    id: "rumour-proof",
    title: "Rumour-proof",
    description: "Don't buy into the Round 8 rumour.",
    icon: "shield",
    unlocked: (s) => {
      const p = pathIn(s, 8);
      return !!p && !["big-bet", "bought-rumour"].includes(p);
    },
  },
  {
    id: "steady-hands",
    title: "Steady hands",
    description: "Avoid an all-or-nothing move in the Round 7 crash.",
    icon: "calm",
    unlocked: (s) => {
      const p = pathIn(s, 7);
      return !!p && !["all-in", "sold-all"].includes(p);
    },
  },
  { id: "graduate", title: "Stockzz graduate", description: "Complete all ten rounds.", icon: "trophy", unlocked: (s) => s.sim?.status === "complete" },
];
