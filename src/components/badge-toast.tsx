"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BADGES, type Badge } from "@/lib/achievements";
import { useApp } from "@/lib/store";
import { Icon } from "./icons";
import { Burst } from "./motion";

const SHOW_MS = 5500;

/** Announces each badge the moment it's earned, wherever the learner is. */
export function BadgeToaster() {
  const { state, hydrated } = useApp();
  // Badges already earned when the page loaded, so a reload doesn't replay old toasts.
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<Badge[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    const ids = Object.keys(state.badges);
    if (!seen.current) {
      seen.current = new Set(ids);
      return;
    }
    const fresh = BADGES.filter((b) => state.badges[b.id] && !seen.current!.has(b.id));
    if (!fresh.length) return;
    for (const b of fresh) seen.current.add(b.id);
    setQueue((q) => [...q, ...fresh]);
  }, [hydrated, state.badges]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), SHOW_MS);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
      {current && (
        <div
          key={current.id}
          role="status"
          className="animate-toast pointer-events-auto flex w-full max-w-sm items-center gap-4 rounded-2xl border border-brand/50 bg-card p-4 shadow-2xl"
        >
          <span className="relative">
            <span className="badge-shine shine-once grid size-12 place-items-center rounded-2xl bg-brand text-on-brand">
              <Icon name={current.icon} size={22} />
            </span>
            <Burst />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand">Badge earned</p>
            <p className="font-bold">{current.title}</p>
            <p className="text-xs text-muted">{current.description}</p>
            <Link
              href="/#badges"
              onClick={() => setQueue((q) => q.slice(1))}
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              See all badges <Icon name="arrowRight" size={12} />
            </Link>
          </div>
          <button type="button" aria-label="Dismiss" onClick={() => setQueue((q) => q.slice(1))} className="self-start text-muted hover:text-fg">
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
