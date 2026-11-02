"use client";

import { COMPANY, CONFIG, PROFILES, SECTORS } from "@/content/market";
import { checkProfile, portfolioValue, positions, sectorWeights, totalPnl, unrealized } from "@/lib/portfolio";
import { cx, pct, rupees, share, toneOf } from "@/lib/format";
import type { Ledger, Prices, ProfileId } from "@/lib/types";
import { Icon } from "./icons";
import { Term } from "./glossary";
import type { ReactNode } from "react";
import { AnimatedNumber } from "./motion";

export function PortfolioStrip({ ledger, prices }: { ledger: Ledger; prices: Prices }) {
  const value = portfolioValue(ledger, prices);
  const pnl = totalPnl(ledger, prices);
  const unreal = unrealized(ledger, prices);
  const items = [
    { label: <Term id="portfolio-value">Portfolio value</Term>, value: <AnimatedNumber value={value} format={(n) => rupees(n)} />, sub: "Cash + holdings at today's prices" },
    { label: <Term id="cash-available">Cash available</Term>, value: <AnimatedNumber value={ledger.cash} format={(n) => rupees(n)} />, sub: `${pct(share(ledger.cash, value), { digits: 1 })} of portfolio` },
    { label: <Term id="unrealised">Unrealised P&L</Term>, value: <AnimatedNumber value={unreal} format={(n) => rupees(n, { signed: true })} />, tone: toneOf(unreal), sub: `Realised ${rupees(ledger.realized, { signed: true })}` },
    { label: <Term id="total-pnl">Total P&L</Term>, value: <AnimatedNumber value={pnl} format={(n) => rupees(n, { signed: true })} />, tone: toneOf(pnl), sub: `${pct(share(pnl, CONFIG.startingCash), { signed: true })} on ₹1,00,000` },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
      {items.map((i, k) => (
        <div key={k} className="bg-card px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{i.label}</dt>
          <dd className={cx("num mt-1 text-lg font-extrabold sm:text-xl", i.tone)}>{i.value}</dd>
          <dd className="num text-xs text-muted">{i.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Ten segments: done rounds filled, the current one half-lit. */
export function RoundProgress({ current, done }: { current: number; done: number }) {
  return (
    <div className="flex gap-1.5" aria-label={`Round ${current} of ${CONFIG.totalRounds}`}>
      {Array.from({ length: CONFIG.totalRounds }, (_, i) => (
        <span
          key={i}
          className={cx("h-1.5 flex-1 rounded-full", i < done ? "bg-brand" : i === current - 1 ? "bg-brand/50" : "bg-surface-2")}
        />
      ))}
    </div>
  );
}

function LimitRow({
  label,
  now,
  after,
  limit,
  ok,
  soft,
  unit = "%",
  mode = "max",
}: {
  label: ReactNode;
  now: number;
  after?: number;
  limit: string;
  ok: boolean;
  soft?: boolean;
  unit?: string;
  mode?: "max" | "target";
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="font-semibold">{label}</span>
      <span className="num flex items-center gap-2">
        <span className="text-muted">{now.toFixed(1)}{unit}</span>
        {after !== undefined && Math.abs(after - now) > 0.05 && (
          <>
            <Icon name="arrowRight" size={12} className="text-muted" />
            <span className="font-bold">{after.toFixed(1)}{unit}</span>
          </>
        )}
        <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", soft ? "bg-surface-2 text-muted" : ok ? "bg-up-soft text-up" : "bg-down-soft text-down")}>
          {mode === "target" ? "target " : "≤ "}
          {limit}
        </span>
      </span>
    </div>
  );
}

/**
 * Compares exposure (now and, optionally, after pending trades) with the risk profile.
 * `soft` shows the limits as neutral guidance for learners who haven't met diversification yet.
 */
export function ProfileLimits({ profile, ledger, prices, after, soft = false }: { profile: ProfileId; ledger: Ledger; prices: Prices; after?: Ledger; soft?: boolean }) {
  const p = PROFILES[profile];
  const now = checkProfile(ledger, prices, profile);
  const next = after ? checkProfile(after, prices, profile) : undefined;
  const shown = next ?? now;
  return (
    <div>
      <div className="divide-y divide-line">
        <LimitRow label="Invested" now={now.e.investedPct} after={next?.e.investedPct} limit={`${p.targetInvestedPct}% ±${CONFIG.profileTolerancePct}`} ok={shown.investedOk} mode="target" soft={soft} />
        <LimitRow
          label={
            <>
              Largest <Term id="sector">sector</Term>
              {shown.e.maxSector ? ` (${SECTORS[shown.e.maxSector].name})` : ""}
            </>
          }
          now={now.e.maxSectorPct}
          after={next?.e.maxSectorPct}
          limit={`${p.maxSectorPct}%`}
          ok={shown.sectorOk}
          soft={soft}
        />
        <LimitRow
          label={`Largest stock${shown.e.maxPosition ? ` (${COMPANY[shown.e.maxPosition].name})` : ""}`}
          now={now.e.maxPositionPct}
          after={next?.e.maxPositionPct}
          limit={`${p.maxPositionPct}%`}
          ok={shown.positionOk}
          soft={soft}
        />
      </div>
      {soft ? (
        <p className="mt-2 flex gap-1.5 text-xs text-muted">
          <Icon name="info" size={14} className="mt-px shrink-0 text-brand" />
          <span>
            A guide, not a rule: your <Term id="risk-profile">{p.name} plan</Term> aims for about {p.targetInvestedPct}% invested, at most {p.maxSectorPct}% in one
            industry and {p.maxPositionPct}% in one company. The Diversification lesson explains why. For now, just notice how big each position is.
          </span>
        </p>
      ) : (
        <p className={cx("mt-2 flex items-center gap-1.5 text-xs font-semibold", shown.within ? "text-up" : "text-down")}>
          <Icon name={shown.within ? "check" : "alert"} size={14} />
          {shown.within ? `Within your ${p.name} profile` : `Outside your ${p.name} profile`}
          {next ? " after these trades" : ""}
        </p>
      )}
    </div>
  );
}

export function SectorBars({ ledger, prices }: { ledger: Ledger; prices: Prices }) {
  const rows = sectorWeights(ledger, prices);
  const value = portfolioValue(ledger, prices);
  if (rows.length === 0) return <p className="text-sm text-muted">No holdings yet. You're 100% cash.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.sector} className="grid grid-cols-[110px_1fr_52px] items-center gap-2 text-sm">
          <span className="truncate font-semibold">{SECTORS[r.sector].name}</span>
          <div className="h-2.5 rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${r.pct}%` }} />
          </div>
          <span className="num text-right font-bold">{r.pct.toFixed(1)}%</span>
        </li>
      ))}
      <li className="grid grid-cols-[110px_1fr_52px] items-center gap-2 text-sm">
        <span className="font-semibold text-muted">Cash</span>
        <div className="h-2.5 rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-muted/50" style={{ width: `${share(ledger.cash, value)}%` }} />
        </div>
        <span className="num text-right font-bold text-muted">{share(ledger.cash, value).toFixed(1)}%</span>
      </li>
    </ul>
  );
}

export function HoldingsTable({ ledger, prices }: { ledger: Ledger; prices: Prices }) {
  const rows = positions(ledger, prices);
  if (rows.length === 0) return <p className="text-sm text-muted">You don't hold any shares.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-xs font-bold uppercase tracking-wider text-muted">
            <th className="py-2 pr-3">Stock</th>
            <th className="py-2 pr-3 text-right">Qty</th>
            <th className="py-2 pr-3 text-right">Avg cost</th>
            <th className="py-2 pr-3 text-right">Price</th>
            <th className="py-2 pr-3 text-right">Value</th>
            <th className="py-2 text-right">P&L</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.ticker} className="num">
              <td className="py-2 pr-3">
                <span className="font-bold">{r.name}</span> <span className="text-xs text-muted">{r.weightPct.toFixed(1)}%</span>
              </td>
              <td className="py-2 pr-3 text-right">{r.quantity}</td>
              <td className="py-2 pr-3 text-right">{rupees(r.avgCost)}</td>
              <td className="py-2 pr-3 text-right">{rupees(r.price)}</td>
              <td className="py-2 pr-3 text-right font-semibold">{rupees(r.value, { whole: true })}</td>
              <td className={cx("py-2 text-right font-semibold", toneOf(r.pnl))}>
                {rupees(r.pnl, { signed: true, whole: true })} <span className="text-xs">({pct(r.pnlPct, { signed: true, digits: 1 })})</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
