"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CONFIG, PROFILES } from "@/content/market";
import { ROUNDS } from "@/content/rounds";
import { LESSON } from "@/content/lessons";
import { lessonDone, ROUND_PREREQS } from "@/content/path";
import { ProfileHelper } from "@/components/profile-helper";
import { ReadinessCard } from "@/components/readiness";
import { Term } from "@/components/glossary";
import { actions, useApp } from "@/lib/store";
import type { ProfileId } from "@/lib/types";
import { cx } from "@/lib/format";
import { Icon } from "@/components/icons";
import { Badge, Button, Card, Eyebrow, LinkButton, PageHeader, Skeleton } from "@/components/ui";

export default function SimulateLobby() {
  const { state, hydrated } = useApp();
  const router = useRouter();
  const sim = state.sim;
  const [profile, setProfile] = useState<ProfileId>("balanced");
  const [confirmRestart, setConfirmRestart] = useState(false);

  const start = () => {
    actions.startSim(profile);
    router.push("/simulate/play");
  };
  const restart = () => {
    actions.restartSim(profile);
    setConfirmRestart(false);
    router.push("/simulate/play");
  };

  const resumeHref = sim?.status === "complete" ? "/report" : "/simulate/play";

  return (
    <>
      <PageHeader eyebrow="Simulation" title="Ten rounds. ₹1,00,000. Your calls.">
        React to ten fictional news events with paper money. After each round, a debrief judges your reasoning separately from your profit.
      </PageHeader>

      {!hydrated ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            {sim && (
              <Card className="border-brand/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Eyebrow>{sim.status === "complete" ? "Completed" : "In progress"}</Eyebrow>
                    <p className="mt-1 text-xl font-bold">
                      {sim.status === "complete" ? "You finished all 10 rounds" : `Round ${sim.currentRound} of ${CONFIG.totalRounds}`}
                    </p>
                    <p className="text-sm text-muted">Profile: {PROFILES[sim.profile].name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LinkButton href={resumeHref}>
                      {sim.status === "complete" ? "View report" : "Continue"} <Icon name="arrowRight" size={16} />
                    </LinkButton>
                    <Button variant="outline" onClick={() => setConfirmRestart(true)}>
                      <Icon name="refresh" size={16} /> Restart
                    </Button>
                  </div>
                </div>
                {confirmRestart && (
                  <div className="mt-4 rounded-xl border border-down/40 bg-down-soft p-4 text-sm">
                    <p className="font-bold">Start over with the {PROFILES[profile].name} profile?</p>
                    <p className="mt-1 text-muted">Your current run and its scores will be replaced. Lessons and badges stay.</p>
                    <div className="mt-3 flex gap-2">
                      <Button variant="danger" size="sm" onClick={restart}>
                        Yes, restart
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmRestart(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {sim?.status === "active" ? <ReadinessCard round={sim.currentRound} compact /> : !sim && <ReadinessCard round={1} compact />}

            <Card>
              <h2 className="text-lg font-extrabold">
                {sim ? "Profile for a restart" : (
                  <>
                    1. Choose your <Term id="risk-profile">risk profile</Term>
                  </>
                )}
              </h2>
              <p className="mt-1 text-sm text-muted">
                It's your plan for how much of the ₹1,00,000 to put into shares and how much to keep in cash. Stockzz compares your trades with this plan. It
                doesn't change the news. Not sure? <span className="font-semibold text-fg">Balanced is a good first choice</span>, or let the helper below
                suggest one.
              </p>
              <div role="radiogroup" aria-label="Risk profile" className="stagger mt-4 grid gap-3 sm:grid-cols-3">
                {Object.values(PROFILES).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={profile === p.id}
                    onClick={() => setProfile(p.id)}
                    className={cx(
                      "lift rounded-2xl border-2 p-4 text-left",
                      profile === p.id ? "border-brand bg-brand-soft" : "border-line hover:border-brand/40",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-extrabold">{p.name}</span>
                      {profile === p.id && <Icon name="check" size={16} className="animate-pop text-brand" />}
                    </span>
                    {p.id === "balanced" && (
                      <Badge tone="brand" className="mt-1">
                        Good first choice
                      </Badge>
                    )}
                    <span className="mt-1 block text-sm text-muted">{p.summary}</span>
                    <span className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                      <span className="grow-x h-full rounded-full bg-brand" style={{ width: `${p.targetInvestedPct}%` }} />
                    </span>
                    <span className="mt-3 block space-y-0.5 text-xs">
                      <span className="block">
                        Invest about <b>₹{(p.targetInvestedPct * 1000).toLocaleString("en-IN")}</b>, keep the rest as cash
                      </span>
                      <span className="block">
                        At most <b>₹{(p.maxSectorPct * 1000).toLocaleString("en-IN")}</b> in one industry
                      </span>
                      <span className="block">
                        At most <b>₹{(p.maxPositionPct * 1000).toLocaleString("en-IN")}</b> in one company
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <ProfileHelper onPick={setProfile} />
              {!sim && (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">
                    Starting capital: <span className="font-bold text-fg">₹1,00,000</span> virtual cash
                  </p>
                  <Button size="lg" onClick={start}>
                    <Icon name="play" size={16} /> Start the simulation
                  </Button>
                </div>
              )}
            </Card>

            <section>
              <h2 className="mb-3 text-lg font-extrabold">The ten rounds</h2>
              <ol className="stagger space-y-2">
                {ROUNDS.map((r) => {
                  const played = sim?.rounds.some((x) => x.round === r.id);
                  const current = sim?.status === "active" && sim.currentRound === r.id;
                  return (
                    <li key={r.id}>
                      <div
                        className={cx(
                          "flex items-center gap-4 rounded-2xl border bg-card p-4",
                          current ? "border-brand" : "border-line",
                        )}
                      >
                        <span
                          className={cx(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold",
                            played ? "bg-up text-white dark:text-black" : current ? "bg-brand text-on-brand" : "bg-surface-2 text-muted",
                          )}
                        >
                          {played ? <Icon name="check" size={16} /> : r.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{r.title}</p>
                          <p className="truncate text-sm text-muted">{r.concepts.join(" · ")}</p>
                          {r.id < 10 && (
                            <p className="mt-0.5 text-xs text-muted">
                              Lesson{ROUND_PREREQS[r.id].length > 1 ? "s" : ""}:{" "}
                              {ROUND_PREREQS[r.id].map((slug, i) => (
                                <span key={slug}>
                                  {i > 0 && " + "}
                                  <Link href={`/learn/${slug}`} className={lessonDone(state, slug) ? "text-up" : "hover:text-brand hover:underline"}>
                                    {LESSON[slug].title}
                                    {lessonDone(state, slug) && <Icon name="check" size={13} className="ml-0.5 inline align-[-2px]" />}
                                  </Link>
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                        {played ? (
                          <Link href={`/simulate/review/${r.id}`} className="text-sm font-semibold text-brand hover:underline">
                            Review
                          </Link>
                        ) : current ? (
                          <Badge tone="brand">Up next</Badge>
                        ) : (
                          <Icon name="lock" size={16} className="text-muted" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          <aside className="space-y-6">
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Icon name="flag" size={18} className="text-brand" /> Rules
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm text-fg/90">
                {[
                  "You start with ₹1,00,000 of virtual cash. No real money is involved.",
                  "Each round brings a fictional news event. Buy, sell or hold any of eight fictional companies.",
                  "Orders use whole shares and fill at the price shown. Every order costs a flat 0.10%.",
                  "No spending more cash than you have, no selling shares you don't own, no short-selling.",
                  "Before confirming, you pick your reasoning and the main risk you see. A confirmed round can't be redone.",
                  "Prices then move on a fixed script. The same for everyone, and a debrief explains why.",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <Icon name="target" size={18} className="text-brand" /> What you'll practise
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Reading news for what it changes about future profits",
                  "Sizing positions so one mistake can't sink you",
                  "Telling verified facts from speculation",
                  "Separating good decisions from lucky outcomes",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-up" />
                    {t}
                  </li>
                ))}
              </ul>
            </Card>
            <p className="text-xs text-muted">Simulated results don't predict real-world returns. Stockzz is education, not investment advice.</p>
          </aside>
        </div>
      )}
    </>
  );
}
