// Money is always stored in paise (integer) to avoid floating-point drift.
export type Paise = number;

export type SectorId =
  | "consumer"
  | "banking"
  | "it"
  | "auto"
  | "pharma"
  | "energy"
  | "fintech";

export type Ticker =
  | "ANNA"
  | "SAHY"
  | "NIMB"
  | "CODE"
  | "GATI"
  | "MEDI"
  | "SURY"
  | "PAYK";

export interface Company {
  ticker: Ticker;
  name: string;
  sector: SectorId;
  blurb: string;
  marketCapCr: number;
  startPrice: Paise;
  /** Weekly % moves before Round 1, oldest first. */
  history: number[];
  facts: { label: string; value: string }[];
}

export type ProfileId = "cautious" | "balanced" | "growth";

export interface RiskProfile {
  id: ProfileId;
  name: string;
  summary: string;
  targetInvestedPct: number;
  maxSectorPct: number;
  maxPositionPct: number;
}

/* ---------- Lessons ---------- */

export type CategoryId = "basics" | "trading" | "analysis" | "macro" | "risk";

export type LabId =
  | "ownership"
  | "pnl"
  | "orderbook"
  | "earnings"
  | "rates"
  | "valuation"
  | "margins"
  | "diversify"
  | "drawdown"
  | "sources"
  | "rebalance";

export type Visual =
  | { kind: "flow"; title: string; steps: { label: string; detail: string }[] }
  | {
      kind: "compare";
      title: string;
      left: { title: string; points: string[]; tone: "good" | "bad" | "neutral" };
      right: { title: string; points: string[]; tone: "good" | "bad" | "neutral" };
    }
  | {
      kind: "bars";
      title: string;
      unit: string;
      bars: { label: string; value: number; note?: string }[];
    };

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Lesson {
  slug: string;
  title: string;
  category: CategoryId;
  level: "Beginner" | "Intermediate";
  minutes: number;
  summary: string;
  hook: string;
  intro: string[];
  terms: { term: string; def: string }[];
  visual: Visual;
  example: {
    title: string;
    setup: string;
    steps: { label: string; value: string }[];
    takeaway: string;
  };
  lab: LabId;
  labTitle: string;
  labPrompt: string;
  labInsights: string[];
  quiz: QuizQuestion[];
  applyRound: number;
  applyText: string;
  recap: string[];
}

/* ---------- Simulation ---------- */

export type Side = "buy" | "sell";
export type Action = "buy" | "sell" | "hold";

export interface Order {
  ticker: Ticker;
  side: Side;
  quantity: number;
}

export type Moves = Partial<Record<Ticker, number>>;

export interface OutcomeStep {
  label: string;
  headline: string;
  detail: string;
  moves: Moves;
  reasons: Partial<Record<Ticker, string>>;
}

export interface Choice {
  id: string;
  text: string;
  feedback: string;
  score: number;
}

export interface Rationale extends Choice {
  implies: Action[];
}

export type PathMatch =
  | { kind: "hold" }
  | { kind: "buy"; tickers?: Ticker[]; minExposurePct?: number; maxExposurePct?: number }
  | { kind: "sell"; tickers?: Ticker[]; fullExit?: boolean }
  | {
      kind: "portfolio";
      traded?: boolean;
      withinProfile?: boolean;
      minSectorPct?: number;
      minCashPct?: number;
      maxCashPct?: number;
    }
  | { kind: "any" };

export interface DecisionPath {
  id: string;
  label: string;
  match: PathMatch;
  feedback: string;
  tradeOff: string;
  score: number;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  /** value is in rupees; "all" sells the full holding. */
  orders: { ticker: Ticker; side: Side; mode: "value" | "all"; value?: number }[];
}

export type SpecialPanel = "concentration" | "rumour" | "rebalance";

export interface Round {
  id: number;
  /** Companies the headline is about; tagged in the market watch. */
  inNews: Ticker[];
  title: string;
  concepts: string[];
  objective: string;
  headline: string;
  source: string;
  verified: boolean;
  background: string;
  facts: string[];
  questions: string[];
  special?: SpecialPanel;
  marketOpen?: { headline: string; moves: Moves; reasons: Partial<Record<Ticker, string>> };
  rationales: Rationale[];
  risks: Choice[];
  outcome: OutcomeStep[];
  assumptions: string[];
  why: string;
  watch: string[];
  paths: DecisionPath[];
  quickActions: QuickAction[];
  check: QuizQuestion;
  lessonSlug: string;
}

export interface Holding {
  quantity: number;
  costBasis: Paise;
}

export interface Transaction {
  id: string;
  round: number;
  ticker: Ticker;
  side: Side;
  quantity: number;
  price: Paise;
  value: Paise;
  charges: Paise;
  realized: Paise;
}

export interface Ledger {
  cash: Paise;
  holdings: Partial<Record<Ticker, Holding>>;
  realized: Paise;
  charges: Paise;
  transactions: Transaction[];
}

export type Prices = Record<Ticker, Paise>;

export interface RoundScores {
  reasoning: number;
  risk: number;
  diversification: number | null;
  consistent: boolean;
  comprehension: number | null;
}

/** The learner's guess, made before confirming, of how far one stock moves by the end of the round. */
export interface Prediction {
  ticker: Ticker;
  pct: number;
}

export interface RoundResult {
  round: number;
  orders: Order[];
  rationaleId: string;
  riskId: string;
  pathId: string;
  pricesBefore: Prices;
  pricesAfter: Prices;
  ledgerBefore: Ledger;
  valueBefore: Paise;
  valueAfter: Paise;
  checkAnswer: number | null;
  prediction?: Prediction;
  scores: RoundScores;
  completedAt: number;
}

export interface SimState {
  status: "active" | "complete";
  profile: ProfileId;
  startedAt: number;
  currentRound: number;
  ledger: Ledger;
  prices: Prices;
  priceHistory: Record<Ticker, { label: string; price: Paise }[]>;
  valueHistory: { label: string; value: Paise }[];
  rounds: RoundResult[];
}

export interface LessonProgress {
  status: "in-progress" | "completed";
  step: number;
  quiz: Record<string, { answer: number; correct: boolean }>;
  openedAt: number;
  completedAt?: number;
}

export interface AppEvent {
  name: EventName;
  at: number;
  props?: Record<string, string | number>;
}

export type EventName =
  | "lesson_opened"
  | "lesson_completed"
  | "quiz_answered"
  | "sim_started"
  | "sim_restarted"
  | "order_placed"
  | "round_completed"
  | "debrief_viewed"
  | "check_answered"
  | "sim_completed";

export interface AppState {
  version: 1;
  lessons: Record<string, LessonProgress>;
  sim: SimState | null;
  badges: Record<string, number>;
  events: AppEvent[];
}
