"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LESSON, LESSONS } from "@/content/lessons";
import { COMPANY, CONFIG } from "@/content/market";
import { getRound } from "@/content/rounds";
import { CHECK_LESSON, STEP } from "@/content/path";
import { GlossaryText, Term } from "@/components/glossary";
import { ScoringExplainer } from "@/components/scoring-explainer";
import { charge, previewOrders, whatIf } from "@/lib/engine";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import { unrealized } from "@/lib/portfolio";
import { actions, useApp } from "@/lib/store";
import type { Ticker } from "@/lib/types";
import { Icon, type IconName } from "@/components/icons";
import { Question } from "@/components/question";
import { RoundProgress } from "@/components/sim-ui";
import { Badge, Button, Card, LinkButton, Skeleton } from "@/components/ui";
import { AnimatedNumber } from "@/components/motion";

type Tone = "up" | "brand" | "down" | "neutral";

function verdictOf(score: number, labels: [string, string, string]): { label: string; tone: Tone } {
  return score >= 80 ? { label: labels[0], tone: "up" } : score >= 55 ? { label: labels[1], tone: "brand" } : { label: labels[2], tone: "down" };
}

function JudgeCard({ icon, question, label, tone, score, children }: { icon: IconName; question: string; label: string; tone: Tone; score?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-bold">
        <Icon name={icon} size={16} className="text-brand" /> {question}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={tone}>{label}</Badge>
        {score !== undefined && (
          <span className="num text-xs text-muted">
            <Term id="rubric-score">Rubric score</Term> <AnimatedNumber value={score} countFrom={0} format={String} />/100
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </div>
  );
}

export function Debrief({ roundId, inline = false }: { roundId: number; inline?: boolean }) {
  const { state, hydrated } = useApp();
  const router = useRouter();
  const sim = state.sim;
  const result = sim?.rounds.find((r) => r.round === roundId);

  useEffect(() => {
    if (hydrated && result) actions.viewDebrief(roundId);
  }, [hydrated, result, roundId]);

  if (!hydrated) return <Skeleton className="h-[600px]" />;
  if (!sim || !result) {
    return (
      <Card className="mx-auto max-w-lg text-center">
        <Icon name="lock" size={28} className="mx-auto text-brand" />
        <h1 className="mt-3 text-xl font-extrabold">Round {roundId} hasn't been played yet</h1>
        <p className="mt-1 text-muted">Debriefs unlock once you confirm your decision for that round.</p>
        <LinkButton href="/simulate" className="mt-4">
          Go to the simulation
        </LinkButton>
      </Card>
    );
  }

  const round = getRound(roundId);
  const path = round.paths.find((p) => p.id === result.pathId)!;
  const rationale = round.rationales.find((r) => r.id === result.rationaleId);
  const risk = round.risks.find((r) => r.id === result.riskId);
  const change = result.valueAfter - result.valueBefore;
  const isCurrent = sim.status === "active" && sim.currentRound === roundId;
  const isLast = roundId === CONFIG.totalRounds;

  // Rebuild the post-trade ledger to report this round's realised P&L, charges and unrealised P&L.
  const after = previewOrders(result.ledgerBefore, result.orders, result.pricesBefore).ledger;
  const realisedThisRound = after.realized - result.ledgerBefore.realized;
  const chargesThisRound = after.charges - result.ledgerBefore.charges;
  const unrealNow = unrealized(after, result.pricesAfter);

  const moved = [...new Set(round.outcome.flatMap((s) => Object.keys(s.moves)))] as Ticker[];
  const reasoning = verdictOf(result.scores.reasoning, ["Well-reasoned", "Partly reasoned", "Weak reasoning"]);
  const riskV = verdictOf(result.scores.risk, ["Strong", "Partial", "Missed the key risk"]);
  const checked = result.checkAnswer !== null;
  const lessons = LESSONS.filter((l) => l.applyRound === roundId);
  const conceptLessons = lessons.length ? lessons : [LESSON[round.lessonSlug]];
  const checkLesson = LESSON[CHECK_LESSON[roundId] ?? round.lessonSlug];

  const next = () => {
    actions.nextRound();
    window.scrollTo({ top: 0 });
    if (isLast) router.push("/report");
    else if (!inline) router.push("/simulate/play");
  };

  return (
    <div className="space-y-6">
      <div>
        {!inline && (
          <Link href="/simulate" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
            <Icon name="arrowLeft" size={14} /> Lobby
          </Link>
        )}
        <RoundProgress current={roundId} done={sim.rounds.length} />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-brand">
          Round {roundId} debrief · {round.title}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{round.headline}</h1>
      </div>

      <Card>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="check" size={18} className="text-brand" /> Your decision
        </h2>
        {result.orders.length === 0 ? (
          <p className="mt-3 rounded-xl border border-line bg-surface p-3 text-sm">You held, no trades this round.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {result.orders.map((o, i) => {
              const v = o.quantity * result.pricesBefore[o.ticker];
              return (
                <li key={i} className="num flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
                  <Badge tone={o.side === "buy" ? "up" : "down"}>{o.side.toUpperCase()}</Badge>
                  <span>
                    <span className="font-bold">
                      {o.quantity} × {o.ticker}
                    </span>
                    <span className="block text-xs text-muted">
                      {rupees(v)} + {rupees(charge(v))} charges
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {rationale && (
          <p className="mt-3 text-sm">
            <span className="text-muted">Your reasoning: </span>"{rationale.text}"
          </p>
        )}
        <p className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-muted">
            <Term id="decision-path">Classified as</Term>:
          </span>{" "}
          <Badge tone="brand">{path.label}</Badge>
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="up" size={18} className="text-brand" /> What happened next
          </h2>
          <ol className="mt-4 space-y-3">
            {round.outcome.map((s) => (
              <li key={s.label} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-brand">{s.label}</p>
                <p className="mt-1 font-bold">{s.headline}</p>
                <p className="mt-1 text-sm text-muted">{s.detail}</p>
              </li>
            ))}
          </ol>
          <p className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Simulated price changes since your decision</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="py-2">Stock</th>
                  <th className="py-2 text-right">Before</th>
                  <th className="py-2 text-right">After</th>
                  <th className="py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {moved.map((t) => {
                  const b = result.pricesBefore[t];
                  const a = result.pricesAfter[t];
                  const c = share(a - b, b);
                  return (
                    <tr key={t} className="num">
                      <td className="py-2 font-bold">
                        {t} {(after.holdings[t]?.quantity ?? 0) > 0 && <Badge tone="up">Held</Badge>}
                      </td>
                      <td className="py-2 text-right">{rupees(b)}</td>
                      <td className="py-2 text-right">{rupees(a)}</td>
                      <td className={cx("py-2 text-right font-bold", toneOf(c))}>{pct(c, { signed: true })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <details className="mt-3 rounded-xl border border-line bg-surface p-3 text-sm">
            <summary className="cursor-pointer font-semibold">Why each price moved</summary>
            <ul className="mt-2 space-y-1.5">
              {round.outcome.flatMap((s) =>
                Object.keys(s.moves).map((t) => (
                  <li key={`${s.label}-${t}`}>
                    <span className="font-semibold">{COMPANY[t as Ticker].name}</span>
                    <span className="text-muted">
                      {round.outcome.length > 1 ? ` (${s.label})` : ""}: {s.reasons[t as Ticker]}
                    </span>
                  </li>
                )),
              )}
            </ul>
          </details>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="chart" size={18} className="text-brand" /> Your portfolio
          </h2>
          <dl className="num mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Value at decision time</dt>
              <dd className="font-bold">{rupees(result.valueBefore)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Value after the outcome</dt>
              <dd className="font-bold">{rupees(result.valueAfter)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2.5">
              <dt className="font-bold">Change from your decision</dt>
              <dd className={cx("font-extrabold", toneOf(change))}>
                {rupees(change, { signed: true })} ({pct(share(change, result.valueBefore), { signed: true })})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Realised P&L this round</dt>
              <dd className={cx("font-semibold", toneOf(realisedThisRound))}>{rupees(realisedThisRound, { signed: true })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Unrealised P&L on holdings now</dt>
              <dd className={cx("font-semibold", toneOf(unrealNow))}>{rupees(unrealNow, { signed: true })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Charges paid this round</dt>
              <dd className="font-semibold">{rupees(chargesThisRound)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Change from your decision includes charges. Realised P&L is measured against your average cost; unrealised P&L covers every share you still hold.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-extrabold">How to judge this round</h2>
        <p className="mt-1 text-sm text-muted">A good decision can lose money and a poor one can make money. These four questions are assessed separately.</p>
        <div className="mt-3">
          <ScoringExplainer />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <JudgeCard
            icon="up"
            question="Was the outcome profitable?"
            label={change > 0 ? "Profitable" : change < 0 ? "Lost money" : "Flat"}
            tone={change > 0 ? "up" : change < 0 ? "down" : "neutral"}
          >
            Your portfolio {change >= 0 ? "gained" : "lost"} {rupees(Math.abs(change))} after your decision. This reflects the scenario's outcome, not by itself
            the quality of your thinking.
          </JudgeCard>
          <JudgeCard icon="target" question="Was the decision reasonable given what you knew?" label={reasoning.label} tone={reasoning.tone} score={result.scores.reasoning}>
            {path.feedback}
            {rationale && ` On your reasoning: ${rationale.feedback}`}
          </JudgeCard>
          <JudgeCard icon="shield" question="Did you recognise the risks?" label={riskV.label} tone={riskV.tone} score={result.scores.risk}>
            {risk ? `You flagged: "${risk.text}", ${risk.feedback}` : "No risk recorded."}
          </JudgeCard>
          <JudgeCard
            icon="book"
            question="Did you understand the concept?"
            label={!checked ? "Answer the check below" : result.scores.comprehension === 100 ? "Understood" : "Worth revisiting"}
            tone={!checked ? "neutral" : result.scores.comprehension === 100 ? "up" : "down"}
          >
            {!checked
              ? "Complete the knowledge check at the end of this debrief."
              : result.scores.comprehension === 100
                ? "You answered the knowledge check correctly on the first try."
                : "Your first answer missed. The explanation below shows why."}
          </JudgeCard>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">
          <p className="font-bold">Trade-offs</p>
          <p className="mt-1 text-muted">{path.tradeOff}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">The concept</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {round.concepts.map((c) => (
              <Badge key={c} tone="brand">
                {c}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-fg/90">
            <GlossaryText text={round.why} />
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {conceptLessons.map((l) => (
              <Link key={l.slug} href={`/learn/${l.slug}`} className="font-semibold text-brand hover:underline">
                {l.title} <Icon name="arrowRight" size={14} className="inline" />
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold">Risks you may have overlooked</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {round.watch.map((w) => (
              <li key={w} className="flex gap-2">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-brand" />
                {w}
              </li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-bold">Scenario assumptions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {round.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Simplified scenarios isolate one mechanism. They don't reproduce the full complexity of real markets.</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-extrabold">Alternative decisions</h2>
        <p className="mt-1 text-sm text-muted">
          Replayed from your exact starting position with the same prices. This uses hindsight you didn't have. Compare the trade-offs, not just the numbers.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted">
                <th className="py-2">Decision</th>
                <th className="py-2 text-right">Value after</th>
                <th className="py-2 text-right">Change</th>
                <th className="py-2 text-right">vs yours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="num bg-brand-soft/60">
                <td className="py-2.5 pl-2">
                  <span className="font-bold">Your decision</span>
                  <span className="block text-xs text-muted">{path.label}</span>
                </td>
                <td className="py-2.5 text-right font-semibold">{rupees(result.valueAfter)}</td>
                <td className={cx("py-2.5 text-right font-semibold", toneOf(change))}>{rupees(change, { signed: true })}</td>
                <td className="py-2.5 pr-2 text-right text-muted">-</td>
              </tr>
              {round.quickActions.map((qa) => {
                const w = whatIf(result, qa);
                const diff = w.valueAfter - result.valueAfter;
                return (
                  <tr key={qa.id} className="num">
                    <td className="py-2.5 pl-2">
                      <span className="font-semibold">{qa.label}</span>
                      <span className="block text-xs text-muted">{w.applicable ? qa.description : "Not possible from your position"}</span>
                    </td>
                    <td className="py-2.5 text-right">{w.applicable ? rupees(w.valueAfter) : "-"}</td>
                    <td className={cx("py-2.5 text-right", toneOf(w.change))}>{w.applicable ? rupees(w.change, { signed: true }) : "-"}</td>
                    <td className={cx("py-2.5 pr-2 text-right font-semibold", toneOf(diff))}>{w.applicable ? rupees(diff, { signed: true }) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-extrabold">Knowledge check</h2>
        <Question
          q={round.check}
          answered={result.checkAnswer}
          onAnswer={(a) => actions.answerRoundCheck(roundId, a)}
          review={
            <Link href={`/learn/${checkLesson.slug}?step=${STEP.example}`} className="font-semibold text-brand hover:underline">
              Review this in {checkLesson.title} <Icon name="arrowRight" size={14} className="inline" />
            </Link>
          }
        />
      </Card>

      {isCurrent ? (
        <div className="sticky bottom-20 z-30 md:bottom-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card/95 p-4 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className={cx("flex items-center gap-2 text-sm font-semibold", checked ? "text-up" : "text-muted")}>
              <Icon name={checked ? "check" : "clock"} size={16} />
              {checked ? "Debrief complete." : "Answer the knowledge check to continue."}
            </p>
            <Button size="lg" onClick={next} disabled={!checked}>
              {isLast ? "Finish & see your report" : `Continue to Round ${roundId + 1}`} <Icon name="arrowRight" size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/simulate" variant="outline">
            Back to the lobby
          </LinkButton>
          {sim.status === "active" && <LinkButton href="/simulate/play">Go to Round {sim.currentRound}</LinkButton>}
          {sim.status === "complete" && <LinkButton href="/report">See your report</LinkButton>}
        </div>
      )}
    </div>
  );
}
