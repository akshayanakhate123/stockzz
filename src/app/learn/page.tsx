"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { CATEGORIES, CATEGORY_ORDER, LESSONS } from "@/content/lessons";
import { useApp } from "@/lib/store";
import type { CategoryId } from "@/lib/types";
import { LessonCard } from "@/components/lesson-card";
import { PageHeader, Progress } from "@/components/ui";
import { cx, share } from "@/lib/format";

export default function LearnPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const done = LESSONS.filter((l) => state.lessons[l.slug]?.status === "completed").length;
  const list = filter === "all" ? LESSONS : LESSONS.filter((l) => l.category === filter);

  return (
    <>
      <PageHeader eyebrow="Learn" title="Lesson library">
        Interactive lessons on how markets work. Each one ends with a quick check and points you to the simulation round where you'll use it.
      </PageHeader>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Filter by topic" className="flex flex-wrap gap-2">
          {(["all", ...CATEGORY_ORDER] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              onClick={() => setFilter(c)}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition",
                filter === c ? "border-brand bg-brand text-on-brand" : "border-line text-muted hover:border-brand/50 hover:text-fg",
              )}
            >
              {c === "all" ? "All topics" : CATEGORIES[c].name}
              <span className={cx("ml-1.5 num text-xs", filter === c ? "opacity-80" : "text-muted/70")}>
                {c === "all" ? LESSONS.length : LESSONS.filter((l) => l.category === c).length}
              </span>
            </button>
          ))}
        </div>
        <div className="w-full max-w-56">
          <p className="mb-1 text-xs font-semibold text-muted">
            {done} of {LESSONS.length} completed
          </p>
          <Progress value={share(done, LESSONS.length)} />
        </div>
      </div>

      {filter !== "all" && (
        <div className="mb-5">
          <h2 className="text-xl font-extrabold">{CATEGORIES[filter].name}</h2>
          <p className="text-sm text-muted">{CATEGORIES[filter].blurb}</p>
        </div>
      )}
      {/* One grid in the recommended order; each card names its topic, so nothing leaves half-empty rows. */}
      <div key={filter} className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((l) => (
          <LessonCard key={l.slug} lesson={l} progress={state.lessons[l.slug]} index={LESSONS.indexOf(l)} />
        ))}
        {filter === "all" && (
          <Link href="/simulate" className="lift hero-glow group flex flex-col justify-between rounded-2xl border border-brand/40 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-on-brand">
              <Icon name="chart" size={20} />
            </span>
            <span className="mt-6 block">
              <span className="block text-lg font-bold group-hover:text-brand">Put it into practice</span>
              <span className="mt-1.5 block text-sm text-muted">Ten rounds of fictional news and ₹1,00,000 of paper money. Each decision is judged on your reasoning.</span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
                Open the simulation <Icon name="arrowRight" size={15} />
              </span>
            </span>
          </Link>
        )}
      </div>
    </>
  );
}
