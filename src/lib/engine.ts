import { COMPANIES, COMPANY, CONFIG, PROFILES, TICKERS } from "@/content/market";
import { getRound } from "@/content/rounds";
import { move, share } from "./format";
import { checkProfile, holdingsValue, portfolioValue } from "./portfolio";
import type {
  Action,
  DecisionPath,
  Ledger,
  Moves,
  Order,
  Paise,
  Prices,
  ProfileId,
  QuickAction,
  Round,
  RoundResult,
  RoundScores,
  SimState,
  Ticker,
  Transaction,
} from "./types";

export class SimError extends Error {}

export function charge(value: Paise): Paise {
  return Math.round(value * CONFIG.chargeRate);
}

/** Largest whole number of shares affordable with `cash`, charges included. */
export function maxAffordable(cash: Paise, price: Paise): number {
  if (price <= 0 || cash <= 0) return 0;
  let q = Math.floor(cash / (price * (1 + CONFIG.chargeRate)));
  while (q > 0 && q * price + charge(q * price) > cash) q -= 1;
  while ((q + 1) * price + charge((q + 1) * price) <= cash) q += 1;
  return q;
}

export function validateOrder(l: Ledger, o: Order, prices: Prices): string | null {
  const c = COMPANY[o.ticker];
  if (!c) return `Unknown stock ${o.ticker}.`;
  const q = o.quantity;
  if (!Number.isFinite(q) || !Number.isInteger(q)) return "Enter a whole number of shares.";
  if (q <= 0) return "Quantity must be at least 1.";
  if (q > CONFIG.maxQtyPerOrder) return `Orders are capped at ${CONFIG.maxQtyPerOrder.toLocaleString("en-IN")} shares.`;
  const price = prices[o.ticker];
  if (o.side === "buy") {
    const cost = q * price + charge(q * price);
    if (cost > l.cash) {
      const max = maxAffordable(l.cash, price);
      return max > 0
        ? `Not enough cash. You can afford up to ${max} share${max === 1 ? "" : "s"} of ${c.name}.`
        : `You can't afford any ${c.name} shares right now.`;
    }
    return null;
  }
  const held = l.holdings[o.ticker]?.quantity ?? 0;
  if (held === 0) return `You don't own any ${c.name} shares. Short selling isn't part of Stockzz.`;
  if (q > held) return `You own ${held} share${held === 1 ? "" : "s"} of ${c.name}, so you can sell at most ${held}.`;
  return null;
}

export function applyOrder(l: Ledger, o: Order, prices: Prices, meta: { id: string; round: number }) {
  const err = validateOrder(l, o, prices);
  if (err) throw new SimError(err);
  const price = prices[o.ticker];
  const value = o.quantity * price;
  const fee = charge(value);
  const holdings = { ...l.holdings };
  const h = holdings[o.ticker] ?? { quantity: 0, costBasis: 0 };
  let realized = 0;
  let cash = l.cash;
  if (o.side === "buy") {
    holdings[o.ticker] = { quantity: h.quantity + o.quantity, costBasis: h.costBasis + value };
    cash -= value + fee;
  } else {
    const basisOut = o.quantity === h.quantity ? h.costBasis : Math.round((h.costBasis * o.quantity) / h.quantity);
    realized = value - basisOut;
    const left = h.quantity - o.quantity;
    if (left === 0) delete holdings[o.ticker];
    else holdings[o.ticker] = { quantity: left, costBasis: h.costBasis - basisOut };
    cash += value - fee;
  }
  const tx: Transaction = { ...meta, ticker: o.ticker, side: o.side, quantity: o.quantity, price, value, charges: fee, realized };
  return {
    ledger: {
      cash,
      holdings,
      realized: l.realized + realized,
      charges: l.charges + fee,
      transactions: [...l.transactions, tx],
    } satisfies Ledger,
    tx,
  };
}

/** Run a batch of orders on a scratch ledger; returns the first error. */
export function previewOrders(l: Ledger, orders: Order[], prices: Prices) {
  let cur = l;
  for (let i = 0; i < orders.length; i++) {
    const err = validateOrder(cur, orders[i], prices);
    if (err) return { ok: false as const, index: i, error: err, ledger: cur };
    cur = applyOrder(cur, orders[i], prices, { id: `preview-${i}`, round: 0 }).ledger;
  }
  return { ok: true as const, ledger: cur };
}

