import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "buy" | "sell" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-strong shadow-sm",
  secondary: "bg-brand-soft text-brand-strong hover:brightness-95 dark:hover:brightness-125",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  outline: "border border-line-strong text-fg hover:border-brand hover:text-brand",
  buy: "bg-up text-white dark:text-black hover:brightness-110",
  sell: "bg-down text-white dark:text-black hover:brightness-110",
  danger: "border border-down/40 text-down hover:bg-down-soft",
};
const SIZES: Record<Size, string> = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({ variant, size, className, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...rest} />;
}

export function LinkButton({ variant, size, className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-2xl border border-line bg-card p-5 shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "brand" | "up" | "down"; children: ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    brand: "bg-brand-soft text-brand-strong",
    up: "bg-up-soft text-up",
    down: "bg-down-soft text-down",
  };
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{children}</p>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 animate-rise">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted">{children}</div>}
    </header>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "up" | "down" }) {
  const fill = { brand: "bg-brand", up: "bg-up", down: "bg-down" }[tone];
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("grow-x h-full rounded-full transition-[width] duration-500", fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string }) {
  return (
    <div className="lift rounded-2xl border border-line bg-card p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={cx("num mt-1.5 text-2xl font-extrabold tracking-tight", tone)}>{value}</p>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-2xl bg-surface-2", className)} />;
}

export function Callout({ tone = "brand", title, children }: { tone?: "brand" | "up" | "down" | "neutral"; title?: string; children: ReactNode }) {
  const tones = {
    brand: "border-brand/30 bg-brand-soft",
    up: "border-up/30 bg-up-soft",
    down: "border-down/30 bg-down-soft",
    neutral: "border-line bg-surface",
  };
  return (
    <div className={cx("rounded-xl border p-4 text-sm", tones[tone])}>
      {title && <p className="mb-1 font-bold">{title}</p>}
      <div className="text-fg/90">{children}</div>
    </div>
  );
}
