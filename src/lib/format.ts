import type { Paise } from "./types";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function rupees(p: Paise, opts: { whole?: boolean; signed?: boolean } = {}) {
  const text = (opts.whole ? inrWhole : inr).format(Math.abs(p) / 100);
  if (p < 0) return `−${text}`;
  if (opts.signed && p > 0) return `+${text}`;
  return text;
}

export function compactRupees(p: Paise) {
  const r = Math.abs(p) / 100;
  const sign = p < 0 ? "−" : "";
  if (r >= 1e7) return `${sign}₹${(r / 1e7).toFixed(2)} Cr`;
  if (r >= 1e5) return `${sign}₹${(r / 1e5).toFixed(2)} L`;
  if (r >= 1e3) return `${sign}₹${(r / 1e3).toFixed(1)}K`;
  return `${sign}₹${r.toFixed(0)}`;
}

export function pct(n: number, opts: { digits?: number; signed?: boolean } = {}) {
  const text = `${Math.abs(n).toFixed(opts.digits ?? 2)}%`;
  if (n < 0) return `−${text}`;
  if (opts.signed && n > 0) return `+${text}`;
  return text;
}

/** Share of `part` in `whole`, as a percentage with two decimals. */
export function share(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 10000) / 100;
}

/** Apply a % move to a price in paise. */
export function move(price: Paise, pctMove: number): Paise {
  return Math.round((price * (10000 + Math.round(pctMove * 100))) / 10000);
}

export function toneOf(n: number) {
  return n > 0 ? "text-up" : n < 0 ? "text-down" : "text-muted";
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
