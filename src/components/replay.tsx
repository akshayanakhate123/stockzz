"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COMPANY, TICKERS } from "@/content/market";
import { getRound } from "@/content/rounds";
import { applyMoves, predictionResult, previewOrders } from "@/lib/engine";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import type { Ledger, Prices, RoundResult, Ticker } from "@/lib/types";
import { Icon } from "./icons";
import { Burst, prefersReducedMotion } from "./motion";
import { Badge, Button, Card } from "./ui";

/** Ticks per outcome step, and how long one step takes at 1x. */
export const TICKS = 60;
const STEP_MS = 4200;
/** Share of each step before the headline moves prices, so the news lands first. */
const LAG = 0.14;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ease = (u: number) => (u <= LAG ? 0 : 1 - Math.pow(1 - (u - LAG) / (1 - LAG), 3));

/**
 * Intraday-style paths from the decision prices to each step's scripted close. The wiggle is
 * seeded per round and stock so a replay looks the same every time, and it fades to zero at the
 * end of each step so every step closes exactly on the engine's prices.
 */
export function buildPaths(roundId: number, start: Prices) {
  const round = getRound(roundId);
  const series = Object.fromEntries(TICKERS.map((t) => [t, [start[t]]])) as Record<Ticker, number[]>;
  let prev = start;
  round.outcome.forEach((step, si) => {
    const next = applyMoves(prev, step.moves);
    TICKERS.forEach((t, ti) => {
      const r = rng(roundId * 1009 + si * 97 + ti * 13 + 1);
      const a = prev[t];
      const b = next[t];
      const amp = a * 0.0035 + Math.abs(b - a) * 0.12;
      let drift = 0;
      for (let i = 1; i <= TICKS; i++) {
        const u = i / TICKS;
        drift = drift * 0.82 + (r() - 0.5) * 2;
        const fade = Math.sin(Math.PI * u);
        series[t].push(Math.round(a + (b - a) * ease(u) + drift * amp * fade));
      }
    });
    prev = next;
  });
  return series;
}

export const valueAt = (l: Ledger, prices: (t: Ticker) => number) =>
  l.cash + (Object.entries(l.holdings) as [Ticker, { quantity: number }][]).reduce((s, [t, h]) => s + h.quantity * prices(t), 0);