/** Turn a quick action (rupee amounts) into concrete share orders. */
export function quickOrders(qa: QuickAction, l: Ledger, prices: Prices): Order[] {
  const out: Order[] = [];
  let scratch = l;
  for (const q of qa.orders) {
    let quantity = 0;
    if (q.side === "sell") {
      const held = scratch.holdings[q.ticker]?.quantity ?? 0;
      quantity = q.mode === "all" ? held : Math.min(held, Math.floor(((q.value ?? 0) * 100) / prices[q.ticker]));
    } else {
      quantity = maxAffordable(Math.min(scratch.cash, (q.value ?? 0) * 100), prices[q.ticker]);
    }
    if (quantity > 0) {
      const o: Order = { ticker: q.ticker, side: q.side, quantity };
      out.push(o);
      scratch = applyOrder(scratch, o, prices, { id: "qa", round: 0 }).ledger;
    }
  }
  return out;
}

export function applyMoves(prices: Prices, moves: Moves): Prices {
  const next = { ...prices };
  for (const [t, m] of Object.entries(moves)) next[t as Ticker] = move(next[t as Ticker], m ?? 0);
  return next;
}

function appendHistory(h: SimState["priceHistory"], prices: Prices, label: string) {
  const next = { ...h };
  for (const t of TICKERS) next[t] = [...next[t], { label, price: prices[t] }];
  return next;
}

export function emptyLedger(): Ledger {
  return { cash: CONFIG.startingCash, holdings: {}, realized: 0, charges: 0, transactions: [] };
}

function openRound(sim: SimState, round: Round): SimState {
  if (!round.marketOpen) return sim;
  const prices = applyMoves(sim.prices, round.marketOpen.moves);
  return { ...sim, prices, priceHistory: appendHistory(sim.priceHistory, prices, `R${round.id} open`) };
}

export function startSim(profile: ProfileId, now = Date.now()): SimState {
  const prices = Object.fromEntries(COMPANIES.map((c) => [c.ticker, c.startPrice])) as Prices;
  const priceHistory = Object.fromEntries(
    COMPANIES.map((c) => {
      // Walk the weekly history backwards from today's price.
      const pts: { label: string; price: Paise }[] = [{ label: "Start", price: c.startPrice }];
      let p = c.startPrice;
      for (let i = c.history.length - 1; i >= 0; i--) {
        p = Math.round((p * 10000) / (10000 + Math.round(c.history[i] * 100)));
        pts.unshift({ label: `W−${c.history.length - i}`, price: p });
      }
      return [c.ticker, pts];
    }),
  ) as SimState["priceHistory"];
  const sim: SimState = {
    status: "active",
    profile,
    startedAt: now,
    currentRound: 1,
    ledger: emptyLedger(),
    prices,
    priceHistory,
    valueHistory: [{ label: "Start", value: CONFIG.startingCash }],
    rounds: [],
  };
  return openRound(sim, getRound(1));
}

/* ---------- Decision paths ---------- */

function netFlow(orders: Order[], prices: Prices, tickers?: Ticker[]) {
  let buy = 0;
  let sell = 0;
  for (const o of orders) {
    if (tickers && !tickers.includes(o.ticker)) continue;
    const v = o.quantity * prices[o.ticker];
    if (o.side === "buy") buy += v;
    else sell += v;
  }
  return { buy, sell };
}

export function actionOf(orders: Order[], prices: Prices): Action {
  if (orders.length === 0) return "hold";
  const { buy, sell } = netFlow(orders, prices);
  return buy >= sell ? "buy" : "sell";
}

interface DecisionCtx {
  orders: Order[];
  prices: Prices;
  after: Ledger;
  profile: ProfileId;
}

