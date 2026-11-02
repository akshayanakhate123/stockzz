/** Common questions for each lesson, answered from that lesson's own content. Keyed by lesson slug. */
export const FAQS: Record<string, { q: string; a: string }[]> = {
  "what-is-a-share": [
    {
      q: "If I own one share, do I own part of the factory?",
      a: "Yes, a tiny slice of everything the company owns and every rupee of profit it earns in future. You can't walk in and take a machine, but your slice grows or shrinks with the value of the whole business.",
    },
    {
      q: "In the worked example, did I actually make ₹600?",
      a: "Not yet. 25 shares rising from ₹480 to ₹504 is a ₹600 gain, but it's unrealised. It only exists on paper until you sell, and it can shrink before then.",
    },
    {
      q: "Does buying more shares make the company bigger?",
      a: "No. Buying more shares changes the size of your slice, not the company. The company's value is set by the market price times the number of shares, which is its market capitalisation.",
    },
    {
      q: "Why does a share price change during the day?",
      a: "Buyers and sellers keep revising what they think the company's future profits are worth. On the NSE and BSE every trade sets a new price, so the price moves whenever that view changes.",
    },
  ],
  "portfolio-pnl": [
    {
      q: "Why didn't my portfolio value jump when I bought shares?",
      a: "Buying swaps cash for shares of the same value, so the total barely moves. Only small charges are lost. Your value changes afterwards, when the share price moves.",
    },
    {
      q: "What's the difference between realised and unrealised P&L?",
      a: "Realised P&L is locked in when you sell. Unrealised P&L is the paper gain or loss on shares you still hold. Selling converts one into the other; the total doesn't change at that moment.",
    },
    {
      q: "How is average cost worked out in the example?",
      a: "12 shares at ₹400 plus 8 at ₹450 cost ₹8,400 for 20 shares, an average of ₹420. Selling 10 at ₹480 realises ₹60 a share, or ₹600, and the other 10 keep their ₹420 average.",
    },
    {
      q: "How do I check my total P&L is right?",
      a: "Total P&L = realised + unrealised − charges. It always equals your portfolio value minus the money you started with, so either way should give the same number.",
    },
  ],
  "order-types": [
    {
      q: "What is the spread?",
      a: "The gap between the best bid (the highest price a buyer will pay) and the best ask (the lowest price a seller will take). Buying at market and selling straight back costs you roughly the spread.",
    },
    {
      q: "Why did the market order in the example pay more than ₹540?",
      a: "Only 80 shares were offered at ₹540.00, so the remaining 70 filled at ₹540.50. The average works out to about ₹540.23. Larger market orders walk further up the book.",
    },
    {
      q: "Should I always use a limit order then?",
      a: "Not always. A limit order protects your price but may never fill if the market moves away. A market order always fills but you don't control the price. You can't have both certainties.",
    },
    {
      q: "Does a stop-loss guarantee I sell at my trigger price?",
      a: "No. Once the price reaches your trigger it becomes a sell order, and in a fast fall it can fill below the trigger. In Stockzz every order fills instantly at the shown price, which real markets don't promise.",
    },
  ],
  "earnings-expectations": [
    {
      q: "How can a share fall after the company beats estimates?",
      a: "The price already included the expected result. If management also cuts its outlook, investors lower what they expect for the future, and that can outweigh one good quarter.",
    },
    {
      q: "What is an earnings surprise?",
      a: "Actual profit minus the average analyst estimate. A positive surprise is a beat and a negative one is a miss. The size of the surprise matters more than whether the profit itself looks large.",
    },
    {
      q: "In the example, why does an 8% cut in next year's estimate move the price so much?",
      a: "If investors still pay 26 times earnings, cutting expected EPS from ₹27.69 by 8% takes the fair price from ₹720 to about ₹662. Same multiple, smaller future profit, lower price.",
    },
    {
      q: "Why does guidance matter more than last quarter?",
      a: "A share is a claim on future profits. Last quarter is history; guidance is management's own forecast for what comes next, so it changes expectations directly.",
    },
  ],
  "interest-rates": [
    {
      q: "What is the repo rate?",
      a: "The rate at which the Reserve Bank of India lends to banks. The RBI usually raises it to fight inflation. Banks then lift their own loan rates, which makes borrowing dearer for families and firms.",
    },
    {
      q: "Does half a percent really change much?",
      a: "On the ₹8 lakh, 5-year car loan in the example, 9.0% to 9.5% adds about ₹195 a month, or nearly ₹11,700 over the loan. Across lakhs of borrowers, that's enough to change how many cars get bought.",
    },
    {
      q: "Which companies feel a rate hike most?",
      a: "Those whose customers borrow to buy, such as carmakers, and those carrying heavy debt. Exporters selling abroad usually feel it least.",
    },
    {
      q: "Are banks winners or losers when rates rise?",
      a: "Often both. They may earn a wider margin early on, but dearer loans can slow how much people borrow, which slows their growth later.",
    },
  ],
  "valuation-pe": [
    {
      q: "What do EPS and P/E actually mean?",
      a: "EPS is yearly profit divided by the number of shares. P/E is the share price divided by EPS: how many rupees investors pay for each rupee of annual profit.",
    },
    {
      q: "Is a low P/E always a bargain?",
      a: "No. A low P/E can mean the market expects little or no growth, or sees risks. Cheaper isn't automatically cheap; it depends on what the business will earn next.",
    },
    {
      q: "Why can the price fall when profits don't?",
      a: "Price = EPS × P/E. If expected growth slows, investors pay a lower multiple. PayKaro earns ₹14.50 a share; at a P/E of 80 that's ₹1,160, but at 50 it's ₹725, with the same profit.",
    },
    {
      q: "Why are high-P/E stocks so sensitive?",
      a: "At a high multiple most of the price rests on future growth. A 20% cut in the multiple hurts as much as a 20% cut in earnings, and at P/E 80 that's hundreds of rupees a share.",
    },
  ],
  "inflation-margins": [
    {
      q: "If prices rise everywhere, don't companies earn more too?",
      a: "Their sales may rise, but so do raw materials, wages and transport. Profit depends on whether prices rise faster than costs, not on whether prices rise at all.",
    },
    {
      q: "What is a margin?",
      a: "The share of each sale kept as profit. In the example Annapurna keeps ₹16 of every ₹100. When raw materials rise 16% and prices only 6%, that falls to about 13%.",
    },
    {
      q: "What does pricing power mean?",
      a: "Loyal customers who keep buying even after a price rise. A loved brand can pass on more of its cost increase; a generic rival has to absorb it in its margin.",
    },
    {
      q: "Why not just raise prices by the full cost increase?",
      a: "It only protects the margin if customers keep buying. Raise prices too far and they switch to cheaper options, so sales fall instead.",
    },
  ],
  diversification: [
    {
      q: "Is owning five stocks enough to be diversified?",
      a: "It depends which five. Companies in the same sector move together because they share customers and drivers. Five IT stocks are far less diversified than five stocks in five different sectors.",
    },
    {
      q: "How much did diversifying help in the example?",
      a: "When IT fell 15%, Kabir, with ₹85,000 in IT, lost ₹12,750. His cousin, with ₹20,000 in each of five sectors, lost ₹3,000 on the same news.",
    },
    {
      q: "Does diversification protect me in a crash?",
      a: "Far less. It limits damage from a shock to one company or sector, but when the whole market falls together, every sector is hit.",
    },
    {
      q: "Doesn't spreading out also cut my gains?",
      a: "Yes, if one concentrated bet would have soared. That's the trade-off: you give up the best case to avoid the worst case. Stockzz scores how you size positions, not whether you picked the winner.",
    },
  ],
  "volatility-drawdowns": [
    {
      q: "What's the difference between volatility and a drawdown?",
      a: "Volatility is how much prices swing up and down. A drawdown is the fall from a peak to a low, which is what you actually feel during a crash.",
    },
    {
      q: "Why does a 35% fall need more than 35% to recover?",
      a: "The loss shrinks your base. ₹1,00,000 falling 35% leaves ₹65,000, and getting back to ₹1,00,000 needs a gain of about 54%.",
    },
    {
      q: "Should I sell when the market is crashing?",
      a: "Selling turns a paper loss into a real one, and then you have to decide when to buy back. The panic test shows this. But recoveries aren't guaranteed; the better answer is sizing positions so a deep fall doesn't force your hand.",
    },
    {
      q: "Why is it so hard to hold during a fall?",
      a: "Panic, herd behaviour and loss aversion all peak at the same moment. That's why knowing your risk tolerance before a crash matters more than guessing the bottom.",
    },
  ],
  "rumours-vs-facts": [
    {
      q: "What is a rumour premium?",
      a: "The extra price a stock picks up on an unconfirmed story. If the facts turn out smaller than the rumour, that premium usually disappears, often in a single session.",
    },
    {
      q: "In the example, who lost money?",
      a: "Anyone who bought at the rumour price. Suryodaya rose from ₹100 to ₹110, then fell 8% after the filing to about ₹101. Holders from ₹100 were still up; buyers at ₹110 were down 8%.",
    },
    {
      q: "Which sources should I trust first?",
      a: "Stock-exchange filings, regulator notices and official documents. Listed companies must disclose material events through filings, so those are the standard worth waiting for.",
    },
    {
      q: "If the price is already rising, isn't that proof?",
      a: "No. A rising price and lots of shares on social media are not evidence. They often just mean many people heard the same rumour.",
    },
  ],
  rebalancing: [
    {
      q: "What is drift?",
      a: "As prices move, winners grow into a bigger slice of your portfolio and losers shrink. Your mix slowly moves away from the split you planned, without you trading.",
    },
    {
      q: "How much should I sell in the example?",
      a: "Starting at ₹70,000 in stocks and ₹30,000 cash, a 40% rise takes stocks to ₹98,000 out of ₹1,28,000, about 77%. Back to 70% is ₹89,600, so you'd trim about ₹8,400 of stocks.",
    },
    {
      q: "Isn't selling winners a mistake?",
      a: "It can feel like one. Rebalancing isn't a forecast that the winners will fall; it's a risk-control habit that keeps your risk where you planned it.",
    },
    {
      q: "Which way does rebalancing trade?",
      a: "Always sell the overweight and buy the underweight. Bigger gaps in returns cause bigger drift, so they need bigger trades to fix.",
    },
  ],
};
