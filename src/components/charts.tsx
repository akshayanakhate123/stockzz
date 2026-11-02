"use client";

import { useId, useRef, useState } from "react";
import { compactRupees } from "@/lib/format";

export function Sparkline({ values, width = 96, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / span) * (height - 4)}`).join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <polyline points={pts} pathLength={1} className="draw" fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Area line chart for a value series (paise). Drag, hover or use arrow keys to read any point. */
export function ValueChart({
  points,
  baseline,
  height = 220,
  label = "Portfolio value",
}: {
  points: { label: string; value: number }[];
  baseline?: number;
  height?: number;
  label?: string;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 640;
  const H = height;
  const pad = { l: 56, r: 12, t: 16, b: 26 };
  if (points.length === 0) return null;
  const vals = points.map((p) => p.value).concat(baseline !== undefined ? [baseline] : []);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const extra = (max - min) * 0.15 || max * 0.02 || 1;
  min -= extra;
  max += extra;
  const inner = W - pad.l - pad.r;
  const x = (i: number) => pad.l + (points.length === 1 ? inner / 2 : (i / (points.length - 1)) * inner);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f);
  const h = hover !== null ? points[hover] : null;
  const first = points[0].value;

  const pick = (clientX: number) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const sx = ((clientX - box.left) / box.width) * W;
    const i = points.length === 1 ? 0 : Math.round(((sx - pad.l) / inner) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const last = points.length - 1;
    setHover((cur) => {
      const c = cur ?? last;
      if (e.key === "Home") return 0;
      if (e.key === "End") return last;
      return Math.max(0, Math.min(last, c + (e.key === "ArrowRight" ? 1 : -1)));
    });
  };

  // Floating label, kept inside the plot.
  const tipW = 132;
  const tipX = h && hover !== null ? Math.max(pad.l, Math.min(W - pad.r - tipW, x(hover) - tipW / 2)) : 0;
  const tipY = h ? Math.max(2, y(h.value) - 50) : 0;
  const delta = h ? h.value - first : 0;

  return (
    <figure className="w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full cursor-crosshair touch-pan-y select-none rounded-lg"
        role="img"
        tabIndex={0}
        aria-label={`${label} over time, latest ${compactRupees(points[points.length - 1].value)}. Use left and right arrow keys to read each point.`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {compactRupees(t)}
            </text>
          </g>
        ))}
        {baseline !== undefined && (
          <line x1={pad.l} x2={W - pad.r} y1={y(baseline)} y2={y(baseline)} stroke="var(--muted)" strokeDasharray="4 4" strokeOpacity="0.6" />
        )}
        <path d={area} fill={`url(#g${id})`} className="animate-fade" style={{ animationDelay: "300ms" }} />
        <path key={line} d={line} pathLength={1} fill="none" stroke="var(--brand)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" className="draw" />
        {h && hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--brand)" strokeOpacity="0.5" strokeDasharray="3 3" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={hover === i ? 6 : 3}
              fill={hover === i ? "var(--brand)" : "var(--card)"}
              stroke="var(--brand)"
              strokeWidth="2"
              style={{ transition: "r 0.15s ease, fill 0.15s ease" }}
            />
            {(points.length <= 12 || i % 2 === 0) && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={hover === i ? "var(--fg)" : "var(--muted)"} fontWeight={hover === i ? 700 : 400}>
                {p.label}
              </text>
            )}
          </g>
        ))}
        {h && (
          <g pointerEvents="none" className="animate-fade">
            <rect x={tipX} y={tipY} width={tipW} height={40} rx={8} fill="var(--fg)" />
            <text x={tipX + 10} y={tipY + 17} fontSize="12" fontWeight="700" fill="var(--bg)">
              {compactRupees(h.value)}
            </text>
            <text x={tipX + 10} y={tipY + 32} fontSize="10.5" fill="var(--bg)" fillOpacity="0.75">
              {h.label} · {delta >= 0 ? "+" : "-"}
              {compactRupees(Math.abs(delta))} vs start
            </text>
          </g>
        )}
      </svg>
      <figcaption className="num mt-1 h-5 text-center text-xs text-muted">
        {h ? `${h.label}: ${compactRupees(h.value)}` : "Hover, drag or tap the chart to read any point"}
      </figcaption>
    </figure>
  );
}

/** Horizontal bars for 0–100 scores or any small set of values. */
export function Bars({ items, max, unit = "" }: { items: { label: string; value: number; note?: string }[]; max?: number; unit?: string }) {
  const top = max ?? Math.max(...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((b, i) => (
        <li key={b.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">{b.label}</span>
            <span className="num font-bold text-brand">
              {b.value}
              {unit}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div className="grow-x h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${(b.value / top) * 100}%`, animationDelay: `${i * 90}ms` }} />
          </div>
          {b.note && <p className="mt-0.5 text-xs text-muted">{b.note}</p>}
        </li>
      ))}
    </ul>
  );
}