function matches(p: DecisionPath, ctx: DecisionCtx): boolean {
  const m = p.match;
  switch (m.kind) {
    case "hold":
      return ctx.orders.length === 0;
    case "any":
      return true;
    case "buy": {
      const { buy, sell } = netFlow(ctx.orders, ctx.prices, m.tickers);
      if (buy <= sell) return false;
      if (m.minExposurePct === undefined && m.maxExposurePct === undefined) return true;
      const tickers = m.tickers ?? (Object.keys(ctx.after.holdings) as Ticker[]);
      const exposed = tickers.reduce((s, t) => s + (ctx.after.holdings[t]?.quantity ?? 0) * ctx.prices[t], 0);
      const pctExposed = share(exposed, portfolioValue(ctx.after, ctx.prices));
      if (m.minExposurePct !== undefined && pctExposed < m.minExposurePct) return false;
      if (m.maxExposurePct !== undefined && pctExposed > m.maxExposurePct) return false;
      return true;
    }
    case "sell": {
      const { buy, sell } = netFlow(ctx.orders, ctx.prices, m.tickers);
      if (sell <= buy) return false;
      if (m.fullExit) return (m.tickers ?? []).every((t) => (ctx.after.holdings[t]?.quantity ?? 0) === 0);
      return true;
    }
    case "portfolio": {
      if (m.traded !== undefined && m.traded !== ctx.orders.length > 0) return false;
      const chk = checkProfile(ctx.after, ctx.prices, ctx.profile);
      if (m.withinProfile !== undefined && m.withinProfile !== chk.within) return false;
      if (m.minSectorPct !== undefined && chk.e.maxSectorPct < m.minSectorPct) return false;
      if (m.minCashPct !== undefined && chk.e.cashPct < m.minCashPct) return false;
      if (m.maxCashPct !== undefined && chk.e.cashPct > m.maxCashPct) return false;
      return true;
    }
  }
}

export function matchPath(round: Round, ctx: DecisionCtx): DecisionPath {
  return round.paths.find((p) => matches(p, ctx)) ?? round.paths[round.paths.length - 1];
}

/* ---------- Scoring ---------- */

export const SCORING = {
  reasoning: { rationale: 0.5, path: 0.5 },
  risk: { choice: 0.7, sizing: 0.3, sizingScores: { within: 100, breached: 60, severe: 25 } },
  diversification: { minInvestedPct: 15, fullSectors: 4, withinCapFloor: 60 },
  bands: [
    { min: 80, label: "Strong", tone: "up" },
    { min: 55, label: "Developing", tone: "brand" },
    { min: 0, label: "Needs work", tone: "down" },
  ],
} as const;

export function band(score: number) {
  return SCORING.bands.find((b) => score >= b.min) ?? SCORING.bands[SCORING.bands.length - 1];
}

function scoreRound(round: Round, decision: { rationaleId: string; riskId: string; path: DecisionPath }, ctx: DecisionCtx): RoundScores {
  const r = round.rationales.find((x) => x.id === decision.rationaleId);
  const k = round.risks.find((x) => x.id === decision.riskId);
  const p = PROFILES[ctx.profile];
  const e = checkProfile(ctx.after, ctx.prices, ctx.profile).e;
  const s = SCORING.risk.sizingScores;
  const sizing =
    e.maxPositionPct > 1.5 * p.maxPositionPct || e.maxSectorPct > 1.5 * p.maxSectorPct
      ? s.severe
      : e.maxPositionPct > p.maxPositionPct || e.maxSectorPct > p.maxSectorPct
        ? s.breached
        : s.within;

  let diversification: number | null = null;
  const d = SCORING.diversification;
  if (e.investedPct >= d.minInvestedPct) {
    diversification = Math.max(0, Math.min(100, Math.round(((e.effectiveSectors - 1) / (d.fullSectors - 1)) * 100)));
    if (e.maxSectorPct <= p.maxSectorPct) diversification = Math.max(diversification, d.withinCapFloor);
  }

  return {
    reasoning: Math.round((r?.score ?? 0) * SCORING.reasoning.rationale + decision.path.score * SCORING.reasoning.path),
    risk: Math.round((k?.score ?? 0) * SCORING.risk.choice + sizing * SCORING.risk.sizing),
    diversification,
    consistent: !!r && r.implies.includes(actionOf(ctx.orders, ctx.prices)),
    comprehension: null,
  };
}

/* ---------- Round lifecycle ---------- */

export interface Decision {
  orders: Order[];
  rationaleId: string;
  riskId: string;
}

