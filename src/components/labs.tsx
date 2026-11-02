"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LabId } from "@/lib/types";
import { cx } from "@/lib/format";
import { Button } from "./ui";
import { Icon } from "./icons";

/* ---------- small building blocks ---------- */

const inr = (n: number, d = 0) =>
  `${n < 0 ? "−" : ""}₹${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const sgn = (n: number, d = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(d)}%`;
const tone = (n: number) => (n > 0 ? "text-up" : n < 0 ? "text-down" : "text-fg");

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  show,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  show: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="num font-bold text-brand">{show}</span>
      </span>
      <input type="range" className="mt-2 w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function Readout({ label, value, className, hint }: { label: string; value: ReactNode; className?: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={cx("num mt-0.5 text-lg font-extrabold", className)}>{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx("rounded-lg px-3 py-1.5 text-sm font-semibold", value === o.id ? "bg-brand text-on-brand" : "text-muted hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
const Col = ({ children }: { children: ReactNode }) => <div className="space-y-4">{children}</div>;
const Out = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-2 content-start gap-3">{children}</div>;

/* ---------- 1. Ownership ---------- */

function OwnershipLab() {
  const [shares, setShares] = useState(25);
  const [price, setPrice] = useState(480);
  const TOTAL = 40_00_00_000; // 40 crore shares
  const value = shares * price;
  const change = shares * (price - 480);
  return (
    <Grid>
      <Col>
        <Slider label="Annapurna shares you own" value={shares} min={1} max={200} onChange={setShares} show={`${shares}`} />
        <Slider label="Share price" value={price} min={300} max={700} step={2} onChange={setPrice} show={inr(price)} />
        <p className="text-sm text-muted">You bought at ₹480. Company value = price × 40 crore shares = {inr((price * TOTAL) / 1e7)} crore.</p>
      </Col>
      <Out>
        <Readout label="Holding value" value={inr(value)} />
        <Readout label="Change since ₹480" value={inr(change)} className={tone(change)} hint={sgn(((price - 480) / 480) * 100)} />
        <Readout label="Your slice of the company" value={`1 in ${Math.round(TOTAL / shares).toLocaleString("en-IN")}`} />
        <Readout label="Shares in the company" value="40 crore" hint="Unchanged by your purchase" />
      </Out>
    </Grid>
  );
}

/* ---------- 2. P&L ---------- */

function PnlLab() {
  const [buy, setBuy] = useState(420);
  const [now, setNow] = useState(480);
  const [sell, setSell] = useState(10);
  const QTY = 20;
  const realised = sell * (now - buy);
  const unrealised = (QTY - sell) * (now - buy);
  const charges = Math.round((QTY * buy + sell * now) * 0.001);
  return (
    <Grid>
      <Col>
        <Slider label="Average buy price" value={buy} min={200} max={700} step={5} onChange={setBuy} show={inr(buy)} />
        <Slider label="Price today" value={now} min={200} max={700} step={5} onChange={setNow} show={inr(now)} />
        <Slider label={`Shares sold (of ${QTY})`} value={sell} min={0} max={QTY} onChange={setSell} show={`${sell}`} />
      </Col>
      <Out>
        <Readout label="Realised P&L" value={inr(realised)} className={tone(realised)} hint="Locked in by selling" />
        <Readout label="Unrealised P&L" value={inr(unrealised)} className={tone(unrealised)} hint={`${QTY - sell} shares still held`} />
        <Readout label="Charges (0.10%)" value={inr(-charges)} className="text-down" />
        <Readout label="Total P&L" value={inr(realised + unrealised - charges)} className={tone(realised + unrealised - charges)} />
      </Out>
    </Grid>
  );
}

/* ---------- 3. Order book ---------- */

const ASKS = [
  { price: 540.0, qty: 80 },
  { price: 540.5, qty: 120 },
  { price: 541.0, qty: 200 },
  { price: 541.5, qty: 300 },
];
const BIDS = [
  { price: 539.5, qty: 150 },
  { price: 539.0, qty: 220 },
  { price: 538.5, qty: 300 },
];

