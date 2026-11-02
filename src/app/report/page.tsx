"use client";

import Link from "next/link";
import { COMPANY, CONFIG, PROFILES } from "@/content/market";
import { getRound } from "@/content/rounds";
import { band, predictionResult } from "@/lib/engine";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import { portfolioValue, totalPnl, unrealized } from "@/lib/portfolio";
import { buildReport } from "@/lib/report";
import { useApp } from "@/lib/store";
import type { RoundResult } from "@/lib/types";
import { ValueChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { HoldingsTable } from "@/components/sim-ui";
import { ScoringExplainer } from "@/components/scoring-explainer";
import { Term } from "@/components/glossary";
import { Card, Eyebrow, LinkButton, PageHeader, Progress, Skeleton, Stat } from "@/components/ui";
import { AnimatedNumber } from "@/components/motion";

function toneClass(score: number) {
  const t = band(score).tone;
  return t === "up" ? "text-up" : t === "down" ? "text-down" : "text-brand";
}

export default function ReportPage() {
  const { state, hydrated } = useApp();
  const sim = state.sim;
  const report = buildReport(state);
  const complete = sim?.status === "complete";

  if (!hydrated) return <Skeleton className="h-[600px]" />;

  return (
    <>
      <PageHeader eyebrow="Report" title={complete ? "Your final report" : "Your skill snapshot"}>
        {complete
          ? "How you decided, not just how much you made. Scores come from your reasoning, risk awareness, diversification, consistency and understanding."
          : "Your full report unlocks after Round 10. Here's how you're tracking so far."}
      </PageHeader>

      {!complete && (
        <Card className="mb-6 flex flex-col gap-4 border-brand/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="flex items-center gap-2 font-bold">
              <Icon name="lock" size={16} className="text-brand" /> {sim ? `${sim.rounds.length} of ${CONFIG.totalRounds} rounds completed` : "Simulation not started"}
            </p>
            <Progress value={share(sim?.rounds.length ?? 0, CONFIG.totalRounds)} className="mt-3 max-w-md" />
          </div>
          <LinkButton href={sim ? "/simulate" : "/simulate"}>
            {sim ? "Continue the simulation" : "Start the simulation"} <Icon name="arrowRight" size={16} />
          </LinkButton>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <Eyebrow>Overall</Eyebrow>
          {report.overall === null ? (
            <p className="mt-3 text-muted">Answer a quiz or play a round to see your first scores.</p>
          ) : (
            <div className="mt-2 flex items-end gap-3">
              <p className={cx("num text-6xl font-extrabold tracking-tight", toneClass(report.overall))}>{report.overall}</p>
              <div className="pb-2">
                <p className="font-bold">{band(report.overall).label}</p>
                <p className="text-xs text-muted">out of 100</p>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-muted">Bands: Strong ≥ 80 · Developing 55–79 · Needs work below 55.</p>
          {sim && <p className="mt-1 text-xs text-muted">Risk profile: {PROFILES[sim.profile].name}</p>}
        </Card>

        <Card>
          <h2 className="text-lg font-extrabold">Five skills</h2>
          <ul className="mt-4 space-y-4">
            {report.dims.map((d) => (
              <li key={d.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold">{d.id === "consistency" ? <Term id="consistency">{d.name}</Term> : d.name}</span>
                  <span className={cx("num font-extrabold", d.score === null ? "text-muted" : toneClass(d.score))}>{d.score === null ? "-" : <AnimatedNumber value={d.score} countFrom={0} format={String} />}</span>
                </div>
                <Progress value={d.score ?? 0} tone={d.score === null ? "brand" : band(d.score).tone === "up" ? "up" : band(d.score).tone === "down" ? "down" : "brand"} className="mt-1.5" />
                <p className="mt-1 text-xs text-muted">
                  {d.description} {d.samples > 0 && <span>({d.samples} data point{d.samples === 1 ? "" : "s"})</span>}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {sim && <Calibration rounds={sim.rounds} />}

      <div className="mt-6">
        <ScoringExplainer />
      </div>

      {sim && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Portfolio value" value={rupees(portfolioValue(sim.ledger, sim.prices), { whole: true })} />
            <Stat
              label="Total P&L"
              value={rupees(totalPnl(sim.ledger, sim.prices), { signed: true, whole: true })}
              tone={toneOf(totalPnl(sim.ledger, sim.prices))}
              sub={pct(share(totalPnl(sim.ledger, sim.prices), CONFIG.startingCash), { signed: true })}
            />
            <Stat label="Realised / unrealised" value={`${rupees(sim.ledger.realized, { whole: true })}`} sub={`Unrealised ${rupees(unrealized(sim.ledger, sim.prices), { signed: true, whole: true })}`} />
            <Stat label="Charges paid" value={rupees(sim.ledger.charges)} sub={`${sim.ledger.transactions.length} orders`} />
          </div>

          <Card className="reveal">
            <h2 className="text-lg font-extrabold">Portfolio value by round</h2>
            <p className="text-xs text-muted">Dashed line: your ₹1,00,000 starting capital.</p>
            <div className="mt-3">
              <ValueChart points={sim.valueHistory} baseline={CONFIG.startingCash} />
            </div>
          </Card>

          <Card className="reveal">
            <h2 className="text-lg font-extrabold">Round by round</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted">
                    <th className="py-2">Round</th>
                    <th className="py-2">Verdict</th>
                    <th className="py-2 text-right">Reasoning</th>
                    <th className="py-2 text-right">Risk</th>
                    <th className="py-2 text-right">Change</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sim.rounds.map((r) => {
                    const round = getRound(r.round);
                    const ch = r.valueAfter - r.valueBefore;
                    return (
                      <tr key={r.round} className="num">
                        <td className="py-2.5 font-bold">
                          {r.round}. {round.title}
                        </td>
                        <td className="py-2.5">{round.paths.find((p) => p.id === r.pathId)?.label}</td>
                        <td className={cx("py-2.5 text-right font-bold", toneClass(r.scores.reasoning))}>{r.scores.reasoning}</td>
                        <td className={cx("py-2.5 text-right font-bold", toneClass(r.scores.risk))}>{r.scores.risk}</td>
                        <td className={cx("py-2.5 text-right font-semibold", toneOf(ch))}>{rupees(ch, { signed: true, whole: true })}</td>
                        <td className="py-2.5 text-right">
                          <Link href={`/simulate/review/${r.round}`} className="font-semibold text-brand hover:underline">
                            Debrief
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {sim.rounds.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted">
                        No rounds played yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="reveal grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-lg font-extrabold">Current holdings</h2>
              <HoldingsTable ledger={sim.ledger} prices={sim.prices} />
            </Card>
            <Card>
              <h2 className="mb-3 text-lg font-extrabold">Order history</h2>
              {sim.ledger.transactions.length === 0 ? (
                <p className="text-sm text-muted">No orders yet.</p>
              ) : (
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted">
                        <th className="py-2">R</th>
                        <th className="py-2">Order</th>
                        <th className="py-2 text-right">Value</th>
                        <th className="py-2 text-right">Realised</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {[...sim.ledger.transactions].reverse().map((t) => (
                        <tr key={t.id} className="num">
                          <td className="py-2 text-muted">{t.round}</td>
                          <td className="py-2">
                            <span className={t.side === "buy" ? "font-bold text-up" : "font-bold text-down"}>{t.side === "buy" ? "Buy" : "Sell"}</span> {t.quantity}{" "}
                            {COMPANY[t.ticker].name} @ {rupees(t.price)}
                          </td>
                          <td className="py-2 text-right">{rupees(t.value, { whole: true })}</td>
                          <td className={cx("py-2 text-right", t.side === "sell" ? toneOf(t.realized) : "text-muted")}>
                            {t.side === "sell" ? rupees(t.realized, { signed: true, whole: true }) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

/** How well the learner's optional calls matched what happened. Shown alongside the five skills, not scored into them. */
function Calibration({ rounds }: { rounds: RoundResult[] }) {
  const calls = rounds.flatMap((r) => {
    const c = predictionResult(r);
    return c ? [{ round: r.round, c }] : [];
  });
  if (!calls.length) return null;
  const avgMiss = calls.reduce((s, x) => s + x.c.miss, 0) / calls.length;
  const right = calls.filter((x) => x.c.direction).length;
  return (
    <Card className="reveal mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="gauge" size={18} className="text-brand" /> Your calls
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Calibration: how close your guesses were before each round played out. Even professionals miss often, which is why sizing and diversification matter
            more than being right.
          </p>
        </div>
        <dl className="num flex gap-6">
          <div>
            <dt className="text-xs text-muted">Right direction</dt>
            <dd className="text-2xl font-extrabold">
              <AnimatedNumber value={right} countFrom={0} format={String} />
              <span className="text-base text-muted">/{calls.length}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Average miss</dt>
            <dd className="text-2xl font-extrabold">{pct(avgMiss, { digits: 1 })}</dd>
          </div>
        </dl>
      </div>
      <ul className="stagger mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {calls.map(({ round, c }) => (
          <li key={round} className={cx("rounded-xl border p-3 text-sm", c.close ? "border-up/50 bg-up-soft" : c.direction ? "border-line bg-surface" : "border-down/40 bg-down-soft")}>
            <p className="text-xs font-bold text-muted">
              R{round} · {c.ticker}
            </p>
            <p className="num mt-1">
              <span className={cx("font-bold", toneOf(c.guess))}>{pct(c.guess, { signed: true, digits: 1 })}</span>
              <span className="text-muted"> vs </span>
              <span className={cx("font-bold", toneOf(c.actual))}>{pct(c.actual, { signed: true, digits: 1 })}</span>
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