export function resolveRound(sim: SimState, decision: Decision, now = Date.now()): SimState {
  if (sim.status === "complete") throw new SimError("The simulation is already complete.");
  const n = sim.currentRound;
  if (sim.rounds.some((r) => r.round === n)) throw new SimError(`Round ${n} is already resolved.`);
  const round = getRound(n);
  if (!round.rationales.some((r) => r.id === decision.rationaleId)) throw new SimError("Pick the reasoning that best matches yours.");
  if (!round.risks.some((r) => r.id === decision.riskId)) throw new SimError("Pick the main risk you see.");

  const pricesBefore = sim.prices;
  const valueBefore = portfolioValue(sim.ledger, pricesBefore);
  let ledger = sim.ledger;
  decision.orders.forEach((o, i) => {
    try {
      ledger = applyOrder(ledger, o, pricesBefore, { id: `r${n}-t${i + 1}`, round: n }).ledger;
    } catch (e) {
      if (e instanceof SimError) throw new SimError(`Order ${i + 1}: ${e.message}`);
      throw e;
    }
  });

  const ctx: DecisionCtx = { orders: decision.orders, prices: pricesBefore, after: ledger, profile: sim.profile };
  const path = matchPath(round, ctx);
  const scores = scoreRound(round, { ...decision, path }, ctx);

  let prices = pricesBefore;
  let priceHistory = sim.priceHistory;
  for (const step of round.outcome) {
    prices = applyMoves(prices, step.moves);
    priceHistory = appendHistory(priceHistory, prices, `R${n} ${step.label}`);
  }
  const valueAfter = portfolioValue(ledger, prices);

  const result: RoundResult = {
    round: n,
    orders: decision.orders,
    rationaleId: decision.rationaleId,
    riskId: decision.riskId,
    pathId: path.id,
    pricesBefore,
    pricesAfter: prices,
    ledgerBefore: sim.ledger,
    valueBefore,
    valueAfter,
    checkAnswer: null,
    scores,
    completedAt: now,
  };

  return {
    ...sim,
    ledger,
    prices,
    priceHistory,
    valueHistory: [...sim.valueHistory, { label: `R${n}`, value: valueAfter }],
    rounds: [...sim.rounds, result],
  };
}

export function answerCheck(sim: SimState, roundId: number, answer: number): SimState {
  const i = sim.rounds.findIndex((r) => r.round === roundId);
  if (i < 0) throw new SimError(`Round ${roundId} hasn't been played yet.`);
  const r = sim.rounds[i];
  if (r.checkAnswer !== null) return sim;
  const correct = answer === getRound(roundId).check.answer;
  const rounds = [...sim.rounds];
  rounds[i] = { ...r, checkAnswer: answer, scores: { ...r.scores, comprehension: correct ? 100 : 0 } };
  return { ...sim, rounds };
}

/** Move on after the debrief: open the next round or finish. */
export function advance(sim: SimState): SimState {
  const done = sim.rounds.find((r) => r.round === sim.currentRound);
  if (!done) throw new SimError("Finish the current round first.");
  if (done.checkAnswer === null) throw new SimError("Answer the knowledge check before moving on.");
  if (sim.currentRound >= CONFIG.totalRounds) return { ...sim, status: "complete" };
  const next = { ...sim, currentRound: sim.currentRound + 1 };
  return openRound(next, getRound(next.currentRound));
}

/** Replay a quick action from the pre-decision state to show "what if". */
export function whatIf(result: RoundResult, qa: QuickAction) {
  const round = getRound(result.round);
  const orders = quickOrders(qa, result.ledgerBefore, result.pricesBefore);
  const applicable = qa.orders.length === 0 || orders.length > 0;
  let ledger = result.ledgerBefore;
  for (const o of orders) ledger = applyOrder(ledger, o, result.pricesBefore, { id: "alt", round: result.round }).ledger;
  let prices = result.pricesBefore;
  for (const s of round.outcome) prices = applyMoves(prices, s.moves);
  const valueAfter = portfolioValue(ledger, prices);
  return { applicable, valueAfter, change: valueAfter - result.valueBefore };
}

export function investedOf(sim: SimState) {
  return holdingsValue(sim.ledger, sim.prices);
}
