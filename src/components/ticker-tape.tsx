"use client";

import { COMPANIES } from "@/content/market";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import { useApp } from "@/lib/store";
import { Icon } from "./icons";

/** A slow scrolling strip of the eight fictional stocks, coloured by their latest move. Pauses on hover. */
export function TickerTape() {
  const { state } = useApp();
  const sim = state.sim;
  const items = COMPANIES.map((c) => {
    const h = sim?.priceHistory[c.ticker];
    const price = sim ? sim.prices[c.ticker] : c.startPrice;
    const prev = h && h.length >= 2 ? h[h.length - 2].price : sim ? price : Math.round(price / (1 + (c.history.at(-1) ?? 0) / 100));
    return { ticker: c.ticker, price, chg: share(price - prev, prev) };
  });

  const strip = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((it) => (
        <li key={it.ticker} className="num flex items-center gap-2 border-r border-line px-5 py-2 text-xs whitespace-nowrap">
          <span className="font-extrabold">{it.ticker}</span>
          <span className="font-semibold">{rupees(it.price)}</span>
          <span className={cx("inline-flex items-center gap-0.5 font-bold", toneOf(it.chg))}>
            {it.chg !== 0 && <Icon name={it.chg > 0 ? "arrowUp" : "arrowDown"} size={11} />}
            {pct(Math.abs(it.chg))}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="group mb-6 flex items-stretch overflow-hidden rounded-xl border border-line bg-card" aria-label="Simulated stock prices">
      <span className="z-10 flex shrink-0 items-center gap-1.5 border-r border-line bg-brand-soft px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-strong">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand" />
          <span className="relative size-1.5 rounded-full bg-brand" />
        </span>
        {sim ? `Round ${sim.currentRound}` : "Market"}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="marquee flex w-max group-hover:[animation-play-state:paused]">
          {strip(false)}
          {strip(true)}
        </div>
      </div>
    </div>
  );
}