function OrderBookLab() {
  const [type, setType] = useState<"market" | "limit" | "stop">("market");
  const [qty, setQty] = useState(150);
  const [limit, setLimit] = useState(540);
  const [trigger, setTrigger] = useState(520);
  const [gap, setGap] = useState(false);

  const fill = useMemo(() => {
    let left = qty;
    let cost = 0;
    const rows: { price: number; qty: number }[] = [];
    for (const a of ASKS) {
      if (left === 0) break;
      if (type === "limit" && a.price > limit) break;
      const take = Math.min(left, a.qty);
      rows.push({ price: a.price, qty: take });
      cost += take * a.price;
      left -= take;
    }
    return { rows, filled: qty - left, left, avg: qty - left ? cost / (qty - left) : 0 };
  }, [qty, type, limit]);

  const stopFill = gap ? Math.min(trigger, 505) : trigger - 0.5;

  return (
    <div className="space-y-5">
      <Segmented
        label="Order type"
        value={type}
        onChange={setType}
        options={[
          { id: "market", label: "Market buy" },
          { id: "limit", label: "Limit buy" },
          { id: "stop", label: "Stop-loss sell" },
        ]}
      />
      <Grid>
        <div className="overflow-hidden rounded-xl border border-line text-sm">
          <div className="grid grid-cols-2 bg-surface-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">
            <span>Price</span>
            <span className="text-right">Shares</span>
          </div>
          {[...ASKS].reverse().map((a) => {
            const hit = type !== "stop" && fill.rows.find((r) => r.price === a.price);
            return (
              <div key={a.price} className={cx("num grid grid-cols-2 px-3 py-1.5", hit ? "bg-brand-soft font-bold" : "")}>
                <span className="text-down">{inr(a.price, 2)} ask</span>
                <span className="text-right">
                  {a.qty}
                  {hit ? ` (take ${hit.qty})` : ""}
                </span>
              </div>
            );
          })}
          <div className="border-y border-line bg-surface px-3 py-1 text-center text-xs text-muted">Spread ₹0.50</div>
          {BIDS.map((b) => (
            <div key={b.price} className="num grid grid-cols-2 px-3 py-1.5">
              <span className="text-up">{inr(b.price, 2)} bid</span>
              <span className="text-right">{b.qty}</span>
            </div>
          ))}
        </div>
        {type === "stop" ? (
          <Col>
            <Slider label="Stop trigger" value={trigger} min={500} max={535} onChange={setTrigger} show={inr(trigger)} />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={gap} onChange={(e) => setGap(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
              Bad news overnight: price opens at ₹505
            </label>
            <Out>
              <Readout label="Trigger" value={inr(trigger)} />
              <Readout label="Likely fill" value={inr(stopFill, 2)} className={stopFill < trigger - 1 ? "text-down" : ""} hint={gap && trigger > 505 ? "Gapped below your trigger" : "Close to the trigger"} />
            </Out>
          </Col>
        ) : (
          <Col>
            <Slider label="Shares to buy" value={qty} min={10} max={700} step={10} onChange={setQty} show={`${qty}`} />
            {type === "limit" && <Slider label="Your limit price" value={limit} min={539.5} max={541.5} step={0.5} onChange={setLimit} show={inr(limit, 2)} />}
            <Out>
              <Readout label="Filled" value={`${fill.filled} / ${qty}`} className={fill.left ? "text-brand" : "text-up"} hint={fill.left ? `${fill.left} wait in the book` : "Fully filled"} />
              <Readout label="Average price" value={fill.filled ? inr(fill.avg, 2) : "-"} hint={fill.filled ? `vs best ask ₹540.00` : undefined} />
            </Out>
          </Col>
        )}
      </Grid>
    </div>
  );
}

/* ---------- 4. Earnings ---------- */

function EarningsLab() {
  const [expected, setExpected] = useState(16);
  const [actual, setActual] = useState(24);
  const [guide, setGuide] = useState<"raise" | "hold" | "cut">("cut");
  const surprise = actual - expected;
  const g = { raise: 6, hold: 0, cut: -10 }[guide];
  const reaction = Math.max(-25, Math.min(25, surprise * 0.4 + g));
  return (
    <Grid>
      <Col>
        <Slider label="Expected profit growth" value={expected} min={0} max={30} onChange={setExpected} show={`${expected}%`} />
        <Slider label="Actual profit growth" value={actual} min={-10} max={40} onChange={setActual} show={`${actual}%`} />
        <div>
          <p className="mb-2 text-sm font-semibold">Management's outlook</p>
          <Segmented
            label="Guidance"
            value={guide}
            onChange={setGuide}
            options={[
              { id: "raise", label: "Raised" },
              { id: "hold", label: "Kept" },
              { id: "cut", label: "Cut" },
            ]}
          />
        </div>
      </Col>
      <Out>
        <Readout label="Earnings surprise" value={`${surprise > 0 ? "+" : ""}${surprise} pts`} className={tone(surprise)} />
        <Readout label="Illustrative price move" value={sgn(reaction)} className={tone(reaction)} />
        <div className="col-span-2 rounded-xl border border-line bg-surface p-3 text-sm text-muted">
          {surprise > 0 && guide === "cut"
            ? "A beat, but the future just got worse. The outlook wins."
            : surprise < 0 && guide === "raise"
              ? "A miss, but the future looks brighter. The outlook wins."
              : surprise >= 0 && guide !== "cut"
                ? "Results and outlook point the same way: good news on both counts."
                : "Weak results and a weak outlook reinforce each other."}
        </div>
      </Out>
    </Grid>
  );
}

/* ---------- 5. Rates ---------- */

function emi(principal: number, annualPct: number, months: number) {
  const r = annualPct / 1200;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

const SENS: { label: string; k: number }[] = [
  { label: "Autos", k: -4 },
  { label: "Fintech", k: -4.5 },
  { label: "Power", k: -3.5 },
  { label: "Consumer", k: -1.5 },
  { label: "Banks", k: 1 },
  { label: "IT exporters", k: -0.3 },
  { label: "Pharma", k: -0.3 },
];

function RatesLab() {
  const [repo, setRepo] = useState(6.75);
  const loan = repo + 2.75;
  const base = emi(800000, 9.0, 60);
  const now = emi(800000, loan, 60);
  const interest = 2000 * ((repo + 3) / 100);
  const d = repo - 6.25;
  return (
    <Grid>
      <Col>
        <Slider label="RBI repo rate" value={repo} min={5} max={8} step={0.25} onChange={setRepo} show={`${repo.toFixed(2)}%`} />
        <Out>
          <Readout label="Car loan rate" value={`${loan.toFixed(2)}%`} hint="Repo + 2.75 pts" />
          <Readout label="EMI on ₹8 lakh, 5 yrs" value={inr(now)} hint={`${now - base >= 0 ? "+" : "−"}${inr(Math.abs(now - base))} vs 9.0%`} />
          <Readout label="Suryodaya's yearly interest" value={`₹${interest.toFixed(0)} cr`} hint="On ₹2,000 cr of debt" />
          <Readout label="Change vs 6.25%" value={`${d > 0 ? "+" : ""}${d.toFixed(2)} pts`} className={tone(-d)} />
        </Out>
      </Col>
      <div>
        <p className="mb-3 text-sm font-semibold">Illustrative sector reaction</p>
        <ul className="space-y-2">
          {SENS.map((s) => {
            const v = s.k * (d / 0.5);
            return (
              <li key={s.label} className="grid grid-cols-[96px_1fr_56px] items-center gap-2 text-sm">
                <span className="font-semibold">{s.label}</span>
                <div className="relative h-3 rounded-full bg-surface-2">
                  <div className="absolute top-0 left-1/2 h-full w-px bg-line-strong" />
                  <div
                    className={cx("absolute top-0 h-full rounded-full", v >= 0 ? "bg-up" : "bg-down")}
                    style={{ left: v >= 0 ? "50%" : `${50 + Math.max(-50, v * 4)}%`, width: `${Math.min(50, Math.abs(v) * 4)}%` }}
                  />
                </div>
                <span className={cx("num text-right font-bold", tone(v))}>{sgn(v)}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Grid>
  );
}

/* ---------- 6. Valuation ---------- */

function ValuationLab() {
  const [eps, setEps] = useState(14.5);
  const [pe, setPe] = useState(80);
  const price = eps * pe;
  const base = 14.5 * 80;
  return (
    <Grid>
      <Col>
        <Slider label="Earnings per share (EPS)" value={eps} min={5} max={30} step={0.5} onChange={setEps} show={inr(eps, 2)} />
        <Slider label="P/E multiple" value={pe} min={10} max={100} onChange={setPe} show={`${pe}×`} />
        <p className="text-sm text-muted">Starting point: PayKaro at ₹14.50 EPS × 80 = ₹1,160.</p>
      </Col>
      <Out>
        <Readout label="Share price" value={inr(price)} />
        <Readout label="vs ₹1,160" value={sgn(((price - base) / base) * 100)} className={tone(price - base)} />
        <Readout label="Earnings yield" value={`${(100 / pe).toFixed(2)}%`} hint="EPS ÷ price" />
        <Readout label="1× change in P/E" value={inr(eps)} hint="Rupees per share" />
      </Out>
    </Grid>
  );
}

/* ---------- 7. Margins ---------- */

function MarginsLab() {
  const [rise, setRise] = useState(16);
  const [pass, setPass] = useState(75);
  const [brand, setBrand] = useState<"strong" | "weak">("strong");
  const extra = 50 * (rise / 100);
  const priceUp = extra * (pass / 100);
  const price = 100 + priceUp;
  const cost = 84 + extra;
  const elasticity = brand === "strong" ? 0.3 : 1.5;
  const volume = Math.max(0, 1 - (elasticity * priceUp) / 100);
  const margin = ((price - cost) / price) * 100;
  const profit = (price - cost) * volume;
  return (
    <Grid>
      <Col>
        <Slider label="Raw material cost increase" value={rise} min={0} max={40} onChange={setRise} show={`+${rise}%`} />
        <Slider label="Share of the cost passed to shoppers" value={pass} min={0} max={100} step={5} onChange={setPass} show={`${pass}%`} />
        <Segmented
          label="Brand strength"
          value={brand}
          onChange={setBrand}
          options={[
            { id: "strong", label: "Loved brand" },
            { id: "weak", label: "Generic product" },
          ]}
        />
      </Col>
      <Out>
        <Readout label="Selling price" value={inr(price, 2)} hint="Was ₹100" />
        <Readout label="Volume kept" value={`${(volume * 100).toFixed(1)}%`} className={volume < 0.97 ? "text-down" : ""} />
        <Readout label="Margin" value={`${margin.toFixed(1)}%`} className={margin < 16 ? "text-down" : "text-up"} hint="Was 16%" />
        <Readout label="Profit vs before" value={sgn(((profit - 16) / 16) * 100)} className={tone(profit - 16)} />
      </Out>
    </Grid>
  );
}

/* ---------- 8. Diversification ---------- */

const DSECTORS = ["IT", "Banking", "Consumer", "Pharma", "Autos"] as const;

function DiversifyLab() {
  const [alloc, setAlloc] = useState<number[]>([85, 0, 0, 0, 0]);
  const [shock, setShock] = useState<"IT" | "Banking" | "market">("IT");
  const sum = alloc.reduce((a, b) => a + b, 0);
  const scale = sum > 100 ? 100 / sum : 1;
  const w = alloc.map((a) => a * scale);
  const loss = w.reduce((acc, a, i) => acc + (shock === "market" ? a * 0.12 : DSECTORS[i] === shock ? a * 0.15 : 0), 0);
  const set = (i: number, v: number) => setAlloc((cur) => cur.map((x, j) => (j === i ? v : x)));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setAlloc([85, 0, 0, 0, 0])}>
          85% IT
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAlloc([20, 20, 20, 20, 20])}>
          20% × 5 sectors
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAlloc([40, 40, 0, 0, 0])}>
          IT + Banking
        </Button>
      </div>
      <Grid>
        <Col>
          {DSECTORS.map((s, i) => (
            <Slider key={s} label={s} value={alloc[i]} min={0} max={100} step={5} onChange={(v) => set(i, v)} show={`${Math.round(w[i])}%`} />
          ))}
          {sum > 100 && <p className="text-xs font-semibold text-brand">Over 100%, scaled down proportionally.</p>}
        </Col>
        <Col>
          <Segmented
            label="Shock"
            value={shock}
            onChange={setShock}
            options={[
              { id: "IT", label: "IT −15%" },
              { id: "Banking", label: "Banks −15%" },
              { id: "market", label: "Whole market −12%" },
            ]}
          />
          <Out>
            <Readout label="Invested" value={`${Math.round(Math.min(sum, 100))}%`} hint="Rest is cash" />
            <Readout label="Portfolio change" value={sgn(-loss, 2)} className={tone(-loss)} />
            <Readout label="On ₹1,00,000" value={inr(-loss * 1000)} className={tone(-loss)} />
            <Readout label="Largest sector" value={`${Math.round(Math.max(...w))}%`} className={Math.max(...w) > 25 ? "text-brand" : ""} />
          </Out>
        </Col>
      </Grid>
    </div>
  );
}

/* ---------- 9. Drawdown ---------- */

function DrawdownLab() {
  const [tab, setTab] = useState<"maths" | "panic">("panic");
  return (
    <div className="space-y-5">
      <Segmented
        label="Drawdown lab"
        value={tab}
        onChange={setTab}
        options={[
          { id: "panic", label: "Panic test" },
          { id: "maths", label: "Recovery maths" },
        ]}
      />
      {tab === "panic" ? <PanicTest /> : <RecoveryMaths />}
    </div>
  );
}

// A scripted crash and recovery: [tick, % from the start]. Fictional, and it ends higher on purpose.
const CRASH: [number, number][] = [
  [0, 0],
  [20, 4],
  [35, -6],
  [48, -18],
  [62, -29],
  [72, -33],
  [84, -26],
  [94, -31],
  [110, -18],
  [128, -6],
  [150, 6],
];
const CRASH_TICKS = 150;
const CRASH_MS = 90;
const HEADLINES: [number, string][] = [
  [0, "Markets steady, investors upbeat"],
  [24, "Global sell-off spreads to Indian shares"],
  [48, "Experts warn the worst may be ahead"],
  [72, "Investors pull money out at a record pace"],
  [100, "Bargain hunters return quietly"],
  [130, "Index wins back its losses"],
];

const CRASH_PATH = (() => {
  let a = 11;
  const r = () => ((a = (a * 16807) % 2147483647) / 2147483647) - 0.5;
  const out: number[] = [];
  let k = 0;
  let wobble = 0;
  for (let i = 0; i <= CRASH_TICKS; i++) {
    while (CRASH[k + 1][0] < i) k++;
    const [i0, v0] = CRASH[k];
    const [i1, v1] = CRASH[k + 1];
    wobble = wobble * 0.6 + r() * 2.2;
    const edge = Math.min(i, CRASH_TICKS - i) < 4 ? 0 : 1;
    out.push(v0 + ((v1 - v0) * (i - i0)) / (i1 - i0) + wobble * edge);
  }
  return out;
})();

function PanicTest() {
  const [i, setI] = useState(0);
  const [running, setRunning] = useState(false);
  const [soldAt, setSoldAt] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setI((n) => Math.min(CRASH_TICKS, n + 1)), CRASH_MS);
    return () => clearInterval(id);
  }, [running]);

  const done = i >= CRASH_TICKS;
  if (done && running) setRunning(false);
  const money = (k: number) => 100000 * (1 + CRASH_PATH[k] / 100);
  const yours = soldAt === null ? money(i) : money(soldAt);
  const peak = Math.max(...CRASH_PATH.slice(0, (soldAt ?? i) + 1));
  const fromPeak = ((1 + CRASH_PATH[soldAt ?? i] / 100) / (1 + peak / 100) - 1) * 100;
  const headline = [...HEADLINES].reverse().find(([at]) => i >= at)![1];
  const scary = !done && soldAt === null && CRASH_PATH[i] < -20;

  const W = 420;
  const H = 170;
  const lo = Math.min(...CRASH_PATH) - 4;
  const hi = Math.max(...CRASH_PATH) + 4;
  const x = (k: number) => 6 + (k / CRASH_TICKS) * (W - 12);
  const y = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (H - 16);
  const line = (from: number, to: number) =>
    CRASH_PATH.slice(from, to + 1)
      .map((v, k) => `${k ? "L" : "M"}${x(from + k).toFixed(1)},${y(v).toFixed(1)}`)
      .join(" ");

  const reset = () => {
    setI(0);
    setSoldAt(null);
    setRunning(true);
  };

  return (
    <Grid>
      <Col>
        <p className="text-sm text-muted">
          You have ₹1,00,000 in a broad market fund. Press start and watch. You can sell at any moment, or hold. There's no right answer to look up.
        </p>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p key={headline} className="animate-alert flex items-center gap-2 text-sm font-bold" aria-live="polite">
            <Icon name="news" size={15} className={CRASH_PATH[i] < -10 ? "text-down" : "text-brand"} /> {headline}
          </p>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" aria-hidden="true">
            <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeDasharray="3 4" />
            {soldAt === null ? (
              <path d={line(0, i)} fill="none" stroke={CRASH_PATH[i] >= 0 ? "var(--up)" : "var(--down)"} strokeWidth={2.2} strokeLinejoin="round" />
            ) : (
              <>
                <path d={line(0, soldAt)} fill="none" stroke="var(--down)" strokeWidth={2.2} strokeLinejoin="round" />
                <path d={line(soldAt, i)} fill="none" stroke="var(--muted)" strokeOpacity={0.6} strokeWidth={1.6} strokeDasharray="4 4" />
                <line x1={x(soldAt)} x2={x(soldAt)} y1={4} y2={H - 4} stroke="var(--brand)" strokeDasharray="2 3" />
                <circle cx={x(soldAt)} cy={y(CRASH_PATH[soldAt])} r={5} fill="var(--brand)" />
                <text x={Math.min(x(soldAt) + 6, W - 60)} y={16} fontSize={11} fontWeight={800} fill="var(--brand)">
                  you sold
                </text>
              </>
            )}
            {!done && <circle cx={x(i)} cy={y(CRASH_PATH[i])} r={3.5} fill="var(--fg)" />}
          </svg>
        </div>
        <div className="flex flex-wrap gap-2">
          {!running && !done && i === 0 && (
            <Button onClick={() => setRunning(true)}>
              <Icon name="play" size={15} /> Start the market
            </Button>
          )}
          {running && soldAt === null && (
            <Button variant="sell" size="lg" className={cx("flex-1", scary && "animate-pulse")} onClick={() => setSoldAt(i)}>
              Sell everything
            </Button>
          )}
          {(done || (soldAt !== null && !running)) && (
            <Button variant="outline" onClick={reset}>
              <Icon name="refresh" size={15} /> Try again
            </Button>
          )}
        </div>
      </Col>
      <Col>
        <Out>
          <Readout label={soldAt === null ? "Your money" : "You sold for"} value={inr(yours)} className={tone(yours - 100000)} />
          <Readout label="From the peak" value={sgn(fromPeak)} className={tone(fromPeak)} />
          {soldAt !== null && <Readout label="If you'd held" value={inr(money(i))} className={tone(money(i) - 100000)} hint={done ? "At the end" : "Right now"} />}
          {soldAt !== null && <Readout label="Cost of selling" value={inr(money(i) - yours)} className={tone(yours - money(i))} />}
        </Out>
        {done && (
          <div className="animate-pop-in rounded-xl border border-brand/40 bg-brand-soft/60 p-4 text-sm">
            <p className="font-bold">
              {soldAt === null
                ? "You held through a fall of over 30%, and came out ahead."
                : CRASH_PATH[soldAt] < -20
                  ? "You sold near the bottom and locked in the loss."
                  : "You sold early in the fall."}
            </p>
            <p className="mt-1 text-muted">
              Selling turns a paper loss into a real one, and you then have to decide when to buy back. This script recovers on purpose; real markets can fall further
              or take years to recover. The point is to plan your position size so that a fall like this doesn't force your hand.
            </p>
          </div>
        )}
      </Col>
    </Grid>
  );
}

