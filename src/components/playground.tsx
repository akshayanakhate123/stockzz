"use client";

import { useEffect, useRef, useState } from "react";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import { Icon, type IconName } from "./icons";
import { prefersReducedMotion } from "./motion";

const POINTS = 64;
const TICK_MS = 380;
const START = 24000; // ₹240.00, in paise
const QTY = 10;

interface MarketEvent {
  id: string;
  label: string;
  icon: IconName;
  /** % move applied on each of the next ticks. */
  moves: number[];
  why: string;
}

const spread = (total: number, ticks: number) => Array.from({ length: ticks }, () => total / ticks);

const EVENTS: MarketEvent[] = [
  {
    id: "beat",
    label: "Earnings beat",
    icon: "up",
    moves: spread(7, 6),
    why: "Profits came in above what investors expected, so buyers were willing to pay more.",
  },
  {
    id: "hike",
    label: "Rate hike",
    icon: "landmark",
    moves: spread(-4.5, 8),
    why: "Dearer loans squeeze spending and make future profits worth less today.",
  },
  {
    id: "rumour",
    label: "Hot rumour",
    icon: "alert",
    moves: [...spread(6, 3), ...spread(-6.5, 10)],
    why: "An unverified tip spiked the price. With no filing to back it, the move faded.",
  },
  {
    id: "miss",
    label: "Sales miss",
    icon: "down",
    moves: spread(-6, 5),
    why: "Fewer sales than expected, so the market cut what it would pay for future profits.",
  },
];

// Fixed starting history so the server render and the first client render match.
function seedHistory() {
  let a = 7;
  const r = () => (a = (a * 16807) % 2147483647) / 2147483647 - 0.5;
  const out = [START];
  for (let i = 1; i < POINTS; i++) out.unshift(Math.round(out[0] * (1 - r() * 0.006)));
  return out;
}

/** A tiny live market on the home page: poke it with news and watch the price react. */
export function MarketPlayground() {
  const [series, setSeries] = useState(seedHistory);
  const [caption, setCaption] = useState<{
    id: string;
    text: string;
    label: string;
  } | null>(null);
  const [entry, setEntry] = useState<number | null>(null);
  const [closed, setClosed] = useState<number | null>(null);
  const queue = useRef<number[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const still = useRef(false);

  useEffect(() => {
    still.current = prefersReducedMotion();
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || still.current) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      const m = queue.current.shift() ?? 0;
      // A small random wiggle on top of any news, pulled gently back toward ₹240.
      setSeries((s) => {
        const last = s[s.length - 1];
        const pull = ((START - last) / START) * 0.04;
        const noise = (Math.random() - 0.5) * 0.5;
        return [...s.slice(1), Math.max(500, Math.round(last * (1 + (m + noise + pull) / 100)))];
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [visible]);

  const fire = (ev: MarketEvent) => {
    setCaption({ id: `${ev.id}-${Date.now()}`, text: ev.why, label: ev.label });
    if (still.current) {
      // Reduced motion: apply the whole move at once.
      const total = ev.moves.reduce((p, m) => p * (1 + m / 100), 1);
      setSeries((s) => [...s.slice(1), Math.round(s[s.length - 1] * total)]);
    } else queue.current = [...ev.moves];
  };

  const price = series[series.length - 1];
  const open = series[0];
  const dayChg = share(price - open, open);
  const pnl = entry === null ? 0 : (price - entry) * QTY;

  const W = 420;
  const H = 170;
  const lo = Math.min(...series) * 0.995;
  const hi = Math.max(...series) * 1.005;
  const x = (i: number) => (i / (POINTS - 1)) * (W - 54);
  const y = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (H - 16);
  const line = series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const up = price >= open;
  const color = up ? "var(--up)" : "var(--down)";

  return (
    <div ref={box} className="rounded-2xl border border-line bg-card/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-up" />
              <span className="relative size-2 rounded-full bg-up" />
            </span>
            Try it · live demo
          </p>
          <p className="mt-1 font-bold">
            Annapurna Foods <span className="text-muted">· ANNA</span>
          </p>
        </div>
        <div className="num text-right">
          <p className="text-xl font-extrabold">{rupees(price)}</p>
          <p className={cx("text-xs font-bold", toneOf(dayChg))}>{pct(dayChg, { signed: true })}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" aria-hidden="true">
        {entry !== null && (
          <>
            <line x1={0} x2={W - 54} y1={y(entry)} y2={y(entry)} stroke="var(--brand)" strokeDasharray="4 4" />
            <text x={W - 50} y={y(entry) + 4} fontSize={10} fontWeight={700} fill="var(--brand)">
              you buy
            </text>
          </>
        )}
        <path d={`${line} L${x(POINTS - 1)},${H} L0,${H} Z`} fill={color} fillOpacity={0.09} />
        <path d={line} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(POINTS - 1)} cy={y(price)} r={4} fill={color} />
        <circle cx={x(POINTS - 1)} cy={y(price)} r={4} fill={color} className="ping-dot" />
      </svg>

      <p className="mt-1 text-xs font-semibold text-muted">Drop some news on the market:</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
        {EVENTS.map((ev) => (
          <button
            key={ev.id}
            type="button"
            onClick={() => fire(ev)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 hover:border-brand hover:text-brand active:scale-95"
          >
            <Icon name={ev.icon} size={14} /> {ev.label}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-10 text-xs" aria-live="polite">
        {caption ? (
          <p key={caption.id} className="animate-alert">
            <span className="font-bold text-fg">{caption.label}: </span>
            <span className="text-muted">{caption.text}</span>
          </p>
        ) : (
          <p className="text-muted">Prices wiggle even with no news, as buyers and sellers meet. Click a headline to see a real reaction.</p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="num text-xs">
          {entry !== null ? (
            <>
              <span className="text-muted">{QTY} shares · P&L </span>
              <span className={cx("font-extrabold", toneOf(pnl))}>{rupees(pnl, { signed: true })}</span>
            </>
          ) : closed !== null ? (
            <>
              <span className="text-muted">You sold for </span>
              <span className={cx("font-extrabold", toneOf(closed))}>{rupees(closed, { signed: true })}</span>
            </>
          ) : (
            <span className="text-muted">Paper money only. Nothing here is saved.</span>
          )}
        </p>
        {entry === null ? (
          <button
            type="button"
            onClick={() => {
              setEntry(price);
              setClosed(null);
            }}
            className="shrink-0 whitespace-nowrap rounded-lg bg-up px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95 dark:text-black"
          >
            Buy {QTY}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setClosed(pnl);
              setEntry(null);
            }}
            className="shrink-0 whitespace-nowrap rounded-lg bg-down px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95 dark:text-black"
          >
            Sell {QTY}
          </button>
        )}
      </div>
    </div>
  );
}
