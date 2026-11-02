"use client";

import Link from "next/link";
import { LESSONS } from "@/content/lessons";
import { CONFIG } from "@/content/market";
import { getRound } from "@/content/rounds";
import { starterRemaining } from "@/content/path";
import { WelcomeCard } from "@/components/welcome";
import { MarketPlayground } from "@/components/playground";
import { BADGES } from "@/lib/achievements";
import { pct, rupees, share, toneOf } from "@/lib/format";
import { portfolioValue, totalPnl } from "@/lib/portfolio";
import { useApp } from "@/lib/store";
import { Icon } from "@/components/icons";
import { statusOf } from "@/components/lesson-card";
import { Badge, Card, Eyebrow, LinkButton, Progress, Skeleton, Stat } from "@/components/ui";
import { cx } from "@/lib/format";

export default function HomePage() {
  const { state, hydrated } = useApp();
  const done = LESSONS.filter((l) => state.lessons[l.slug]?.status === "completed").length;
  const sim = state.sim;
  const value = sim ? portfolioValue(sim.ledger, sim.prices) : CONFIG.startingCash;
  const pnl = sim ? totalPnl(sim.ledger, sim.prices) : 0;
  const nextUp = LESSONS.find((l) => state.lessons[l.slug]?.status !== "completed");
  const inProgress = LESSONS.find((l) => state.lessons[l.slug]?.status === "in-progress");
  const starter = starterRemaining(state);
  const onStarter = hydrated && !sim && starter.length > 0;

  const continueCard = (() => {
    if (sim?.status === "active") {
      const played = sim.rounds.some((r) => r.round === sim.currentRound);
      return {
        eyebrow: `Simulation · Round ${sim.currentRound} of ${CONFIG.totalRounds}`,
        title: getRound(sim.currentRound).title,
        href: "/simulate/play",
        cta: played ? "Finish the debrief" : "Continue the round",
      };
    }
    if (inProgress) return { eyebrow: "Lesson in progress", title: inProgress.title, href: `/learn/${inProgress.slug}`, cta: "Resume lesson" };
    if (sim?.status === "complete") return { eyebrow: "Simulation complete", title: "Your report is ready", href: "/report", cta: "See your report" };
    return null;
  })();

  return (
    <div className="space-y-12">
      <section className="hero-glow animate-rise overflow-hidden rounded-3xl border border-line p-6 sm:p-10">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow>Learn by deciding</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Understand the market <span className="text-brand">before</span> you risk a rupee.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Bite-sized interactive lessons, then ten rounds of fictional news with ₹1,00,000 of paper money. Every trade is judged on your reasoning, not just
              whether it made money.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {onStarter ? (
                <LinkButton href={`/learn/${starter[0].slug}`} size="lg">
                  <Icon name="book" size={18} />
                  {starter.length === 2 ? "Start here: 2 lessons · 13 min" : `Last starter lesson: ${starter[0].title}`}
                </LinkButton>
              ) : (
                <LinkButton href={nextUp ? `/learn/${nextUp.slug}` : "/learn"} size="lg">
                  <Icon name="book" size={18} />
                  {nextUp ? `Next lesson: ${nextUp.title}` : "Review the lessons"}
                </LinkButton>
              )}
              <LinkButton href="/simulate" size="lg" variant="outline">
                <Icon name="play" size={16} />
                {sim ? "Open the simulation" : onStarter ? "Skip to the simulation" : "Start Round 1"}
              </LinkButton>
            </div>
          </div>
          <MarketPlayground />
        </div>
        <ol className="stagger mt-8 grid gap-3 md:grid-cols-3">
          {[
            { n: "1", t: "Learn a concept", d: "Short lessons with sliders, labs and a quick check." },
            { n: "2", t: "Make 10 decisions", d: "React to news: buy, sell or hold, and say why." },
            { n: "3", t: "Review your thinking", d: "Debriefs separate good decisions from lucky ones." },
          ].map((s) => (
            <li key={s.n} className="flex gap-4 rounded-2xl border border-line bg-card/80 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand font-extrabold text-on-brand">{s.n}</span>
              <div>
                <p className="font-bold">{s.t}</p>
                <p className="text-sm text-muted">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <WelcomeCard />

      {hydrated && continueCard && (
        <Card className="flex flex-col gap-4 border-brand/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow>{continueCard.eyebrow}</Eyebrow>
            <p className="mt-1 text-xl font-bold">{continueCard.title}</p>
          </div>
          <LinkButton href={continueCard.href}>
            {continueCard.cta}
            <Icon name="arrowRight" size={16} />
          </LinkButton>
        </Card>
      )}

      <section aria-label="Your progress" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {hydrated ? (
          <>
            <Stat label="Lessons" value={`${done}/${LESSONS.length}`} sub={<Progress value={share(done, LESSONS.length)} className="mt-2" />} />
            <Stat
              label="Simulation"
              value={!sim ? "-" : sim.status === "complete" ? "Done" : `R${sim.currentRound}`}
              sub={!sim ? "Not started" : sim.status === "complete" ? "All 10 rounds played" : `${sim.rounds.length} of 10 rounds played`}
            />
            <Stat label="Portfolio value" value={rupees(value, { whole: true })} sub="Virtual money" />
            <Stat
              label="Total P&L"
              value={rupees(pnl, { signed: true, whole: true })}
              tone={toneOf(pnl)}
              sub={pct(share(pnl, CONFIG.startingCash), { signed: true })}
            />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)
        )}
      </section>

      <section className="reveal">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Learning path</Eyebrow>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">11 lessons, in the order we recommend</h2>
          </div>
          <Link href="/learn" className="hidden text-sm font-semibold text-brand hover:underline sm:block">
            Browse by topic <Icon name="arrowRight" size={14} className="inline" />
          </Link>
        </div>
        <ol className="stagger relative space-y-3 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
          {LESSONS.map((l, i) => {
            const st = statusOf(state.lessons[l.slug]);
            return (
              <li key={l.slug} className="group relative flex gap-4">
                <span
                  className={cx(
                    "z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold transition-transform duration-300 group-hover:scale-110",
                    st.tone === "up" ? "border-up bg-up text-white dark:text-black" : st.tone === "brand" ? "border-brand bg-brand-soft text-brand" : "border-line bg-card text-muted",
                  )}
                >
                  {st.tone === "up" ? <Icon name="check" size={16} /> : i + 1}
                </span>
                <Link
                  href={`/learn/${l.slug}`}
                  className="lift flex flex-1 flex-col gap-1 rounded-2xl border border-line bg-card px-4 py-3 hover:border-brand/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-bold">{l.title}</span>
                    <span className="block text-sm text-muted">{l.summary}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted">
                    {l.minutes} min · Round {l.applyRound}
                    {hydrated && <Badge tone={st.tone}>{st.label}</Badge>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="badges" className="reveal scroll-mt-24">
        <Eyebrow>Badges</Eyebrow>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
          {hydrated ? Object.keys(state.badges).length : 0} of {BADGES.length} earned
        </h2>
        <ul className="stagger mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BADGES.map((b) => {
            const got = hydrated && !!state.badges[b.id];
            return (
              <li
                key={b.id}
                className={cx(
                  "group lift rounded-2xl border p-4 text-center",
                  got ? "border-brand/50 bg-brand-soft" : "border-line bg-card opacity-70 hover:opacity-100",
                )}
              >
                <div
                  className={cx(
                    "mx-auto grid size-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110",
                    got ? "badge-shine bg-brand text-on-brand" : "bg-surface-2 text-muted",
                  )}
                >
                  <Icon name={got ? b.icon : "lock"} size={22} />
                </div>
                <p className="mt-2 text-sm font-bold">{b.title}</p>
                <p className="mt-0.5 text-xs text-muted">{b.description}</p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider">{got ? <span className="text-brand">Earned</span> : <span className="text-muted">Locked</span>}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
