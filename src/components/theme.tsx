"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { cx } from "@/lib/format";

export type ThemePref = "system" | "light" | "dark";
const KEY = "stockzz-theme";

/** Runs before paint (inlined in <head>) so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();`;

function apply(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    try {
      setPref((localStorage.getItem(KEY) as ThemePref) || "system");
    } catch {
      /* storage blocked */
    }
  }, []);

  useEffect(() => {
    apply(pref);
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => apply("system");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [pref]);

  const choose = (p: ThemePref) => {
    setPref(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* storage blocked */
    }
  };

  const opts: { id: ThemePref; icon: "monitor" | "sun" | "moon"; label: string }[] = [
    { id: "system", icon: "monitor", label: "Match system" },
    { id: "light", icon: "sun", label: "Day theme" },
    { id: "dark", icon: "moon", label: "Night theme" },
  ];

  return (
    <div role="radiogroup" aria-label="Theme" className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={pref === o.id}
          title={o.label}
          aria-label={o.label}
          onClick={() => choose(o.id)}
          className={cx(
            "grid place-items-center rounded-full transition-colors",
            compact ? "h-7 w-7" : "h-8 w-8",
            pref === o.id ? "bg-brand text-on-brand" : "text-muted hover:text-fg",
          )}
        >
          <Icon name={o.icon} size={15} />
        </button>
      ))}
    </div>
  );
}
