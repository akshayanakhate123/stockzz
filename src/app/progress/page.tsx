"use client";

import { useState } from "react";
import { actions, useApp } from "@/lib/store";
import type { EventName } from "@/lib/types";
import { Icon } from "@/components/icons";
import { Button, Card, PageHeader, Skeleton } from "@/components/ui";

const EVENT_LABELS: Record<EventName, string> = {
  lesson_opened: "Lesson opened",
  lesson_completed: "Lesson completed",
  quiz_answered: "Quiz answered",
  sim_started: "Simulation started",
  sim_restarted: "Simulation restarted",
  order_placed: "Order placed",
  round_completed: "Round completed",
  debrief_viewed: "Debrief viewed",
  check_answered: "Knowledge check answered",
  sim_completed: "Simulation completed",
};

export default function ProgressPage() {
  const { state, hydrated, storageError } = useApp();
  const [confirm, setConfirm] = useState(false);
  const [erased, setErased] = useState(false);

  if (!hydrated) return <Skeleton className="h-96" />;

  const counts = Object.keys(EVENT_LABELS).map((k) => ({
    name: k as EventName,
    count: state.events.filter((e) => e.name === k).length,
  }));
  const recent = [...state.events].reverse().slice(0, 15);

  return (
    <>
      <PageHeader eyebrow="Privacy" title="Your data">
        Stockzz has no accounts and no servers storing your progress. Everything below lives only in this browser's local storage.
      </PageHeader>

      {storageError && (
        <Card className="mb-6 border-down/40">
          <p className="flex items-center gap-2 font-bold text-down">
            <Icon name="alert" size={16} /> Your browser is blocking storage
          </p>
          <p className="mt-1 text-sm text-muted">Progress works for this visit but won't be saved after you close the tab.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-extrabold">What's stored</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              `Lesson progress: ${Object.keys(state.lessons).length} lesson(s) opened`,
              `Simulation state: ${state.sim ? `${state.sim.rounds.length} round(s) played` : "not started"}`,
              `Badges: ${Object.keys(state.badges).length} earned`,
              `Activity log: last ${state.events.length} event(s), capped at 300`,
              "Your theme choice (day, night or system)",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-up" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            No real financial information, names, emails or device identifiers are collected. The activity log never leaves your device.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-extrabold">Activity counts</h2>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-line">
              {counts.map((c) => (
                <tr key={c.name}>
                  <td className="py-1.5">{EVENT_LABELS[c.name]}</td>
                  <td className="num py-1.5 text-right font-bold">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-lg font-extrabold">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No activity yet. Open a lesson or start the simulation.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line text-sm">
              {recent.map((e, i) => (
                <li key={i} className="flex justify-between gap-3 py-1.5">
                  <span>
                    {EVENT_LABELS[e.name]}
                    {e.props?.slug ? <span className="text-muted"> · {String(e.props.slug)}</span> : null}
                    {e.props?.round ? <span className="text-muted"> · round {String(e.props.round)}</span> : null}
                  </span>
                  <time className="num shrink-0 text-muted" dateTime={new Date(e.at).toISOString()}>
                    {new Date(e.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border-down/30">
          <h2 className="text-lg font-extrabold">Erase this browser's data</h2>
          <p className="mt-1 text-sm text-muted">Deletes lessons, simulation, badges and the activity log from this browser. This can't be undone.</p>
          {erased && <p className="mt-3 text-sm font-semibold text-up">All Stockzz data in this browser has been erased.</p>}
          {!confirm ? (
            <Button variant="danger" className="mt-4" onClick={() => setConfirm(true)}>
              Erase all data
            </Button>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="sell"
                onClick={() => {
                  actions.resetAll();
                  setConfirm(false);
                  setErased(true);
                }}
              >
                Yes, erase everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
