# Stockzz

Learn how the stock market works by making decisions, not memorising definitions.

Stockzz has two parts:

- **11 interactive lessons.** Each one walks through the same 7 steps: intro, visual, worked example, a hands-on lab, a 2-question quiz, "apply it" and a recap.
- **A 10-round simulation** with ₹1,00,000 of virtual money and 8 fictional Indian companies. Before every trade you say why you're making it and what the main risk is. A debrief then grades that reasoning separately from the profit.

Everything runs in the browser. There are no accounts, no database and no API keys. Progress is saved in the browser's localStorage.

## Features

| Area | What's there |
| --- | --- |
| Lessons | 11 lessons across 5 topics, each with its own lab: ownership, P&L, order book, results day, rate transmission, P/E, margin squeeze, concentration, drawdown, source ranking, rebalancing |
| Simulation | 3 risk profiles (Cautious, Balanced, Growth), a market table with sparklines, an order ticket with validation and quick actions, live checks against your profile's limits, reasoning and risk capture |
| Debriefs | Outcome timeline, why it happened, a verdict on your decision, what-if replays of the other choices, and a knowledge check |
| Report | 5 skill scores (understanding, reasoning, risk, diversification, consistency), a portfolio value chart, round-by-round table, holdings and order history. A live snapshot shows before Round 10 |
| Extras | 10 badges, a "My data" page with an activity log and an erase button, and day/night/system themes |

## Theme

- **Day:** white and orange (`--brand: #f26b0f`)
- **Night:** black and orange (`--brand: #ff7a1a`)

By default the theme follows the operating system. The toggle in the header switches between System, Day and Night. All colours are CSS variables in [`src/app/globals.css`](src/app/globals.css).

## Run locally

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

Production build:

```bash
npm run build
```

## Deploy on Vercel

1. Create an empty repository on GitHub, without a README or .gitignore.
2. Push this project to it:

```bash
git add -A
```

```bash
git commit -m "Stockzz: lessons, simulation, report"
```

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
```

```bash
git push -u origin main
```

3. Go to [vercel.com/new](https://vercel.com/new), import the repository and click **Deploy**. Vercel detects Next.js automatically. No settings or environment variables are needed.

## Project structure

```
src/
  app/                      pages (Next.js App Router)
    page.tsx                home dashboard
    learn/                  lesson library + /learn/[slug] lesson player
    simulate/               lobby, /play (round desk), /review/[round] (debrief)
    report/                 skill report
    progress/               "My data" page (privacy + erase)
    about/
  components/               UI kit, labs, charts, simulation widgets, theme toggle
  content/
    lessons.ts              all lesson text, quizzes, worked examples
    rounds.ts               all 10 scenarios, decision paths, outcomes
    market.ts               companies, sectors, risk profiles, config
  lib/
    engine.ts               orders, charges, round resolution, path matching, scoring
    portfolio.ts            value, P&L, exposure, profile checks
    store.ts                localStorage-backed state (useSyncExternalStore)
    report.ts, achievements.ts, format.ts, types.ts
```

## Editing content

- **Lessons** live in [`src/content/lessons.ts`](src/content/lessons.ts) and **rounds** in [`src/content/rounds.ts`](src/content/rounds.ts). Both are plain typed data.
- Each round's `paths` are checked in order and the first match wins. The last path must be `{ kind: "any" }`.
- Money is stored in **paise** (integers). For example, ₹480 is `480_00`.
- If you change the saved-state shape in `lib/types.ts`, bump `KEY` in `lib/store.ts` so old browser data is ignored.

## Possible next steps

- Optional Google sign-in with cloud sync (e.g. Supabase) to carry progress across devices
- Privacy-friendly aggregate analytics to measure lesson and round completion
- More scenario packs that reuse the same engine

---

Educational project. Virtual money and fictional companies only. This is not investment advice.
