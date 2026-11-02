"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icons";
import { ThemeToggle } from "./theme";
import { cx } from "@/lib/format";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/learn", label: "Learn", icon: "book" },
  { href: "/simulate", label: "Simulate", icon: "chart" },
  { href: "/report", label: "Report", icon: "trophy" },
  { href: "/progress", label: "My data", icon: "shield" },
];

function active(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Stockzz home">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-on-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M15 7h6v6" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Stock<span className="text-brand">zz</span>
      </span>
    </Link>
  );
}

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-1.5 focus:text-on-brand">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1536px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(path, n.href) ? "page" : undefined}
              className={cx(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active(path, n.href) ? "bg-brand-soft text-brand-strong" : "text-muted hover:text-fg",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden rounded-full border border-brand/40 px-2.5 py-1 text-xs font-bold text-brand sm:inline">Paper money only</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur-md md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map((n) => (
          <li key={n.href}>
            <Link
              href={n.href}
              aria-current={active(path, n.href) ? "page" : undefined}
              className={cx("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active(path, n.href) ? "text-brand" : "text-muted")}
            >
              <Icon name={n.icon} size={20} />
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line pb-24 md:pb-0">
      <div className="mx-auto flex max-w-[1536px] flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold text-fg">Stockzz</span> · Learn the market by making decisions. Virtual money and fictional companies only. This is
          education, not investment advice.
        </p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-brand">
            About
          </Link>
          <Link href="/progress" className="hover:text-brand">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
