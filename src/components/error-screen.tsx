"use client";

import { useEffect } from "react";

const STALE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i;
const RELOADED = "stockzz:reloaded-after-error";

/**
 * Shown instead of a blank "Application error" page. A tab left open across a deploy can ask for
 * files that no longer exist, so that case reloads once by itself. Anything else shows the message
 * so it can be reported, with ways to recover. Your saved progress isn't touched.
 */
export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    try {
      if (STALE.test(`${error.name} ${error.message}`) && !sessionStorage.getItem(RELOADED)) {
        sessionStorage.setItem(RELOADED, "1");
        window.location.reload();
      }
    } catch {
      /* storage blocked: fall through to the manual buttons */
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-card p-6 text-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-extrabold">This page hit an error</h1>
      <p className="mt-2 text-sm text-muted">Your progress is saved in this browser and hasn't been lost. Try again, or reload the page.</p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface p-3 text-left text-xs whitespace-pre-wrap text-muted">
        {error.name}: {error.message}
        {error.digest ? `\nRef: ${error.digest}` : ""}
      </pre>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong">
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-10 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:border-brand hover:text-brand"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}
