"use client";

import { useMemo, useState } from "react";
import { getRound } from "@/content/rounds";
import { applyOrder, quickOrders } from "@/lib/engine";
import { cx, rupees, toneOf } from "@/lib/format";
import type { DecisionPath, RoundResult } from "@/lib/types";
import { buildPaths, TICKS, valueAt } from "./replay";

/**
 * Your portfolio line through the round, with each alternative decision drawn as a ghost line on
 * the same price paths as the replay. Pick an alternative to bring its line forward.
 */
export function WhatIfChart({ result, path }: { result: RoundResult; path: DecisionPath }) {
  const round = getRound(result.round);
  const total = round.outcome.length * TICKS;
  const paths = useMemo(() => buildPaths(result.round, result.pricesBefore), [result]);

  const lines = useMemo(() => {
    const series = (orders: typeof result.orders) => {
      let l = result.ledgerBefore;
      for (const o of orders) l = applyOrder(l, o, result.pricesBefore, { id: "alt", round: result.round }).ledger;
      return Array.from({ length: total + 1 }, (_, i) => valueAt(l, (t) => paths[t][i]));
    };
    const yours = series(result.orders);
    const alts = round.quickActions.flatMap((qa) => {
      const orders = quickOrders(qa, result.ledgerBefore, result.pricesBefore);
      if (qa.orders.length > 0 && orders.length === 0) return [];
      return [{ id: qa.id, label: qa.label, values: series(orders) }];
    });
    return { yours, alts };
  }, [result, round, paths, total]);

  const [pick, setPick] = useState(lines.alts[0]?.id ?? "");
  const all = [lines.yours, ...lines.alts.map((a) => a.values)].flat();
  const lo = Math.min(result.valueBefore, ...all);
  const hi = Math.max(result.valueBefore, ...all);
  const extra = (hi - lo) * 0.12 || hi * 0.004 || 1;
  const W = 640;
  const H = 230;
  const pad = { l: 8, r: 96, t: 14, b: 14 };
  const x = (k: number) => pad.l + (k / total) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo + extra) / (hi - lo + 2 * extra)) * (H - pad.t - pad.b);
  const d = (vals: number[]) => vals.map((v, k) => `${k ? "L" : "M"}${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const chosen = lines.alts.find((a) => a.id === pick);
  const yourEnd = lines.yours[total];
  const altEnd = chosen?.values[total];

  // Keep end labels apart when the two lines finish close together.
  let yLabelYou = y(yourEnd);
  let yLabelAlt = altEnd !== undefined ? y(altEnd) : 0;
  if (altEnd !== undefined && Math.abs(yLabelYou - yLabelAlt) < 16) {
    const mid = (yLabelYou + yLabelAlt) / 2;
    const up = yourEnd >= altEnd;
    yLabelYou = mid + (up ? -8 : 8);
    yLabelAlt = mid + (up ? 8 : -8);
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Compare with" className="flex flex-wrap gap-1.5">
        {lines.alts.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={pick === a.id}
            onClick={() => setPick(a.id)}
            className={cx(
              "rounded-full border px-3 py-1 text-xs font-bold transition",
              pick === a.id ? "border-fg/60 bg-surface-2 text-fg" : "border-line text-muted hover:border-fg/40 hover:text-fg",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Your decision ended at ${rupees(yourEnd)}${chosen && altEnd !== undefined ? `; ${chosen.label} would have ended at ${rupees(altEnd)}` : ""}.`}
      >
        <line x1={pad.l} x2={W - pad.r} y1={y(result.valueBefore)} y2={y(result.valueBefore)} stroke="var(--line-strong)" strokeDasharray="4 5" />
        {lines.alts
          .filter((a) => a.id !== pick)
          .map((a) => (
            <path key={a.id} d={d(a.values)} fill="none" stroke="var(--muted)" strokeOpacity={0.25} strokeWidth={1.4} />
          ))}
        {chosen && altEnd !== undefined && (
          <g key={chosen.id} className="animate-fade">
            <path d={d(chosen.values)} fill="none" stroke="var(--fg)" strokeOpacity={0.55} strokeWidth={2} strokeDasharray="6 5" />
            <circle cx={x(total)} cy={y(altEnd)} r={3.5} fill="var(--fg)" fillOpacity={0.55} />
            <text x={x(total) + 8} y={yLabelAlt + 4} fontSize={11} fontWeight={700} fill="var(--muted)" className="num">
              {rupees(altEnd - result.valueBefore, { signed: true, whole: true })}
            </text>
          </g>
        )}
        <path d={d(lines.yours)} fill="none" stroke="var(--brand)" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(total)} cy={y(yourEnd)} r={4.5} fill="var(--brand)" />
        <text x={x(total) + 8} y={yLabelYou + 4} fontSize={12} fontWeight={800} fill="var(--brand)" className="num">
          {rupees(yourEnd - result.valueBefore, { signed: true, whole: true })}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="h-0.5 w-5 rounded bg-brand" /> Your decision ({path.label})
        </span>
        {chosen && altEnd !== undefined && (
          <span className="flex items-center gap-1.5 font-semibold text-muted">
            <span className="w-5 border-t-2 border-dashed border-fg/50" /> {chosen.label}:{" "}
            <span className={cx("num", toneOf(yourEnd - altEnd))}>
              you did {rupees(Math.abs(yourEnd - altEnd), { whole: true })} {yourEnd >= altEnd ? "better" : "worse"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