function RecoveryMaths() {
  const [fall, setFall] = useState(35);
  const f = fall / 100;
  const need = (f / (1 - f)) * 100;
  const years = (r: number) => Math.log(1 / (1 - f)) / Math.log(1 + r);
  return (
    <Grid>
      <Col>
        <Slider label="Size of the fall" value={fall} min={5} max={90} onChange={setFall} show={`−${fall}%`} />
        <div className="relative h-28 rounded-xl border border-line bg-surface p-3">
          <div className="flex h-full items-end gap-6">
            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-down" style={{ height: `${fall * 0.8}%` }} />
              <span className="text-xs font-semibold text-muted">Loss {fall}%</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-md bg-up" style={{ height: `${Math.min(100, need * 0.8)}%` }} />
              <span className="text-xs font-semibold text-muted">Gain needed {need.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </Col>
      <Out>
        <Readout label="₹1,00,000 becomes" value={inr(100000 * (1 - f))} className="text-down" />
        <Readout label="Gain to recover" value={`+${need.toFixed(1)}%`} className="text-up" />
        <Readout label="Years at 8% a year" value={years(0.08).toFixed(1)} />
        <Readout label="Years at 12% a year" value={years(0.12).toFixed(1)} />
      </Out>
    </Grid>
  );
}

/* ---------- 10. Sources ---------- */

const SOURCES = [
  "Stock-exchange filing by the company",
  "Regulator or government notice",
  "Newspaper report quoting named officials",
  "Brokerage note from one analyst",
  "Anonymous 'sources say' social media post",
  "A sudden jump in the share price",
];
const SHUFFLED = [4, 1, 5, 3, 0, 2];

function SourcesLab() {
  const [order, setOrder] = useState<number[]>(SHUFFLED);
  const [checked, setChecked] = useState(false);
  const moveItem = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
    setChecked(false);
  };
  const correct = order.filter((s, i) => s === i).length;
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {order.map((s, i) => (
          <li
            key={s}
            className={cx(
              "flex items-center gap-3 rounded-xl border p-3 text-sm",
              checked ? (s === i ? "border-up/50 bg-up-soft" : "border-down/40 bg-down-soft") : "border-line bg-surface",
            )}
          >
            <span className="num w-5 font-extrabold text-brand">{i + 1}</span>
            <span className="flex-1 font-semibold">{SOURCES[s]}</span>
            <div className="flex gap-1">
              <button type="button" aria-label={`Move "${SOURCES[s]}" up`} disabled={i === 0} onClick={() => moveItem(i, -1)} className="rounded-lg border border-line px-2 py-1 disabled:opacity-30">
                <Icon name="arrowUp" size={14} />
              </button>
              <button
                type="button"
                aria-label={`Move "${SOURCES[s]}" down`}
                disabled={i === order.length - 1}
                onClick={() => moveItem(i, 1)}
                className="rounded-lg border border-line px-2 py-1 disabled:opacity-30"
              >
                <Icon name="arrowDown" size={14} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setChecked(true)}>
          <Icon name="check" size={16} /> Check my order
        </Button>
        {checked && (
          <p className="text-sm font-semibold">
            {correct === SOURCES.length ? "Perfect. Accountability first, popularity last." : `${correct} of ${SOURCES.length} in the right spot. Official, accountable sources go first.`}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- 11. Rebalance ---------- */

function RebalanceLab() {
  const [target, setTarget] = useState(70);
  const [ret, setRet] = useState(40);
  const stocks0 = 100000 * (target / 100);
  const cash = 100000 - stocks0;
  const stocks = stocks0 * (1 + ret / 100);
  const total = stocks + cash;
  const weight = (stocks / total) * 100;
  const trade = stocks - total * (target / 100);
  return (
    <Grid>
      <Col>
        <Slider label="Target stock weight" value={target} min={30} max={90} step={5} onChange={setTarget} show={`${target}%`} />
        <Slider label="Stock return since last check" value={ret} min={-40} max={60} step={5} onChange={setRet} show={sgn(ret, 0)} />
        <div>
          <p className="mb-1 text-xs font-semibold text-muted">Stocks vs cash now</p>
          <div className="flex h-4 overflow-hidden rounded-full">
            <div className="bg-brand" style={{ width: `${weight}%` }} />
            <div className="flex-1 bg-surface-2" />
          </div>
          <div className="relative h-3">
            <div className="absolute top-0 h-3 w-0.5 bg-fg" style={{ left: `${target}%` }} title="Target" />
          </div>
        </div>
      </Col>
      <Out>
        <Readout label="Portfolio now" value={inr(total)} />
        <Readout label="Stock weight" value={`${weight.toFixed(1)}%`} className={Math.abs(weight - target) > 5 ? "text-brand" : ""} hint={`Target ${target}%`} />
        <Readout
          label="Rebalancing trade"
          value={Math.abs(trade) < 1 ? "None" : `${trade > 0 ? "Sell" : "Buy"} ${inr(Math.abs(trade))}`}
          className={trade > 0 ? "text-down" : trade < 0 ? "text-up" : ""}
          hint={trade > 0 ? "of stocks" : trade < 0 ? "of stocks with cash" : undefined}
        />
        <Readout label="Drift" value={`${(weight - target).toFixed(1)} pts`} />
      </Out>
    </Grid>
  );
}

const LABS: Record<LabId, () => ReactNode> = {
  ownership: OwnershipLab,
  pnl: PnlLab,
  orderbook: OrderBookLab,
  earnings: EarningsLab,
  rates: RatesLab,
  valuation: ValuationLab,
  margins: MarginsLab,
  diversify: DiversifyLab,
  drawdown: DrawdownLab,
  sources: SourcesLab,
  rebalance: RebalanceLab,
};

export function Lab({ id }: { id: LabId }) {
  const C = LABS[id];
  return <C />;
}
