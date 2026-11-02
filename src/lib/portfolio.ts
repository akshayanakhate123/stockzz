import { COMPANY, CONFIG, PROFILES, SECTOR_ORDER } from "@/content/market";
import { share } from "./format";
import type { Ledger, Paise, Prices, ProfileId, SectorId, Ticker } from "./types";

export function holdingsValue(l: Ledger, prices: Prices): Paise {
  let total = 0;
  for (const [t, h] of Object.entries(l.holdings)) {
    if (h) total += h.quantity * prices[t as Ticker];
  }
  return total;
}

export function portfolioValue(l: Ledger, prices: Prices): Paise {
  return l.cash + holdingsValue(l, prices);
}

export function totalPnl(l: Ledger, prices: Prices): Paise {
  return portfolioValue(l, prices) - CONFIG.startingCash;
}

export function unrealized(l: Ledger, prices: Prices): Paise {
  let total = 0;
  for (const [t, h] of Object.entries(l.holdings)) {
    if (h) total += h.quantity * prices[t as Ticker] - h.costBasis;
  }
  return total;
}

export interface PositionRow {
  ticker: Ticker;
  name: string;
  sector: SectorId;
  quantity: number;
  avgCost: Paise;
  price: Paise;
  value: Paise;
  pnl: Paise;
  pnlPct: number;
  weightPct: number;
}

export function positions(l: Ledger, prices: Prices): PositionRow[] {
  const total = portfolioValue(l, prices);
  return Object.entries(l.holdings)
    .filter(([, h]) => h && h.quantity > 0)
    .map(([t, h]) => {
      const ticker = t as Ticker;
      const price = prices[ticker];
      const value = h!.quantity * price;
      return {
        ticker,
        name: COMPANY[ticker].name,
        sector: COMPANY[ticker].sector,
        quantity: h!.quantity,
        avgCost: Math.round(h!.costBasis / h!.quantity),
        price,
        value,
        pnl: value - h!.costBasis,
        pnlPct: share(value - h!.costBasis, h!.costBasis),
        weightPct: share(value, total),
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function sectorWeights(l: Ledger, prices: Prices) {
  const total = portfolioValue(l, prices);
  const bySector = new Map<SectorId, number>();
  for (const [t, h] of Object.entries(l.holdings)) {
    if (!h || h.quantity <= 0) continue;
    const s = COMPANY[t as Ticker].sector;
    bySector.set(s, (bySector.get(s) ?? 0) + h.quantity * prices[t as Ticker]);
  }
  return SECTOR_ORDER.filter((s) => (bySector.get(s) ?? 0) > 0).map((s) => ({
    sector: s,
    value: bySector.get(s)!,
    pct: share(bySector.get(s)!, total),
  }));
}

export interface Exposure {
  investedPct: number;
  cashPct: number;
  maxSectorPct: number;
  maxSector: SectorId | null;
  maxPositionPct: number;
  maxPosition: Ticker | null;
  sectorCount: number;
  /** 1 / Herfindahl index over sector weights within the invested part. */
  effectiveSectors: number;
}

export function exposure(l: Ledger, prices: Prices): Exposure {
  const total = portfolioValue(l, prices);
  const invested = holdingsValue(l, prices);
  const sectors = sectorWeights(l, prices);
  const pos = positions(l, prices);
  let hhi = 0;
  for (const s of sectors) {
    const w = invested > 0 ? s.value / invested : 0;
    hhi += w * w;
  }
  const top = sectors.reduce<(typeof sectors)[number] | null>((a, b) => (!a || b.value > a.value ? b : a), null);
  return {
    investedPct: share(invested, total),
    cashPct: share(l.cash, total),
    maxSectorPct: top ? top.pct : 0,
    maxSector: top ? top.sector : null,
    maxPositionPct: pos[0]?.weightPct ?? 0,
    maxPosition: pos[0]?.ticker ?? null,
    sectorCount: sectors.length,
    effectiveSectors: hhi > 0 ? Math.round((1 / hhi) * 100) / 100 : 0,
  };
}

export interface ProfileCheck {
  sectorOk: boolean;
  positionOk: boolean;
  investedOk: boolean;
  within: boolean;
  e: Exposure;
}

export function checkProfile(l: Ledger, prices: Prices, profile: ProfileId): ProfileCheck {
  const p = PROFILES[profile];
  const e = exposure(l, prices);
  const sectorOk = e.maxSectorPct <= p.maxSectorPct;
  const positionOk = e.maxPositionPct <= p.maxPositionPct;
  const investedOk = Math.abs(e.investedPct - p.targetInvestedPct) <= CONFIG.profileTolerancePct;
  return { sectorOk, positionOk, investedOk, within: sectorOk && positionOk && investedOk, e };
}
