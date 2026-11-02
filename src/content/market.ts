import type { Company, ProfileId, RiskProfile, SectorId, Ticker } from "@/lib/types";

export const CONFIG = {
  startingCash: 1_00_000_00, // ₹1,00,000 in paise
  totalRounds: 10,
  chargeRate: 0.001, // 0.10% per order
  maxQtyPerOrder: 100_000,
  profileTolerancePct: 15,
} as const;

export const SECTORS: Record<SectorId, { name: string; blurb: string }> = {
  consumer: { name: "Consumer goods", blurb: "Daily-use products: food, personal care, beverages." },
  banking: { name: "Banking", blurb: "Lenders that earn the spread between loan and deposit rates." },
  it: { name: "IT services", blurb: "Software and tech services, mostly sold to overseas clients." },
  auto: { name: "Automobiles", blurb: "Vehicle makers; sales lean on loans and consumer mood." },
  pharma: { name: "Pharma", blurb: "Medicine makers; demand holds up across economic cycles." },
  energy: { name: "Power & energy", blurb: "Capital-heavy power producers, often funded with debt." },
  fintech: { name: "Fintech", blurb: "Young digital-finance firms valued on future growth." },
};

export const SECTOR_ORDER: SectorId[] = ["consumer", "banking", "it", "auto", "pharma", "energy", "fintech"];

export const COMPANIES: Company[] = [
  {
    ticker: "ANNA",
    name: "Annapurna Foods",
    sector: "consumer",
    blurb: "Atta, biscuits and namkeen sold through 7 lakh kirana stores.",
    marketCapCr: 19200,
    startPrice: 480_00,
    history: [0.6, -0.4, 0.9, 0.3, -0.5, 0.7, 0.2, 0.4],
    facts: [
      { label: "Debt", value: "Net cash" },
      { label: "P/E", value: "~40×" },
    ],
  },
  {
    ticker: "SAHY",
    name: "Sahyadri Bank",
    sector: "banking",
    blurb: "Private bank with a big home-loan and small-business book.",
    marketCapCr: 45600,
    startPrice: 760_00,
    history: [-0.3, 0.8, 0.2, -0.9, 0.5, 0.4, -0.1, 0.6],
    facts: [
      { label: "Net interest margin", value: "3.6%" },
      { label: "P/E", value: "~15×" },
    ],
  },
  {
    ticker: "NIMB",
    name: "Nimbus Technologies",
    sector: "it",
    blurb: "Large IT services exporter; 58% of revenue from the US.",
    marketCapCr: 304000,
    startPrice: 1520_00,
    history: [0.4, 0.2, -0.6, 1.1, 0.5, -0.3, 0.7, 0.3],
    facts: [
      { label: "Revenue growth", value: "~11% a year" },
      { label: "P/E", value: "~25×" },
    ],
  },
  {
    ticker: "CODE",
    name: "Codewave Systems",
    sector: "it",
    blurb: "Mid-size IT firm building software for US insurers and banks.",
    marketCapCr: 16200,
    startPrice: 540_00,
    history: [1.2, -0.7, 1.6, 0.8, -1.1, 1.3, 0.6, 0.9],
    facts: [
      { label: "Top-5 client share", value: "52% of revenue" },
      { label: "P/E", value: "~30×" },
    ],
  },
  {
    ticker: "GATI",
    name: "Gati Motors",
    sector: "auto",
    blurb: "Entry-level cars and scooters, strongest in small towns.",
    marketCapCr: 28800,
    startPrice: 720_00,
    history: [0.9, 0.5, -0.4, 1.2, 0.7, -0.2, 1.0, 0.4],
    facts: [
      { label: "Buyers using loans", value: "~70%" },
      { label: "P/E", value: "~26×" },
    ],
  },
  {
    ticker: "MEDI",
    name: "Medilife Pharma",
    sector: "pharma",
    blurb: "Generic medicines for India and regulated export markets.",
    marketCapCr: 52000,
    startPrice: 1040_00,
    history: [0.2, -0.2, 0.3, 0.1, 0.2, -0.1, 0.3, 0.2],
    facts: [
      { label: "Export share", value: "48% of revenue" },
      { label: "P/E", value: "~28×" },
    ],
  },
  {
    ticker: "SURY",
    name: "Suryodaya Power",
    sector: "energy",
    blurb: "Solar and wind developer selling power on long contracts.",
    marketCapCr: 9860,
    startPrice: 290_00,
    history: [1.6, -1.3, 2.0, -0.8, 1.4, 0.7, -1.0, 1.1],
    facts: [
      { label: "Debt-to-equity", value: "2.3×" },
      { label: "P/E", value: "~35×" },
    ],
  },
  {
    ticker: "PAYK",
    name: "PayKaro",
    sector: "fintech",
    blurb: "UPI payments and small-ticket loans app with 5 crore users.",
    marketCapCr: 58000,
    startPrice: 1160_00,
    history: [2.1, -1.6, 2.8, 1.0, -1.9, 2.4, 1.3, 0.8],
    facts: [
      { label: "Profit growth", value: "~45% a year (so far)" },
      { label: "P/E", value: "~80×" },
    ],
  },
];

export const COMPANY: Record<Ticker, Company> = Object.fromEntries(
  COMPANIES.map((c) => [c.ticker, c]),
) as Record<Ticker, Company>;

export const TICKERS = COMPANIES.map((c) => c.ticker);

export const PROFILES: Record<ProfileId, RiskProfile> = {
  cautious: {
    id: "cautious",
    name: "Cautious",
    summary: "Keep roughly half in cash and spread the rest thinly.",
    targetInvestedPct: 50,
    maxSectorPct: 20,
    maxPositionPct: 15,
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    summary: "Put about 70% to work; no sector above a quarter.",
    targetInvestedPct: 70,
    maxSectorPct: 25,
    maxPositionPct: 20,
  },
  growth: {
    id: "growth",
    name: "Growth",
    summary: "Invest about 90% and accept bigger swings, with sector caps.",
    targetInvestedPct: 90,
    maxSectorPct: 35,
    maxPositionPct: 25,
  },
};
