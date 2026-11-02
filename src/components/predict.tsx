"use client";

import { useRef } from "react";
import { COMPANY } from "@/content/market";
import { cx, move, pct, rupees } from "@/lib/format";
import type { Ticker } from "@/lib/types";
import { Icon } from "./icons";

export const PREDICT_RANGE = 15;
const STEP = 0.5;
const MIN = -PREDICT_RANGE;

const snap = (n: number) => Math.max(-PREDICT_RANGE, Math.min(PREDICT_RANGE, Math.round(n / STEP) * STEP));

/**
 * Drag the handle up or down to call where a stock ends up once the round plays out.
 * The guess isn't scored into the rubric; it's revealed during the replay and tracked as calibration.
 */
export function PredictChart({
  ticker,
  history,
  value,
  onChange,
}: {
  ticker: Ticker;
  history: number[];
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const W = 360;
  const H = 170;
  const pad = { l: 8, r: 64, t: 14, b: 14 };
  const now = history[history.length - 1];
  const hi = move(now, PREDICT_RANGE);
  const lo = move(now, -PREDICT_RANGE);
  const min = Math.min(lo, ...history);
  const max = Math.max(hi, ...history);
  const splitX = pad.l + (W - pad.l - pad.r) * 0.62;
  const handleX = W - pad.r + 18;
  const x = (i: number) => pad.l + (i / Math.max(1, history.length - 1)) * (splitX - pad.l);
  const y = (p: number) => pad.t + (1 - (p - min) / (max - min)) * (H - pad.t - pad.b);
  const line = history.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p)}`).join(" ");
  const guessPrice = value === null ? null : move(now, value);
  const gy = guessPrice === null ? y(now) : y(guessPrice);

  const fromPointer = (clientY: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const sy = ((clientY - box.top) / box.height) * H;
    const price = min + (1 - (sy - pad.t) / (H - pad.t - pad.b)) * (max - min);
    onChange(snap(((price - now) / now) * 100));
  };

  const onKey = (e: React.KeyboardEvent) => {
    const d = {
      ArrowUp: STEP,
      ArrowRight: STEP,
      ArrowDown: -STEP,
      ArrowLeft: -STEP,
      PageUp: 2,
      PageDown: -2,
    }[e.key];
    if (d === undefined && e.key !== "Home" && e.key !== "Delete" && e.key !== "Backspace") return;
    e.preventDefault();
    if (e.key === "Delete" || e.key === "Backspace") return onChange(null);
    onChange(e.key === "Home" ? 0 : snap((value ?? 0) + (d ?? 0)));
  };

  const tone = value === null ? "brand" : value > 0 ? "up" : value < 0 ? "down" : "brand";
  const color = `var(--${tone})`;

  return (
    <div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-ns-resize touch-none select-none rounded-xl border border-line bg-surface"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          fromPointer(e.clientY);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        aria-hidden="true"
      >
        {/* The "after the news" zone */}
        <rect x={splitX} y={0} width={W - splitX} height={H} fill="color-mix(in srgb, var(--brand) 6%, transparent)" />
        <line x1={splitX} x2={splitX} y1={0} y2={H} stroke="var(--line-strong)" strokeDasharray="3 4" />
        <text x={splitX + 6} y={12} fontSize={9} fontWeight={700} fill="var(--muted)" letterSpacing="0.08em">
          AFTER THE NEWS
        </text>
        <line x1={pad.l} x2={W - pad.r + 30} y1={y(now)} y2={y(now)} stroke="var(--line-strong)" strokeDasharray="2 4" />
        <path d={line} fill="none" stroke="var(--fg)" strokeOpacity={0.7} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={splitX} cy={y(now)} r={3.5} fill="var(--fg)" />
        <path
          d={`M${splitX},${y(now)} L${handleX},${gy}`}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeDasharray="5 4"
          className="transition-[d] duration-100"
        />
        {/* Handle */}
        <g transform={`translate(${handleX},${gy})`} className="transition-transform duration-100">
          {value === null && <circle r={10} fill={color} className="ping-dot" />}
          <circle r={10} fill="var(--card)" stroke={color} strokeWidth={2.5} />
          <path
            d="M-3.5,-1.5 L0,-5 L3.5,-1.5 M-3.5,1.5 L0,5 L3.5,1.5"
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <text x={handleX + 15} y={gy + 4} fontSize={12} fontWeight={800} fill={color} className="num">
          {value === null ? "?" : pct(value, { signed: true, digits: 1 })}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Your guess for ${COMPANY[ticker].name}'s move by the end of the round`}
          aria-valuemin={MIN}
          aria-valuemax={PREDICT_RANGE}
          aria-valuenow={value ?? 0}
          aria-valuetext={value === null ? "No guess yet" : `${pct(value, { signed: true, digits: 1 })}, about ${rupees(guessPrice!)}`}
          onKeyDown={onKey}
          className="flex items-center gap-2 rounded-lg px-1 py-0.5"
        >
          <Icon name="drag" size={15} className="text-brand" />
          {value === null ? (
            <span className="text-muted">Drag the handle, or focus here and use the arrow keys</span>
          ) : (
            <span>
              Your call: <span className={cx("num font-extrabold", `text-${tone}`)}>{pct(value, { signed: true, digits: 1 })}</span>
              <span className="num text-muted"> to about {rupees(guessPrice!)}</span>
            </span>
          )}
        </div>
        {value !== null && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-muted hover:text-fg">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
