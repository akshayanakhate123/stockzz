"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES, LESSON, LESSON_STEPS, LESSONS, nextLesson } from "@/content/lessons";
import { getRound } from "@/content/rounds";
import { missingFor, STEP } from "@/content/path";
import { actions, useApp } from "@/lib/store";
import type { AppState, Lesson, Visual } from "@/lib/types";
import { cx } from "@/lib/format";
import { Bars } from "@/components/charts";
import { Icon } from "@/components/icons";
import { Lab } from "@/components/labs";
import { Question } from "@/components/question";
import { Badge, Button, Callout, Card, Eyebrow, LinkButton, Progress, Skeleton } from "@/components/ui";
import { AnimatedNumber, Confetti, Ring } from "@/components/motion";

export function LessonPlayer({ slug }: { slug: string }) {
  const lesson = LESSON[slug];
  const { state, hydrated } = useApp();
  const progress = state.lessons[slug];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    actions.openLesson(slug);
  }, [hydrated, slug]);

  // Resume where the learner left off, once.
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (hydrated && !resumed) {
      // ?step=N deep links (e.g. "Review the worked example") win over the saved step.
      const raw = new URLSearchParams(window.location.search).get("step");
      const asked = raw === null ? NaN : Number(raw);
      // Links may only jump to review steps (intro → lab) so they can't skip the quiz.
      const allowed = Number.isInteger(asked) && asked >= 0 && asked < LESSON_STEPS.length && (asked <= STEP.lab || progress?.status === "completed");
      setStep(allowed ? asked : (progress?.step ?? 0));
      setResumed(true);
    }
  }, [hydrated, resumed, progress?.step, progress?.status]);

  const go = (n: number) => {
    const s = Math.max(0, Math.min(LESSON_STEPS.length - 1, n));
    setStep(s);
    actions.setLessonStep(slug, s);
    // Passing the quiz and reaching "Apply it" finishes the lesson. The Apply step can send the
    // learner straight to another lesson, so waiting for "Done" would leave this one unfinished.
    if (s >= STEP.apply) actions.completeLesson(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quizDone = lesson.quiz.every((q) => progress?.quiz[q.id]);
  const canNext = step !== 4 || quizDone;

  if (!hydrated) return <Skeleton className="h-[480px]" />;

  const canOpen = (i: number) => i <= step || (i === STEP.apply && quizDone) || progress?.status === "completed";
  const pctDone = Math.round(((step + 1) / LESSON_STEPS.length) * 100);

  return (
    <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] 2xl:grid-cols-[264px_minmax(0,1fr)_300px]">
      <LessonOutline lesson={lesson} step={step} pct={pctDone} canOpen={canOpen} onPick={go} />
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <Link href="/learn" className="hover:text-brand">
            Learn
          </Link>{" "}
          / <span>{CATEGORIES[lesson.category].name}</span>
        </nav>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{lesson.level}</Badge>
          <Badge>
            <Icon name="clock" size={12} /> {lesson.minutes} min
          </Badge>
          {progress?.status === "completed" && (
            <Badge tone="up">
              <Icon name="check" size={12} /> Completed
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-muted">{lesson.summary}</p>

        <div className="mt-6 lg:hidden">
          <div className="mb-2 flex justify-between text-xs font-semibold text-muted">
            <span>
              Step {step + 1} of {LESSON_STEPS.length}: {LESSON_STEPS[step]}
            </span>
            <span className="num">{pctDone}%</span>
          </div>
          <Progress value={((step + 1) / LESSON_STEPS.length) * 100} />
          <ol className="mt-3 hidden grid-cols-7 gap-1 sm:grid">
            {LESSON_STEPS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => (canOpen(i) ? go(i) : undefined)}
                  className={cx(
                    "w-full truncate rounded-lg px-1 py-1 text-[11px] font-semibold",
                    i === step ? "bg-brand-soft text-brand-strong" : i < step || progress?.status === "completed" ? "text-fg hover:text-brand" : "text-muted/60",
                  )}
                  aria-current={i === step ? "step" : undefined}
                >
                  {s}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <Card className="mt-6 animate-rise p-6 sm:p-8" key={step}>
          {step === 0 && <IntroStep lesson={lesson} />}
          {step === 1 && <VisualStep visual={lesson.visual} />}
          {step === 2 && <ExampleStep lesson={lesson} />}
          {step === 3 && (
            <div>
              <Eyebrow>Experiment</Eyebrow>
              <h2 className="mt-1 text-2xl font-bold">{lesson.labTitle}</h2>
              <p className="mt-1 mb-6 text-muted">{lesson.labPrompt}</p>
              <Lab id={lesson.lab} />
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {lesson.labInsights.map((t) => (
                  <Callout key={t} tone="neutral">
                    <span className="flex gap-2">
                      <Icon name="sparkle" size={16} className="mt-0.5 shrink-0 text-brand" />
                      <span>{t}</span>
                    </span>
                  </Callout>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <Eyebrow>Quick check</Eyebrow>
              <h2 className="mt-1 mb-6 text-2xl font-bold">Two questions. Your first answer counts.</h2>
              <div className="space-y-8">
                {lesson.quiz.map((q, i) => (
                  <Question
                    key={q.id}
                    n={i + 1}
                    q={q}
                    answered={progress?.quiz[q.id]?.answer}
                    onAnswer={(a) => actions.answerQuiz(slug, q.id, a, a === q.answer)}
                    review={
                      <button type="button" onClick={() => go(STEP.example)} className="font-semibold text-brand hover:underline">
                        Review the worked example <Icon name="arrowRight" size={14} className="inline" />
                      </button>
                    }
                  />
                ))}
              </div>
            </div>
          )}
          {step === 5 && <ApplyStep lesson={lesson} state={state} />}
          {step === 6 && <DoneStep lesson={lesson} state={state} />}
        </Card>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
            <Icon name="arrowLeft" size={16} /> Back
          </Button>
          {step < LESSON_STEPS.length - 1 && (
            <Button onClick={() => go(step + 1)} disabled={!canNext} title={!canNext ? "Answer both questions first" : undefined}>
              {step === 5 ? "Finish lesson" : "Next"} <Icon name="arrowRight" size={16} />
            </Button>
          )}
        </div>
      </div>
      <LessonRail lesson={lesson} state={state} />
    </div>
  );
}

/** Left rail on wide screens: where you are in this lesson, and what comes next. */
function LessonOutline({
  lesson,
  step,
  pct,
  canOpen,
  onPick,
}: {
  lesson: Lesson;
  step: number;
  pct: number;
  canOpen: (i: number) => boolean;
  onPick: (i: number) => void;
}) {
  const index = LESSONS.indexOf(lesson);
  const next = nextLesson(lesson.slug);
  return (
    <aside aria-label="Lesson outline" className="hidden lg:block">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
            Lesson {index + 1} of {LESSONS.length}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <span className="num text-3xl font-extrabold tracking-tight">{pct}%</span>
            <span className="text-xs font-semibold text-muted">{lesson.minutes} min lesson</span>
          </div>
          <Progress value={pct} className="mt-2" />
          <ol className="relative mt-5 space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[15px] before:w-px before:bg-line">
            {LESSON_STEPS.map((label, i) => {
              const here = i === step;
              const passed = i < step;
              const open = canOpen(i);
              return (
                <li key={label} className="relative">
                  <button
                    type="button"
                    onClick={() => open && onPick(i)}
                    disabled={!open}
                    aria-current={here ? "step" : undefined}
                    className={cx(
                      "flex w-full items-center gap-3 rounded-xl px-1.5 py-1.5 text-left text-sm transition",
                      here ? "bg-brand-soft font-bold text-brand-strong" : open ? "font-semibold hover:bg-surface" : "cursor-not-allowed text-muted/70",
                    )}
                  >
                    <span
                      className={cx(
                        "relative z-10 grid size-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-extrabold",
                        here ? "border-brand bg-brand text-on-brand" : passed ? "border-brand bg-card text-brand" : "border-line-strong bg-card text-muted",
                      )}
                    >
                      {passed ? <Icon name="check" size={11} strokeWidth={3} /> : i + 1}
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <Link href={next ? `/learn/${next.slug}` : "/simulate"} className="lift block rounded-2xl border border-line bg-surface p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Up next</span>
          <span className="mt-1 flex items-center justify-between gap-2 text-sm font-bold">
            {next ? next.title : "The simulation"} <Icon name="arrowRight" size={15} className="shrink-0 text-brand" />
          </span>
        </Link>
        <Link href="/learn" className="flex items-center gap-2 px-1 text-sm font-semibold text-muted hover:text-brand">
          <Icon name="arrowLeft" size={14} /> All lessons
        </Link>
      </div>
    </aside>
  );
}

/** Right rail on very wide screens: vocabulary to keep in view, and where this lesson gets used. */
function LessonRail({ lesson, state }: { lesson: Lesson; state: AppState }) {
  const round = getRound(lesson.applyRound);
  const done = LESSONS.filter((l) => state.lessons[l.slug]?.status === "completed").length;
  return (
    <aside aria-label="Lesson reference" className="hidden 2xl:block">
      <div className="sticky top-24 space-y-4">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <Icon name="book" size={16} className="text-brand" /> Key terms
          </p>
          <dl className="mt-3 divide-y divide-line">
            {lesson.terms.map((t) => (
              <div key={t.term} className="py-2.5">
                <dt className="text-sm font-bold">{t.term}</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-muted">{t.def}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="hero-glow rounded-2xl border border-line p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold">
            <Icon name="target" size={16} className="text-brand" /> Where you'll use this
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">Round {round.id}</p>
          <p className="mt-1 text-sm font-semibold leading-snug">{round.headline}</p>
          <LinkButton href="/simulate" variant="outline" size="sm" className="mt-4 w-full">
            Open the simulation
          </LinkButton>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-extrabold">Your path</span>
            <span className="num font-bold text-brand">
              {done}/{LESSONS.length}
            </span>
          </div>
          <Progress value={(done / LESSONS.length) * 100} className="mt-2" />
          <p className="mt-2 text-xs text-muted">Lessons completed</p>
        </div>
      </div>
    </aside>
  );
}

function IntroStep({ lesson }: { lesson: Lesson }) {
  return (
    <div>
      <Eyebrow>Introduction</Eyebrow>
      <p className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{lesson.hook}</p>
      <div className="mt-4 space-y-3 text-fg/90">
        {lesson.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <h3 className="mt-8 mb-3 text-xs font-bold uppercase tracking-wider text-muted">Key terms</h3>
      <dl className="grid gap-3 sm:grid-cols-3">
        {lesson.terms.map((t) => (
          <div key={t.term} className="rounded-xl border border-line bg-surface p-4">
            <dt className="font-bold text-brand">{t.term}</dt>
            <dd className="mt-1 text-sm text-muted">{t.def}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function VisualStep({ visual }: { visual: Visual }) {
  return (
    <div>
      <Eyebrow>Visual explanation</Eyebrow>
      <h2 className="mt-1 mb-6 text-2xl font-bold">{visual.title}</h2>
      {visual.kind === "flow" && <FlowVisual steps={visual.steps} />}
      {visual.kind === "compare" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[visual.left, visual.right].map((side) => (
            <div
              key={side.title}
              className={cx(
                "lift rounded-xl border p-5",
                side.tone === "good" ? "border-up/40 bg-up-soft" : side.tone === "bad" ? "border-down/40 bg-down-soft" : "border-line bg-surface",
              )}
            >
              <p className="text-lg font-extrabold">{side.title}</p>
              <ul className="stagger mt-3 space-y-2 text-sm">
                {side.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {visual.kind === "bars" && (
        <>
          <p className="mb-4 text-sm text-muted">Unit: {visual.unit}</p>
          <Bars items={visual.bars} />
        </>
      )}
    </div>
  );
}

/** Click a stage (or press Play) to walk through the chain one link at a time. */
function FlowVisual({ steps }: { steps: { label: string; detail: string }[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (active >= last) setPlaying(false);
      else setActive(active + 1);
    }, 1400);
    return () => clearTimeout(t);
  }, [playing, active, last]);

  return (
    <div>
      <ol className="grid gap-3 md:grid-cols-5">
        {steps.map((s, i) => {
          const on = i === active;
          const past = i < active;
          return (
            <li key={s.label} className="relative">
              <button
                type="button"
                aria-current={on ? "step" : undefined}
                onClick={() => {
                  setPlaying(false);
                  setActive(i);
                }}
                className={cx(
                  "h-full w-full rounded-xl border p-4 text-left transition duration-300",
                  on ? "-translate-y-1 border-brand bg-brand-soft shadow-card" : past ? "border-brand/40 bg-surface" : "border-line bg-surface opacity-60 hover:opacity-100",
                )}
              >
                <span
                  className={cx(
                    "grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold transition",
                    on || past ? "bg-brand text-on-brand" : "bg-surface-2 text-muted",
                    on && "animate-pop",
                  )}
                >
                  {past ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <p className="mt-2 font-bold">{s.label}</p>
                <p className="mt-1 text-sm text-muted">{s.detail}</p>
              </button>
              {i < last && (
                <span className={cx("absolute -right-3 top-1/2 hidden -translate-y-1/2 transition md:block", past ? "text-brand" : "text-line-strong")} aria-hidden="true">
                  <Icon name="chevronRight" size={18} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" disabled={active === 0} onClick={() => setActive(active - 1)} aria-label="Previous stage">
          <Icon name="arrowLeft" size={14} />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (active >= last) setActive(0);
            setPlaying((p) => !p);
          }}
        >
          <Icon name={playing ? "pause" : active >= last ? "refresh" : "play"} size={14} />
          {playing ? "Pause" : active >= last ? "Replay" : "Play the chain"}
        </Button>
        <Button size="sm" variant="outline" disabled={active === last} onClick={() => setActive(active + 1)} aria-label="Next stage">
          <Icon name="arrowRight" size={14} />
        </Button>
        <span className="text-xs text-muted">
          Stage {active + 1} of {steps.length}
        </span>
      </div>
    </div>
  );
}

/** Reveals a worked example one line at a time, so the learner can predict the next number. */
function RevealSteps({ steps }: { steps: { label: string; value: string }[] }) {
  const [shown, setShown] = useState(1);
  const all = shown >= steps.length;
  return (
    <div className="mt-6">
      <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {steps.slice(0, shown).map((s, i) => (
          <li key={s.label} className="animate-rise flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold">
              <span className="mr-2 text-brand">{i + 1}.</span>
              {s.label}
            </span>
            <span className="num font-bold">{s.value}</span>
          </li>
        ))}
      </ol>
      {!all && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShown(shown + 1)}>
            Show step {shown + 1} <Icon name="arrowRight" size={14} />
          </Button>
          <button type="button" onClick={() => setShown(steps.length)} className="text-sm font-semibold text-muted hover:text-fg hover:underline">
            Show all
          </button>
          <span className="text-xs text-muted">Try to work out the next line before you reveal it.</span>
        </div>
      )}
    </div>
  );
}

function ExampleStep({ lesson }: { lesson: Lesson }) {
  const ex = lesson.example;
  return (
    <div>
      <Eyebrow>Worked example</Eyebrow>
      <h2 className="mt-1 text-2xl font-bold">{ex.title}</h2>
      <p className="mt-2 text-muted">{ex.setup}</p>
      <RevealSteps steps={ex.steps} />
      <div className="mt-5">
        <Callout title="Takeaway">{ex.takeaway}</Callout>
      </div>
    </div>
  );
}

function ApplyStep({ lesson, state }: { lesson: Lesson; state: AppState }) {
  const r = getRound(lesson.applyRound);
  // Reaching this step completes the lesson; filter it anyway so the first render can't list it.
  const others = missingFor(r.id, state).filter((l) => l.slug !== lesson.slug);
  const played = state.sim?.rounds.some((x) => x.round === r.id);
  return (
    <div>
      <Eyebrow>Apply it</Eyebrow>
      <h2 className="mt-1 text-2xl font-bold">Put it to work in Round {r.id}</h2>
      <p className="mt-2 text-muted">{lesson.applyText}</p>
      <div className="mt-6 rounded-xl border border-brand/30 bg-brand-soft p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-brand">
          Round {r.id} · {r.title}
        </p>
        <p className="mt-1 text-lg font-bold">{r.headline}</p>
        <p className="mt-2 text-sm text-muted">{r.objective}</p>
        {others.length > 0 && !played ? (
          <div className="mt-4 rounded-xl border border-line bg-card p-4">
            <p className="text-sm font-bold">
              Round {r.id} also uses {others.map((l) => l.title).join(" and ")}.
            </p>
            <p className="mt-1 text-sm text-muted">
              Finish {others.length === 1 ? "it" : "them"} first (about {others.reduce((n, l) => n + l.minutes, 0)} min) so nothing on the screen is new to you.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <LinkButton href={`/learn/${others[0].slug}`} size="sm">
                Next: {others[0].title} <Icon name="arrowRight" size={14} />
              </LinkButton>
              <Link href="/simulate" className="text-sm font-semibold text-muted hover:text-fg hover:underline">
                Go to the simulation anyway
              </Link>
            </div>
          </div>
        ) : (
          <LinkButton href="/simulate" variant="primary" size="sm" className="mt-4">
            {played ? "Review the simulation" : "You're ready: go to the simulation"} <Icon name="arrowRight" size={14} />
          </LinkButton>
        )}
      </div>
    </div>
  );
}

function DoneStep({ lesson, state }: { lesson: Lesson; state: AppState }) {
  const next = nextLesson(lesson.slug);
  const round = lesson.applyRound;
  const ready = missingFor(round, state).length === 0 && !state.sim?.rounds.some((x) => x.round === round);
  const done = LESSONS.filter((l) => state.lessons[l.slug]?.status === "completed").length;
  return (
    <div className="relative -m-2 overflow-hidden p-2 text-center">
      <Confetti />
      <Ring value={done / LESSONS.length} size={96} stroke={7} className="mx-auto text-up">
        <span className="animate-pop-in grid size-14 place-items-center rounded-full bg-up-soft text-up" style={{ animationDelay: "0.6s" }}>
          <Icon name="check" size={28} />
        </span>
      </Ring>
      <h2 className="mt-4 text-2xl font-extrabold">Lesson complete</h2>
      <p className="mt-1 text-sm text-muted">
        <span className="num font-bold text-fg">
          <AnimatedNumber value={done} countFrom={Math.max(0, done - 1)} format={String} />
        </span>{" "}
        of {LESSONS.length} lessons finished
      </p>
      <ul className="stagger mx-auto mt-5 max-w-md space-y-2 text-left">
        {lesson.recap.map((r) => (
          <li key={r} className="flex gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-up" />
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {next ? (
          <LinkButton href={`/learn/${next.slug}`}>
            Next: {next.title} <Icon name="arrowRight" size={16} />
          </LinkButton>
        ) : (
          <LinkButton href="/simulate">
            Head to the simulation <Icon name="arrowRight" size={16} />
          </LinkButton>
        )}
        {ready && next && (
          <LinkButton href="/simulate" variant="secondary">
            You're ready for Round {round} <Icon name="play" size={14} />
          </LinkButton>
        )}
        <LinkButton href="/learn" variant="outline">
          Back to library
        </LinkButton>
      </div>
    </div>
  );
}