export function MarketReplay({ result, onDone }: { result: RoundResult; onDone: () => void }) {
  const round = getRound(result.round);
  const steps = round.outcome;
  const total = steps.length * TICKS;
  const after = useMemo(() => previewOrders(result.ledgerBefore, result.orders, result.pricesBefore).ledger, [result]);
  const paths = useMemo(() => buildPaths(result.round, result.pricesBefore), [result]);
  const values = useMemo(() => Array.from({ length: total + 1 }, (_, i) => valueAt(after, (t) => paths[t][i])), [after, paths, total]);

  const [frame, setFrame] = useState(() => (prefersReducedMotion() ? total : 0));
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const pos = useRef(frame);
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!playing || pos.current >= total) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      pos.current = Math.min(total, pos.current + ((now - last) / STEP_MS) * TICKS * speed);
      last = now;
      setFrame(pos.current);
      if (pos.current < total) raf = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, total]);

  const i = Math.floor(frame);
  const finished = i >= total;
  useEffect(() => {
    if (finished) doneRef.current?.focus({ preventScroll: true });
  }, [finished]);

  const stepIdx = Math.min(steps.length - 1, Math.floor(i / TICKS));
  const step = steps[stepIdx];
  const value = values[i];
  const change = value - result.valueBefore;

  const held = TICKERS.filter((t) => (after.holdings[t]?.quantity ?? 0) > 0);
  const moved = [...new Set(steps.flatMap((s) => Object.keys(s.moves)))] as Ticker[];
  const rows = [...new Set([...(result.prediction ? [result.prediction.ticker] : []), ...moved, ...held])].slice(0, 7);
  const call = predictionResult(result);

  const restart = () => {
    pos.current = 0;
    setFrame(0);
    setPlaying(true);
  };
  const skip = () => {
    pos.current = total;
    setFrame(total);
    setPlaying(false);
  };

  // Portfolio chart scaled once over the whole replay so the axis doesn't jump around.
  const W = 640;
  const H = 220;
  const pad = { l: 8, r: 8, t: 18, b: 22 };
  const lo = Math.min(result.valueBefore, ...values);
  const hi = Math.max(result.valueBefore, ...values);
  const extra = (hi - lo) * 0.15 || hi * 0.004 || 1;
  const x = (k: number) => pad.l + (k / total) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo + extra) / (hi - lo + 2 * extra)) * (H - pad.t - pad.b);
  const line = values
    .slice(0, i + 1)
    .map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const color = change >= 0 ? "var(--up)" : "var(--down)";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand">
            <span className="relative flex size-2.5">
              {!finished && <span className="absolute inset-0 animate-ping rounded-full bg-up" />}
              <span className={cx("relative size-2.5 rounded-full", finished ? "bg-muted" : "bg-up")} />
            </span>
            {finished ? "Market closed" : "Market open"} · Round {round.id}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{round.title}: what happened next</h1>
          <p className="mt-1 text-sm text-muted">Your decision is locked in. Watch the scenario play out, then see the debrief.</p>
        </div>
        <div className="flex items-center gap-2">
          {!finished && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
                <Icon name={playing ? "pause" : "play"} size={15} />
                {playing ? "Pause" : "Play"}
              </Button>
              <div role="radiogroup" aria-label="Replay speed" className="flex rounded-xl border border-line bg-surface p-0.5">
                {[1, 2, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={speed === n}
                    onClick={() => setSpeed(n)}
                    className={cx(
                      "num rounded-lg px-2.5 py-1 text-xs font-bold transition",
                      speed === n ? "bg-brand text-on-brand" : "text-muted hover:text-fg",
                    )}
                  >
                    {n}x
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={skip}>
                <Icon name="skip" size={15} /> Skip
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Step timeline */}
      <div className="flex gap-1.5" aria-hidden="true">
        {steps.map((s, k) => {
          const fill = Math.max(0, Math.min(1, (frame - k * TICKS) / TICKS));
          return (
            <div key={s.label} className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-brand" style={{ width: `${fill * 100}%` }} />
              </div>
              <p className={cx("mt-1.5 truncate text-xs font-semibold", k === stepIdx && !finished ? "text-brand" : "text-muted")}>{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          {/* Breaking alert for the current step */}
          <Card key={stepIdx} className="animate-alert overflow-hidden p-0!">
            <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-5 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-strong">
              <Icon name="zap" size={14} /> Update {stepIdx + 1} of {steps.length} · {step.label}
            </div>
            <div className="p-5">
              <p className="text-lg font-extrabold leading-snug">{step.headline}</p>
              <p className="mt-1 text-sm text-muted">{step.detail}</p>
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Your portfolio</p>
                <p className="num text-3xl font-extrabold tracking-tight">{rupees(value)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Since your decision</p>
                <p className={cx("num text-lg font-extrabold", toneOf(change))}>
                  {rupees(change, { signed: true })} <span className="text-sm">({pct(share(change, result.valueBefore), { signed: true })})</span>
                </p>
              </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label={`Portfolio value during the replay, now ${rupees(value)}`}>
              <line x1={pad.l} x2={W - pad.r} y1={y(result.valueBefore)} y2={y(result.valueBefore)} stroke="var(--line-strong)" strokeDasharray="4 5" />
              {steps.slice(1).map((s, k) => (
                <line key={s.label} x1={x((k + 1) * TICKS)} x2={x((k + 1) * TICKS)} y1={pad.t - 8} y2={H - pad.b} stroke="var(--line)" />
              ))}
              {steps.map((s, k) => (
                <text key={s.label} x={x(k * TICKS) + 4} y={H - 6} fontSize={10} fill="var(--muted)" fontWeight={600}>
                  {s.label}
                </text>
              ))}
              <path d={`${line} L${x(i)},${H - pad.b} L${x(0)},${H - pad.b} Z`} fill={color} fillOpacity={0.1} />
              <path d={line} fill="none" stroke={color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={x(i)} cy={y(value)} r={4.5} fill={color} />
              {!finished && <circle cx={x(i)} cy={y(value)} r={4.5} fill={color} className="ping-dot" />}
            </svg>
            <p className="mt-1 text-xs text-muted">
              Dashed line: your value when you confirmed. Simulated, scripted moves with a little noise added for realism.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          {call && (
            <Card className={cx("relative", finished && (call.close ? "border-up/60" : call.direction ? "border-brand/50" : "border-down/50"))}>
              <p className="flex items-center gap-2 text-sm font-bold">
                <Icon name="target" size={16} className="text-brand" /> Your call on {call.ticker}
              </p>
              <div className="num mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-xs text-muted">You guessed</p>
                  <p className={cx("text-xl font-extrabold", toneOf(call.guess))}>{pct(call.guess, { signed: true, digits: 1 })}</p>
                </div>
                <div className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-xs text-muted">{finished ? "It moved" : "Moving now"}</p>
                  <LiveMove from={result.pricesBefore[call.ticker]} now={paths[call.ticker][i]} />
                </div>
              </div>
              {finished && (
                <div className="animate-pop-in relative mt-3 flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm">
                  {call.close && <Burst />}
                  <Icon
                    name={call.close ? "check" : call.direction ? "info" : "x"}
                    size={16}
                    className={call.close ? "text-up" : call.direction ? "text-brand" : "text-down"}
                  />
                  <span>
                    {call.close
                      ? `Spot on, within ${pct(call.miss, { digits: 1 })}.`
                      : call.direction
                        ? `Right direction, off by ${pct(call.miss, { digits: 1 })}.`
                        : `It went the other way. Off by ${pct(call.miss, { digits: 1 })}.`}
                  </span>
                </div>
              )}
            </Card>
          )}

          <Card className="p-3!">
            <h2 className="px-2 pt-1 pb-2 text-lg font-extrabold">Prices</h2>
            <ul className="space-y-1">
              {rows.map((t) => {
                const now = paths[t][i];
                const qty = after.holdings[t]?.quantity ?? 0;
                return (
                  <li key={t} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold">{t}</span>
                        {qty > 0 && <Badge tone="up" className="whitespace-nowrap">{qty} held</Badge>}
                        {round.inNews.includes(t) && <Badge tone="brand">News</Badge>}
                      </span>
                      <span className="block truncate text-xs text-muted">{COMPANY[t].name}</span>
                    </span>
                    <MiniLine series={paths[t]} upto={i} />
                    <span className="num w-24 text-right">
                      <span className="block text-sm font-bold">{rupees(now)}</span>
                      <LiveMove from={result.pricesBefore[t]} now={now} small />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          {finished && (
            <Card className="animate-toast border-brand/50">
              <p className="font-bold">The round is over.</p>
              <p className="mt-1 text-sm text-muted">
                The outcome is only half the story. The debrief judges whether your reasoning and risk call were sound, whatever the price did.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button ref={doneRef} className="cta-pulse" onClick={onDone}>
                  See the debrief <Icon name="arrowRight" size={16} />
                </Button>
                <Button variant="outline" onClick={restart}>
                  <Icon name="refresh" size={15} /> Replay
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveMove({ from, now, small }: { from: number; now: number; small?: boolean }) {
  const c = share(now - from, from);
  return (
    <span className={cx("flex items-center gap-1 font-bold", small ? "justify-end text-xs" : "text-xl font-extrabold", toneOf(c))}>
      <Icon name={c >= 0 ? "arrowUp" : "arrowDown"} size={small ? 11 : 16} />
      {pct(Math.abs(c), { digits: small ? 2 : 1 })}
    </span>
  );
}

function MiniLine({ series, upto }: { series: number[]; upto: number }) {
  const W = 72;
  const H = 26;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  const n = series.length - 1;
  const pts = series
    .slice(0, upto + 1)
    .map((v, k) => `${((k / n) * W).toFixed(1)},${(H - 2 - ((v - lo) / span) * (H - 4)).toFixed(1)}`)
    .join(" ");
  const up = series[upto] >= series[0];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="hidden shrink-0 sm:block">
      <line
        x1={0}
        x2={W}
        y1={H - 2 - ((series[0] - lo) / span) * (H - 4)}
        y2={H - 2 - ((series[0] - lo) / span) * (H - 4)}
        stroke="var(--line)"
        strokeDasharray="2 3"
      />
      <polyline points={pts} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
