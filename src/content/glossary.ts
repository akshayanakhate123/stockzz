export interface GlossaryEntry {
  term: string;
  def: string;
  /** Lesson that teaches it in full, if any. */
  lesson?: string;
  /** Phrases that should link to this entry when they appear in running text. */
  aliases?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  share: { term: "Share", def: "One unit of ownership in a company. Own a share and you own a sliver of its assets and future profits.", lesson: "what-is-a-share" },
  "market-cap": {
    term: "Market cap",
    def: "Share price × total number of shares, what the market values the whole company at.",
    lesson: "what-is-a-share",
    aliases: ["market capitalisation", "market value", "market cap"],
  },
  "portfolio-value": { term: "Portfolio value", def: "Your cash plus the current value of every share you hold.", lesson: "portfolio-pnl", aliases: ["portfolio value"] },
  "cash-available": { term: "Cash available", def: "Money not yet invested. Buying shares turns cash into holdings; selling turns them back.", lesson: "portfolio-pnl" },
  unrealised: {
    term: "Unrealised P&L",
    def: "The paper gain or loss on shares you still own. It changes every time the price moves and isn't locked in until you sell.",
    lesson: "portfolio-pnl",
    aliases: ["unrealised P&L", "unrealised gain", "unrealised"],
  },
  realised: {
    term: "Realised P&L",
    def: "Profit or loss locked in when you sell, measured against what you paid on average.",
    lesson: "portfolio-pnl",
    aliases: ["realised P&L", "realised gain", "realised"],
  },
  "total-pnl": { term: "Total P&L", def: "Realised + unrealised − charges. Always equals portfolio value minus the ₹1,00,000 you started with.", lesson: "portfolio-pnl" },
  "average-cost": { term: "Average cost", def: "Everything you paid for the shares you hold ÷ how many you hold.", lesson: "portfolio-pnl", aliases: ["average cost"] },
  charges: { term: "Charges", def: "A flat 0.10% of every order's value in Stockzz, a stand-in for brokerage and taxes.", lesson: "portfolio-pnl", aliases: ["charges"] },
  "market-order": {
    term: "Market order",
    def: "Buy or sell right now at the best available price. Stockzz fills every order this way, at exactly the price shown.",
    lesson: "order-types",
  },
  "pe-ratio": {
    term: "P/E ratio",
    def: "Share price ÷ earnings per share: how many rupees investors pay for each rupee of yearly profit. High P/E = high growth expected.",
    lesson: "valuation-pe",
    aliases: ["P/E ratio", "P/E", "× earnings", "times earnings"],
  },
  eps: { term: "EPS", def: "Earnings per share: a company's yearly profit ÷ its number of shares.", lesson: "valuation-pe", aliases: ["EPS", "earnings per share"] },
  "earnings-surprise": { term: "Earnings surprise", def: "Actual profit minus what analysts expected.", lesson: "earnings-expectations", aliases: ["earnings surprise"] },
  guidance: { term: "Guidance", def: "Management's own forecast for coming quarters or the year, often moves prices more than past results.", lesson: "earnings-expectations", aliases: ["guidance", "outlook"] },
  revenue: { term: "Revenue", def: "Total sales before any costs are taken out.", lesson: "earnings-expectations", aliases: ["revenue"] },
  "net-profit": { term: "Net profit", def: "What's left of revenue after every cost, interest and tax.", lesson: "earnings-expectations", aliases: ["net profit"] },
  repo: { term: "Repo rate", def: "The rate at which the RBI lends to banks. When it rises, loans across the economy usually get dearer.", lesson: "interest-rates", aliases: ["repo rate", "repo"] },
  emi: { term: "EMI", def: "Equated monthly instalment. The fixed monthly payment on a loan.", lesson: "interest-rates", aliases: ["EMIs", "EMI"] },
  nim: { term: "Net interest margin", def: "What a bank earns on loans minus what it pays on deposits, as a % of its loans.", lesson: "interest-rates", aliases: ["net interest margin"] },
  "debt-equity": {
    term: "Debt-to-equity",
    def: "A company's borrowings ÷ the money its shareholders have put in. Above 1× means it's funded more by debt than by owners.",
    lesson: "interest-rates",
    aliases: ["debt-to-equity", "its equity"],
  },
  "net-cash": { term: "Net cash", def: "The company holds more cash than it owes. The opposite of being in debt.", aliases: ["net cash", "no net debt"] },
  consensus: { term: "Consensus", def: "The average forecast of economists or analysts, what the market already expects.", aliases: ["consensus"] },
  inflation: { term: "Inflation", def: "The pace at which prices in general rise. ₹100 buys less each year.", lesson: "inflation-margins", aliases: ["inflation"] },
  cpi: { term: "CPI", def: "Consumer Price Index. The government's main measure of retail inflation.", lesson: "inflation-margins", aliases: ["CPI", "retail inflation", "consumer inflation"] },
  margin: { term: "Operating margin", def: "Operating profit ÷ revenue: how much of each ₹100 of sales is kept as profit.", lesson: "inflation-margins", aliases: ["operating margin", "margins", "margin"] },
  "pricing-power": { term: "Pricing power", def: "Ability to raise prices without losing many customers.", lesson: "inflation-margins", aliases: ["pricing power"] },
  sector: { term: "Sector", def: "A group of companies in the same line of business, e.g. IT, banking, pharma. They tend to move together.", lesson: "diversification" },
  concentration: { term: "Concentration risk", def: "Too much of your money riding on one company or sector.", lesson: "diversification", aliases: ["concentrated", "concentration"] },
  correlation: { term: "Correlation", def: "How closely two investments move together. Same-sector stocks are highly correlated.", lesson: "diversification", aliases: ["correlated", "correlation", "move together"] },
  "risk-profile": {
    term: "Risk profile",
    def: "Your plan for how much to invest and how concentrated to be. Stockzz judges your sizing against it. It doesn't change the news.",
    lesson: "diversification",
    aliases: ["risk profile"],
  },
  drawdown: { term: "Drawdown", def: "The % fall from a peak to a later low. A 50% drawdown needs a 100% gain to recover.", lesson: "volatility-drawdowns", aliases: ["drawdowns", "drawdown"] },
  liquidity: { term: "Liquidity", def: "How easily you can buy or sell without moving the price. In a panic it can dry up, few buyers at any price.", lesson: "volatility-drawdowns", aliases: ["liquidity"] },
  "week-high": { term: "52-week high", def: "The highest price a stock has traded at over the past year.", aliases: ["52-week highs", "52-week high"] },
  filing: { term: "Exchange filing", def: "An official disclosure a listed company must make on the NSE/BSE. Legally accountable. The gold standard for news.", lesson: "rumours-vs-facts", aliases: ["exchange filing", "stock-exchange filing"] },
  tender: { term: "Tender", def: "A government invitation for companies to bid for a contract. Large tenders are often split among several winners.", lesson: "rumours-vs-facts", aliases: ["tender"] },
  rebalancing: { term: "Rebalancing", def: "Trading back to your target weights after prices have moved them.", lesson: "rebalancing", aliases: ["rebalancing"] },
  drift: { term: "Drift", def: "Your portfolio weights changing simply because prices moved.", lesson: "rebalancing", aliases: ["drifted", "drift"] },
  generic: { term: "Generic medicine", def: "A cheaper copy of a drug whose patent has expired. Many makers can sell the same generic, so prices compete.", aliases: ["generic medicines", "generic"] },
  "rubric-score": {
    term: "Rubric score",
    def: "A 0–100 score for one part of your decision. It's based only on what you knew before the outcome, not on whether you made money.",
  },
  "decision-path": {
    term: "Classified as",
    def: "Stockzz matches your trades and resulting portfolio to the closest typical approach for this round (e.g. 'Measured first position') and gives feedback on it.",
  },
  consistency: { term: "Consistency", def: "Whether your action (buy, sell or hold) matched the reasoning you picked. Saying 'wait' and then buying counts as inconsistent." },
};

/** Alias → entry id, longest phrases first so "unrealised P&L" wins over "unrealised". */
export const ALIASES: { phrase: string; id: string }[] = Object.entries(GLOSSARY)
  .flatMap(([id, e]) => (e.aliases ?? []).map((phrase) => ({ phrase, id })))
  .sort((a, b) => b.phrase.length - a.phrase.length);
