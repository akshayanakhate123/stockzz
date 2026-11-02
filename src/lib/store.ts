"use client";

import { useSyncExternalStore } from "react";
import { LESSON } from "@/content/lessons";
import { STEP } from "@/content/path";
import { BADGES } from "./achievements";
import { advance, answerCheck, resolveRound, startSim, type Decision } from "./engine";
import type { AppState, EventName, ProfileId } from "./types";

const KEY = "stockzz:v1";
const MAX_EVENTS = 300;

export function emptyState(): AppState {
  return { version: 1, lessons: {}, sim: null, badges: {}, events: [] };
}

/**
 * Lessons used to complete only on the final "Done" step, so learners who left from "Apply it"
 * were stuck as in progress. Anyone who answered the quiz and reached "Apply it" has finished.
 */
function healLessons(s: AppState): AppState {
  let lessons = s.lessons;
  for (const [slug, l] of Object.entries(s.lessons)) {
    const lesson = LESSON[slug];
    if (!lesson || l.status === "completed" || l.step < STEP.apply) continue;
    if (!lesson.quiz.every((q) => l.quiz[q.id])) continue;
    lessons = { ...lessons, [slug]: { ...l, status: "completed", completedAt: l.completedAt ?? Date.now() } };
  }
  return lessons === s.lessons ? s : { ...s, lessons };
}

function parse(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object" || s.version !== 1 || typeof s.lessons !== "object" || !Array.isArray(s.events)) return null;
    return healLessons({ ...emptyState(), ...s });
  } catch {
    return null;
  }
}

interface Snapshot {
  state: AppState;
  hydrated: boolean;
  storageError: boolean;
}

const SERVER: Snapshot = { state: emptyState(), hydrated: false, storageError: false };
let snap: Snapshot = SERVER;
const listeners = new Set<() => void>();

function hydrate() {
  if (snap.hydrated || typeof window === "undefined") return;
  let state = emptyState();
  let storageError = false;
  try {
    state = parse(window.localStorage.getItem(KEY)) ?? emptyState();
  } catch {
    storageError = true;
  }
  snap = { state, hydrated: true, storageError };
}

function persist(state: AppState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return false;
  } catch {
    return true;
  }
}

function emit() {
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key !== KEY) return;
  snap = { ...snap, state: parse(e.newValue) ?? emptyState() };
  emit();
}

function subscribe(cb: () => void) {
  hydrate();
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function log(s: AppState, name: EventName, props?: Record<string, string | number>): AppState {
  return { ...s, events: [...s.events, { name, at: Date.now(), ...(props ? { props } : {}) }].slice(-MAX_EVENTS) };
}

function commit(fn: (s: AppState) => AppState) {
  hydrate();
  let next = fn(snap.state);
  if (next === snap.state) return;
  // Unlock any newly earned badges.
  let badges = next.badges;
  for (const b of BADGES) if (!badges[b.id] && b.unlocked(next)) badges = { ...badges, [b.id]: Date.now() };
  if (badges !== next.badges) next = { ...next, badges };
  snap = { state: next, hydrated: true, storageError: persist(next) };
  emit();
}

export const actions = {
  openLesson(slug: string) {
    commit((s) =>
      s.lessons[slug]
        ? s
        : log({ ...s, lessons: { ...s.lessons, [slug]: { status: "in-progress", step: 0, quiz: {}, openedAt: Date.now() } } }, "lesson_opened", { slug }),
    );
  },
  setLessonStep(slug: string, step: number) {
    commit((s) => {
      const l = s.lessons[slug];
      return l && l.step !== step ? { ...s, lessons: { ...s.lessons, [slug]: { ...l, step } } } : s;
    });
  },
  answerQuiz(slug: string, qid: string, answer: number, correct: boolean) {
    commit((s) => {
      const l = s.lessons[slug];
      if (!l || l.quiz[qid]) return s;
      return log({ ...s, lessons: { ...s.lessons, [slug]: { ...l, quiz: { ...l.quiz, [qid]: { answer, correct } } } } }, "quiz_answered", {
        slug,
        correct: correct ? 1 : 0,
      });
    });
  },
  completeLesson(slug: string) {
    commit((s) => {
      const l = s.lessons[slug];
      if (!l || l.status === "completed") return s;
      return log({ ...s, lessons: { ...s.lessons, [slug]: { ...l, status: "completed", completedAt: Date.now() } } }, "lesson_completed", { slug });
    });
  },
  startSim(profile: ProfileId) {
    commit((s) => (s.sim && s.sim.status === "active" ? s : log({ ...s, sim: startSim(profile) }, "sim_started", { profile })));
  },
  restartSim(profile: ProfileId) {
    commit((s) => ({
      ...log(log(s, "sim_restarted", { fromRound: s.sim?.currentRound ?? 0 }), "sim_started", { profile }),
      sim: startSim(profile),
    }));
  },
  submitDecision(decision: Decision) {
    commit((s) => {
      if (!s.sim) throw new Error("Start the simulation first.");
      const round = s.sim.currentRound;
      let next: AppState = { ...s, sim: resolveRound(s.sim, decision) };
      for (const o of decision.orders) next = log(next, "order_placed", { round, ticker: o.ticker, side: o.side, quantity: o.quantity });
      return log(next, "round_completed", { round, path: next.sim!.rounds.at(-1)!.pathId });
    });
  },
  viewDebrief(round: number) {
    commit((s) => {
      const seen = s.events.some((e) => e.name === "debrief_viewed" && e.props?.round === round && e.at >= (s.sim?.startedAt ?? 0));
      return seen ? s : log(s, "debrief_viewed", { round });
    });
  },
  answerRoundCheck(round: number, answer: number) {
    commit((s) => {
      if (!s.sim) return s;
      const r = s.sim.rounds.find((x) => x.round === round);
      if (!r || r.checkAnswer !== null) return s;
      return log({ ...s, sim: answerCheck(s.sim, round, answer) }, "check_answered", { round });
    });
  },
  nextRound() {
    commit((s) => {
      if (!s.sim) return s;
      const sim = advance(s.sim);
      const next = { ...s, sim };
      return sim.status === "complete" && s.sim.status !== "complete" ? log(next, "sim_completed", { rounds: sim.rounds.length }) : next;
    });
  },
  resetAll() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* storage blocked, in-memory reset still applies */
    }
    snap = { state: emptyState(), hydrated: true, storageError: false };
    emit();
  },
};

export function useApp(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => {
      hydrate();
      return snap;
    },
    () => SERVER,
  );
}
