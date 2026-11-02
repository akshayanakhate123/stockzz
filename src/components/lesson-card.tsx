import Link from "next/link";
import { CATEGORIES } from "@/content/lessons";
import type { Lesson, LessonProgress } from "@/lib/types";
import { Badge } from "./ui";
import { Icon } from "./icons";

export function statusOf(p?: LessonProgress) {
  if (!p) return { label: "Not started", tone: "neutral" as const };
  if (p.status === "completed") return { label: "Completed", tone: "up" as const };
  return { label: "In progress", tone: "brand" as const };
}

export function LessonCard({ lesson, progress, index }: { lesson: Lesson; progress?: LessonProgress; index?: number }) {
  const s = statusOf(progress);
  return (
    <Link
      href={`/learn/${lesson.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand">
          {index !== undefined && <span className="mr-1.5 text-muted">{String(index + 1).padStart(2, "0")}</span>}
          {CATEGORIES[lesson.category].name}
        </span>
        <Badge tone={s.tone}>
          {s.tone === "up" && <Icon name="check" size={12} />}
          {s.label}
        </Badge>
      </div>
      <h3 className="mt-3 text-lg font-bold leading-snug group-hover:text-brand">{lesson.title}</h3>
      <p className="mt-1.5 flex-1 text-sm text-muted">{lesson.summary}</p>
      <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-muted">
        <span>{lesson.level}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <Icon name="clock" size={13} />
          {lesson.minutes} min
        </span>
      </div>
    </Link>
  );
}
