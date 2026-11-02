"use client";

import Link from "next/link";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ALIASES, GLOSSARY } from "@/content/glossary";
import { LESSON, LESSONS } from "@/content/lessons";
import { useApp } from "@/lib/store";
import { Icon } from "./icons";

/** A term with a dotted underline; tap or focus it for a plain-language definition. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id];
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btn.current?.getBoundingClientRect();
      if (!r) return;
      const width = Math.min(288, window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 12));
      const above = r.bottom + 180 > window.innerHeight && r.top > 200;
      setPos({ top: above ? r.top - 8 : r.bottom + 8, left, above });
    };
    place();
    const close = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !pop.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!entry) return <>{children}</>;
  const lesson = entry.lesson ? LESSON[entry.lesson] : undefined;
  const learned = lesson && state.lessons[lesson.slug]?.status === "completed";

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="cursor-help underline decoration-brand/60 decoration-dotted decoration-2 underline-offset-[3px] hover:text-brand"
      >
        {children ?? entry.term}
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={pop}
            id={popId}
            role="dialog"
            aria-label={entry.term}
            style={{ top: pos.top, left: pos.left, width: Math.min(288, window.innerWidth - 24), transform: pos.above ? "translateY(-100%)" : undefined }}
            className="fixed z-[60] rounded-xl border border-line-strong bg-card p-4 text-left text-sm font-normal normal-case tracking-normal text-fg shadow-2xl"
          >
            <p className="font-extrabold text-brand">{entry.term}</p>
            <p className="mt-1 leading-relaxed">{entry.def}</p>
            {lesson && (
              <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
                {learned ? "Covered in " : "Taught in "}
                <Link href={`/learn/${lesson.slug}`} className="font-semibold text-brand hover:underline" onClick={() => setOpen(false)}>
                  Lesson {LESSONS.indexOf(lesson) + 1}: {lesson.title}
                </Link>
                {learned && <Icon name="check" size={13} className="ml-1 inline align-[-2px] text-up" />}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATTERN = new RegExp(`(?<![\\p{L}\\d])(${ALIASES.map((a) => esc(a.phrase)).join("|")})(?![\\p{L}])`, "giu");
const LOOKUP = new Map(ALIASES.map((a) => [a.phrase.toLowerCase(), a.id]));

/** Renders plain text, turning the first mention of each glossary term into a <Term>. */
export function GlossaryText({ text, skip = [] }: { text: string; skip?: string[] }) {
  const seen = new Set(skip);
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(PATTERN)) {
    const id = LOOKUP.get(m[0].toLowerCase());
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(text.slice(last, m.index));
    out.push(
      <Term key={m.index} id={id}>
        {m[0]}
      </Term>,
    );
    last = m.index! + m[0].length;
  }
  out.push(text.slice(last));
  return (
    <>
      {out.map((n, i) => (
        <Fragment key={i}>{n}</Fragment>
      ))}
    </>
  );
}
