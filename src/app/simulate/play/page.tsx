"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LESSON, LESSONS } from "@/content/lessons";
import { COMPANIES, COMPANY, SECTORS } from "@/content/market";
import { getRound } from "@/content/rounds";
import { lessonDone } from "@/content/path";
import { GlossaryText, Term } from "@/components/glossary";
import { ReadinessCard } from "@/components/readiness";
import { charge, maxAffordable, previewOrders } from "@/lib/engine";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import { portfolioValue } from "@/lib/portfolio";
import { actions, useApp } from "@/lib/store";
import type { Ledger, Order, Prediction, Round, SimState, Side, Ticker } from "@/lib/types";
import { ValueChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { HoldingsTable, PortfolioStrip, ProfileLimits, RoundProgress, SectorBars } from "@/components/sim-ui";
import { Badge, Button, Card, Skeleton } from "@/components/ui";
import { Debrief } from "../review/[round]/debrief";
import { AnimatedNumber } from "@/components/motion";
import { PredictChart } from "@/components/predict";
import { MarketReplay } from "@/components/replay";
import { RoundIntro } from "@/components/round-intro";

export default function PlayPage() {
  const { state, hydrated } = useApp();
  const router = useRouter();
  const sim = state.sim;
  // The round just confirmed in this visit plays out as a replay before its debrief.
  const [replaying, setReplaying] = useState<number | null>(null);
  // Moving on from a debrief shows a short title card for the new round (not on a reload).
  const [intro, setIntro] = useState<number | null>(null);
  const lastRound = useRef<number | null>(null);
  const current = sim?.currentRound;
  useEffect(() => {
    if (current === undefined) return;
    if (lastRound.current !== null && current > lastRound.current) setIntro(current);
    lastRound.current = current;
  }, [current]);

  useEffect(() => {
    if (!hydrated) return;
    if (!sim) router.replace("/simulate");
    else if (sim.status === "complete") router.replace("/report");
  }, [hydrated, sim, router]);

  if (!hydrated || !sim || sim.status === "complete") return <Skeleton className="h-[600px]" />;
  // Once the decision is confirmed, the debrief replaces the terminal on this same page.
  const result = sim.rounds.find((r) => r.round === sim.currentRound);
  if (result && replaying === result.round) return <MarketReplay result={result} onDone={() => setReplaying(null)} />;
  if (result) return <Debrief roundId={sim.currentRound} inline />;
  return (
    <>
      <Terminal sim={sim} round={getRound(sim.currentRound)} key={sim.currentRound} onSubmitted={() => setReplaying(sim.currentRound)} />
      {intro === sim.currentRound && <RoundIntro round={getRound(intro)} onDone={() => setIntro(null)} />}
    </>
  );
}

function prevClose(sim: SimState, round: Round, t: Ticker) {
  const h = sim.priceHistory[t];
  return round.marketOpen && h.length >= 2 ? h[h.length - 2].price : h[h.length - 1].price;
}

function relatedLessons(round: Round) {
  const list = LESSONS.filter((l) => l.applyRound === round.id);
  return list.length ? list : [LESSON[round.lessonSlug]];
}

function Terminal({ sim, round, onSubmitted }: { sim: SimState; round: Round; onSubmitted: () => void }) {
  const [selected, setSelected] = useState<Ticker>(round.inNews[0] ?? COMPANIES[0].ticker);
  const [staged, setStaged] = useState<Order[]>([]);
  const [rationaleId, setRationaleId] = useState("");
  const [riskId, setRiskId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [predictTicker, setPredictTicker] = useState<Ticker>(round.inNews[0] ?? COMPANIES[0].ticker);
  const [guess, setGuess] = useState<number | null>(null);
  const prediction: Prediction | undefined = guess === null ? undefined : { ticker: predictTicker, pct: guess };
  const orderRef = useRef<HTMLDivElement>(null);

  const preview = previewOrders(sim.ledger, staged, sim.prices);
  const afterStaged: Ledger = preview.ok ? preview.ledger : sim.ledger;

  const pick = (t: Ticker) => {
    setSelected(t);
    if (window.innerWidth < 1024) orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const stage = (o: Order) =>
    setStaged((cur) => {
      const i = cur.findIndex((x) => x.ticker === o.ticker && x.side === o.side);
      if (i < 0) return [...cur, o];
      const next = [...cur];
      next[i] = { ...next[i], quantity: next[i].quantity + o.quantity };
      return next;
    });

  const lessons = relatedLessons(round);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between text-sm">
          <Link href="/simulate" className="inline-flex items-center gap-1.5 font-semibold text-muted hover:text-brand">
            <Icon name="arrowLeft" size={14} /> Lobby
          </Link>
          <span className="text-muted">
            Round <span className="font-bold text-fg">{round.id}</span> of 10
          </span>
        </div>
        <RoundProgress current={round.id} done={sim.rounds.length} />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-brand">{round.concepts.join(" · ")}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{round.title}</h1>
        <p className="mt-1 text-muted">{round.objective}</p>
      </div>

      <ReadinessCard round={round.id} />

      <PortfolioStrip ledger={sim.ledger} prices={sim.prices} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <NewsCard round={round} sim={sim} />
          {round.special && <SpecialPanel round={round} sim={sim} after={staged.length ? afterStaged : undefined} />}
          <StockDetail sim={sim} round={round} ticker={selected} />
          <Card className="flex gap-3 border-dashed">
            <Icon name="book" size={18} className="mt-0.5 shrink-0 text-brand" />
            <div className="text-sm">
              <p className="font-bold">Need a refresher?</p>
              <p className="text-muted">
                Related lesson{lessons.length > 1 ? "s" : ""}:{" "}
                {lessons.map((l, i) => (
                  <span key={l.slug}>
                    {i > 0 && ", "}
                    <Link href={`/learn/${l.slug}`} target="_blank" className="font-semibold text-brand hover:underline">
                      {l.title}
                    </Link>
                  </span>
                ))}
                . Opens in a new tab, so your staged orders stay put.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <MarketWatch sim={sim} round={round} selected={selected} onPick={pick} />
          <div ref={orderRef} className="scroll-mt-20">
            <OrderPanel key={selected} sim={sim} ticker={selected} afterStaged={afterStaged} staged={staged} onStage={stage} />
          </div>
          <DecisionCard
            sim={sim}
            round={round}
            staged={staged}
            onRemove={(i) => setStaged((cur) => cur.filter((_, j) => j !== i))}
            rationaleId={rationaleId}
            riskId={riskId}
            setRationaleId={setRationaleId}
            setRiskId={setRiskId}
            stagedError={preview.ok ? null : preview.error}
            onReview={() => setConfirming(true)}
            predict={
              <PredictCard
                sim={sim}
                round={round}
                ticker={predictTicker}
                setTicker={(t) => {
                  setPredictTicker(t);
                  setGuess(null);
                }}
                guess={guess}
                setGuess={setGuess}
              />
            }
          />
        </div>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold">Current holdings</h2>
        {Object.keys(sim.ledger.holdings).length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong p-6 text-center">
            <p className="font-bold">No holdings yet</p>
            <p className="mt-1 text-sm text-muted">You're fully in cash. Shares you buy will appear here with their average cost and P&L.</p>
          </div>
        ) : (
          <HoldingsTable ledger={sim.ledger} prices={sim.prices} />
        )}
      </Card>
      <p className="text-center text-xs text-muted">Simplified, fictional scenario. Prices move on a fixed script to isolate one idea; they don't predict real markets.</p>

      {confirming && (
        <ConfirmDialog
          sim={sim}
          round={round}
          orders={staged}
          after={afterStaged}
          rationaleId={rationaleId}
          riskId={riskId}
          prediction={prediction}
          onCancel={() => setConfirming(false)}
          onSubmitted={onSubmitted}
        />
      )}
    </div>
  );
}

/* ---------- News ---------- */

function NewsCard({ round, sim }: { round: Round; sim: SimState }) {
  const lastValue = sim.valueHistory[sim.valueHistory.length - 1]?.value ?? 0;
  const drift = portfolioValue(sim.ledger, sim.prices) - lastValue;
  return (
    <Card className="animate-alert overflow-hidden p-0!">
      <div className="flex items-center gap-2 border-b border-line bg-brand-soft px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-strong">
        <Icon name="news" size={15} /> Breaking · Round {round.id}
      </div>
      <div className="p-5 sm:p-6">
        <h2 className="text-2xl font-extrabold leading-tight">{round.headline}</h2>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          Source: {round.source}
          <Badge tone={round.verified ? "up" : "down"}>{round.verified ? "Verified" : "Unverified"}</Badge>
        </p>
        <p className="mt-4 text-fg/90">
          <GlossaryText text={round.background} />
        </p>

        {round.marketOpen && (
          <div className="mt-5 rounded-xl border border-line bg-surface p-4">
            <p className="text-sm">
              <span className="font-bold">Market reaction so far:</span> {round.marketOpen.headline}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(round.marketOpen.moves).map(([t, m]) => (
                <span key={t} className="num inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-bold">
                  {t} <span className={toneOf(m ?? 0)}>{pct(m ?? 0, { signed: true })}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Your portfolio has already moved <span className={cx("num font-bold", toneOf(drift))}>{rupees(drift, { signed: true })}</span> since the end of last
              round. You trade at today's prices.
            </p>
          </div>
        )}

        <h3 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">What you know right now</h3>
        <ul className="space-y-2 text-sm">
          {round.facts.map((f) => (
            <li key={f} className="flex gap-2">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <GlossaryText text={f} />
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl border border-brand/30 bg-brand-soft/60 p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Icon name="info" size={16} className="text-brand" /> Questions to think about
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
            {round.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Selected stock ---------- */

function StockDetail({ sim, round, ticker }: { sim: SimState; round: Round; ticker: Ticker }) {
  const c = COMPANY[ticker];
  const held = sim.ledger.holdings[ticker]?.quantity ?? 0;
  const pts = sim.priceHistory[ticker].map((p) => ({ label: p.label.replace(/^R(\d+) .*/, "R$1"), value: p.price }));
  const first = pts[0].value;
  const last = pts[pts.length - 1].value;
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <span className="h-2 w-2 rounded-full bg-brand" /> {SECTORS[c.sector].name}
          </p>
          <h2 className="mt-1 text-xl font-extrabold">
            {c.name} <span className="text-muted">· {c.ticker}</span>
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted">{c.blurb}</p>
        </div>
        <div className="text-right">
          <p className="num text-2xl font-extrabold">{rupees(sim.prices[ticker])}</p>
          <p className="text-xs text-muted">{held ? `${held} shares held` : "Not held"}</p>
          {round.inNews.includes(ticker) && (
            <Badge tone="brand" className="mt-1">
              In the news
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-4">
        <ValueChart points={pts} height={200} label={`${c.name} price`} />
      </div>
      <p className="mt-1 text-xs text-muted">
        Price moved from {rupees(first)} to {rupees(last)} over {pts.length} points. Simulated, fictional history, W = weeks before the simulation, R = rounds.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <dt className="text-xs text-muted">
            <Term id="market-cap">Market cap</Term>
          </dt>
          <dd className="num font-bold">₹{c.marketCapCr.toLocaleString("en-IN")} cr</dd>
        </div>
        {c.facts.map((f) => (
          <div key={f.label} className="rounded-xl border border-line bg-surface p-3">
            <dt className="text-xs text-muted">
              <GlossaryText text={f.label} />
            </dt>
            <dd className="font-bold">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">Company facts describe the business at the start of the simulation.</p>
    </Card>
  );
}

/* ---------- Market watch ---------- */

function MarketWatch({ sim, round, selected, onPick }: { sim: SimState; round: Round; selected: Ticker; onPick: (t: Ticker) => void }) {
  const order = [...COMPANIES].sort((a, b) => Number(round.inNews.includes(b.ticker)) - Number(round.inNews.includes(a.ticker)));
  return (
    <Card className="p-3!">
      <h2 className="px-2 pt-1 pb-2 text-lg font-extrabold">Market watch</h2>
      <ul aria-label="Choose a stock" className="stagger space-y-1">
        {order.map((c) => {
          const p = sim.prices[c.ticker];
          const base = prevClose(sim, round, c.ticker);
          const chg = share(p - base, base);
          const held = sim.ledger.holdings[c.ticker]?.quantity ?? 0;
          const active = selected === c.ticker;
          return (
            <li key={c.ticker}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onPick(c.ticker)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition duration-150 active:scale-[0.99]",
                  active ? "border-brand bg-brand-soft" : "border-transparent hover:translate-x-0.5 hover:bg-surface",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-extrabold">{c.ticker}</span>
                    {round.inNews.includes(c.ticker) && <Badge tone="brand">In the news</Badge>}
                    {held > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-up">
                        <Icon name="check" size={11} /> {held}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {c.name} · {SECTORS[c.sector].name}
                  </span>
                </span>
                <span className="num text-right">
                  <span className="block text-sm font-bold">
                    <AnimatedNumber value={p} format={(n) => rupees(n)} />
                  </span>
                  <span className={cx("block text-xs font-semibold", toneOf(chg))}>{pct(chg, { signed: true })}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------- Order entry ---------- */

function OrderPanel({
  sim,
  ticker,
  afterStaged,
  staged,
  onStage,
}: {
  sim: SimState;
  ticker: Ticker;
  afterStaged: Ledger;
  staged: Order[];
  onStage: (o: Order) => void;
}) {
  const [side, setSide] = useState<Side>("buy");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const c = COMPANY[ticker];
  const price = sim.prices[ticker];
  const heldAfter = afterStaged.holdings[ticker]?.quantity ?? 0;
  const maxBuy = maxAffordable(afterStaged.cash, price);
  const q = Number(qty) || 0;
  const value = q * price;
  const fee = q ? charge(value) : 0;
  const cashAfter = afterStaged.cash + (side === "buy" ? -(value + fee) : value - fee);

  const chips =
    side === "buy"
      ? [5000, 10000, 25000]
          .map((r) => ({ label: `₹${r / 1000}K`, n: maxAffordable(Math.min(afterStaged.cash, r * 100), price) }))
          .concat([{ label: "Max", n: maxBuy }])
      : [
          { label: "25%", n: Math.floor(heldAfter / 4) },
          { label: "50%", n: Math.floor(heldAfter / 2) },
          { label: "All", n: heldAfter },
        ];

  const add = () => {
    if (!q) return setError("Enter a quantity of at least 1 share.");
    const o: Order = { ticker, side, quantity: q };
    const res = previewOrders(sim.ledger, [...staged, o], sim.prices);
    if (!res.ok) return setError(res.error);
    onStage(o);
    setQty("");
    setError(null);
  };

  const step = (d: number) => {
    setQty(String(Math.max(0, q + d) || ""));
    setError(null);
  };

  return (
    <Card>
      <h2 className="text-lg font-extrabold">Place an order</h2>
      <div className="mt-3 flex items-end justify-between gap-3 rounded-xl border border-line bg-surface p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {c.name} · {c.ticker}
          </p>
          <p className="text-xs text-muted">Pick another stock in the market watch</p>
        </div>
        <p className="num text-lg font-extrabold">{rupees(price)}</p>
      </div>

      <div role="radiogroup" aria-label="Order side" className="mt-4 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={side === s}
            disabled={s === "sell" && heldAfter === 0}
            title={s === "sell" && heldAfter === 0 ? `You don't hold any ${c.name}` : undefined}
            onClick={() => {
              setSide(s);
              setQty("");
              setError(null);
            }}
            className={cx(
              "rounded-lg py-2 text-sm font-bold capitalize transition disabled:opacity-35",
              side === s ? (s === "buy" ? "bg-up text-white dark:text-black" : "bg-down text-white dark:text-black") : "text-muted hover:text-fg",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <label htmlFor="order-qty" className="font-semibold">
            Quantity (whole shares)
          </label>
          <span className="text-xs text-muted">{side === "buy" ? `Max affordable: ${maxBuy}` : `You hold: ${heldAfter}`}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button variant="outline" aria-label="One fewer share" onClick={() => step(-1)}>
            −
          </Button>
          <input
            id="order-qty"
            inputMode="numeric"
            value={qty}
            placeholder="0"
            onChange={(e) => {
              setQty(e.target.value.replace(/[^\d]/g, ""));
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && add()}
            className="num h-10 min-w-0 flex-1 rounded-xl border border-line-strong bg-card px-3 text-center text-base font-bold"
          />
          <Button variant="outline" aria-label="One more share" onClick={() => step(1)}>
            +
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {chips.map((ch) => (
            <button
              key={ch.label}
              type="button"
              disabled={ch.n === 0}
              onClick={() => {
                setQty(String(ch.n));
                setError(null);
              }}
              className="rounded-lg border border-line px-1 py-1.5 text-xs font-semibold transition hover:border-brand hover:text-brand disabled:opacity-35"
            >
              {ch.label} <span className="text-muted">({ch.n})</span>
            </button>
          ))}
        </div>
      </div>

      <dl className="num mt-4 space-y-1.5 rounded-xl border border-line bg-surface p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Order value</dt>
          <dd className="font-semibold">{rupees(value)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">
            <Term id="charges">Charges</Term> (0.10% of order value)
          </dt>
          <dd className="font-semibold">{rupees(fee)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-1.5">
          <dt className="font-bold">{side === "buy" ? "Cash needed" : "Cash you'll receive"}</dt>
          <dd className="font-extrabold">{rupees(side === "buy" ? value + fee : value - fee)}</dd>
        </div>
        <div className="flex justify-between text-xs">
          <dt className="text-muted">Cash after staged orders</dt>
          <dd className={cashAfter < 0 ? "font-bold text-down" : "text-muted"}>{rupees(cashAfter)}</dd>
        </div>
      </dl>

      {error && <p className="mt-3 text-sm font-semibold text-down">{error}</p>}
      <p className="mt-3 text-xs text-muted">
        Stockzz fills every order instantly at the price shown, like a <Term id="market-order">market order</Term> with no slippage. Real markets aren't
        always that kind (see Lesson 3). Stage several orders, then confirm them together.
      </p>
      <Button variant={side === "buy" ? "buy" : "sell"} size="lg" className="mt-3 w-full" onClick={add} disabled={!q}>
        <Icon name="check" size={16} /> Add {side} order
      </Button>
    </Card>
  );
}

/* ---------- Decision ---------- */

function DecisionCard({
  sim,
  round,
  staged,
  onRemove,
  rationaleId,
  riskId,
  setRationaleId,
  setRiskId,
  stagedError,
  onReview,
  predict,
}: {
  sim: SimState;
  round: Round;
  staged: Order[];
  onRemove: (i: number) => void;
  rationaleId: string;
  riskId: string;
  setRationaleId: (v: string) => void;
  setRiskId: (v: string) => void;
  stagedError: string | null;
  onReview: () => void;
  predict: React.ReactNode;
}) {
  const ready = !!rationaleId && !!riskId && !stagedError;
  const after = previewOrders(sim.ledger, staged, sim.prices).ledger;
  const { state } = useApp();
  // Before diversification is taught, show profile limits as guidance rather than red warnings.
  const soft = round.id < 6 && !lessonDone(state, "diversification");
  return (
    <Card>
      <h2 className="text-lg font-extrabold">Your decision</h2>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">Your orders this round</p>
      {staged.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-line-strong p-3 text-sm text-muted">
          No orders staged, confirming now means you <span className="font-bold text-fg">hold</span> this round.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {staged.map((o, i) => {
            const v = o.quantity * sim.prices[o.ticker];
            return (
              <li key={`${o.ticker}-${o.side}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <Badge tone={o.side === "buy" ? "up" : "down"}>{o.side.toUpperCase()}</Badge>
                <span className="num min-w-0 flex-1 text-sm">
                  <span className="font-bold">
                    {o.quantity} × {o.ticker}
                  </span>
                  <span className="block text-xs text-muted">
                    {rupees(v)} + {rupees(charge(v))} charges
                  </span>
                </span>
                <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${o.side} ${o.ticker}`} className="text-muted hover:text-down">
                  <Icon name="x" size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {stagedError && <p className="mt-2 text-sm font-semibold text-down">{stagedError}</p>}
      {staged.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Against your profile after these orders</p>
          <ProfileLimits profile={sim.profile} ledger={sim.ledger} prices={sim.prices} after={after} soft={soft} />
        </div>
      )}

      <ChoiceGroup label="Which statement best describes your reasoning?" name="rationale" options={round.rationales} value={rationaleId} onChange={setRationaleId} />
      <ChoiceGroup label="What is the most important risk to keep in mind?" name="risk" options={round.risks} value={riskId} onChange={setRiskId} />
      {predict}

      <Button size="lg" className="mt-5 w-full" disabled={!ready} onClick={onReview}>
        Review & confirm decision
      </Button>
      {!ready && <p className="mt-2 text-center text-xs text-muted">Choose your reasoning and the main risk to continue.</p>}
    </Card>
  );
}

function ChoiceGroup({ label, name, options, value, onChange }: { label: string; name: string; options: { id: string; text: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label
            key={o.id}
            className={cx("flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition", value === o.id ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40")}
          >
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]" />
            <span>{o.text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ConfirmDialog({
  sim,
  round,
  orders,
  after,
  rationaleId,
  riskId,
  prediction,
  onCancel,
  onSubmitted,
}: {
  sim: SimState;
  round: Round;
  orders: Order[];
  after: Ledger;
  rationaleId: string;
  riskId: string;
  prediction?: Prediction;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const confirm = () => {
    try {
      actions.submitDecision({ orders, rationaleId, riskId, prediction });
      onSubmitted();
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const rationale = round.rationales.find((r) => r.id === rationaleId);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-extrabold">
          {orders.length === 0 ? "Hold this round?" : `Confirm ${orders.length} order${orders.length > 1 ? "s" : ""}`}
        </h2>
        {orders.length > 0 && (
          <ul className="mt-3 space-y-2">
            {orders.map((o) => {
              const v = o.quantity * sim.prices[o.ticker];
              return (
                <li key={`${o.ticker}-${o.side}`} className="num flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
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
        <dl className="num mt-3 space-y-1 rounded-xl border border-line bg-surface p-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Cash after orders</dt>
            <dd className="font-bold">{rupees(after.cash)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Portfolio value</dt>
            <dd className="font-bold">{rupees(portfolioValue(after, sim.prices))}</dd>
          </div>
        </dl>
        {rationale && (
          <p className="mt-3 text-sm">
            <span className="text-muted">Your reasoning: </span>
            {rationale.text}
          </p>
        )}
        {prediction && (
          <p className="mt-2 text-sm">
            <span className="text-muted">Your call: </span>
            {prediction.ticker} <span className={cx("num font-bold", toneOf(prediction.pct))}>{pct(prediction.pct, { signed: true, digits: 1 })}</span>
          </p>
        )}
        <p className="mt-3 text-xs text-muted">Once confirmed, this round can't be changed. The scenario's next developments will then play out.</p>
        {error && <p className="mt-2 text-sm font-semibold text-down">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button ref={confirmRef} onClick={confirm}>
            Confirm & see what happens
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Prediction ---------- */

function PredictCard({
  sim,
  round,
  ticker,
  setTicker,
  guess,
  setGuess,
}: {
  sim: SimState;
  round: Round;
  ticker: Ticker;
  setTicker: (t: Ticker) => void;
  guess: number | null;
  setGuess: (v: number | null) => void;
}) {
  const choices = round.inNews.length ? round.inNews : [ticker];
  const history = sim.priceHistory[ticker].slice(-8).map((p) => p.price);
  return (
    <fieldset className="mt-5 rounded-xl border border-dashed border-brand/50 bg-brand-soft/40 p-3">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold">
        <Icon name="target" size={15} className="text-brand" /> Make a call <span className="font-normal text-muted">(optional, not scored)</span>
      </legend>
      <p className="mb-2 text-xs text-muted">Where will {COMPANY[ticker].name} be once this news plays out? You'll see your guess against the real move.</p>
      {choices.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {choices.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === ticker}
              onClick={() => setTicker(t)}
              className={cx("rounded-full border px-2.5 py-1 text-xs font-bold transition", t === ticker ? "border-brand bg-brand text-on-brand" : "border-line hover:border-brand/50")}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <PredictChart ticker={ticker} history={history} value={guess} onChange={setGuess} />
    </fieldset>
  );
}

/* ---------- Round-specific panels ---------- */

function SpecialPanel({ round, sim, after }: { round: Round; sim: SimState; after?: Ledger }) {
  if (round.special === "rumour") {
    return (
      <Card>
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name="alert" size={18} className="text-brand" /> Rumour board
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-down/40 bg-down-soft p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-down">The claim</p>
            <p className="mt-1 text-2xl font-extrabold">₹4,500 cr</p>
            <p className="text-sm">Single order for Suryodaya, citing unnamed "sources".</p>
          </div>
          <div className="rounded-xl border border-up/40 bg-up-soft p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-up">The official record</p>
            <p className="mt-1 text-2xl font-extrabold">₹5,000 cr total</p>
            <p className="text-sm">Split among several winners from six qualified bidders, about ₹830 cr each on average.</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Source check: no exchange filing, the company declines to comment, and the claim is close to half the company's market value.</p>
      </Card>
    );
  }
  return (
    <Card>
      <h2 className="text-lg font-extrabold">{round.special === "concentration" ? "Concentration check" : "Allocation review"}</h2>
      <p className="mt-1 text-sm text-muted">
        {round.special === "concentration"
          ? "How much of your money sits in one sector? Compare it with Kabir's 85% in IT. Stage orders and the limits update live."
          : "Compare your current weights with your risk profile's targets. Stage orders and the limits update live."}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Sector weights {after ? "after staged orders" : "now"}</p>
          <SectorBars ledger={after ?? sim.ledger} prices={sim.prices} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Profile limits</p>
          <ProfileLimits profile={sim.profile} ledger={sim.ledger} prices={sim.prices} after={after} />
        </div>
      </div>
    </Card>
  );
}
