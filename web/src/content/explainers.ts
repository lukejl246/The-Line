export interface Explainer {
  whatItIs: string;
  howToReadIt: string;
  watchOut: string;
}

/**
 * The 60-second explainers — the beginner promise. Plain English only.
 * Standing rule: these never tell anyone what to do with their money, and
 * never use trading-instruction language. They describe market state.
 */
export const explainers: Record<string, Explainer> = {
  btc_bmsb: {
    whatItIs:
      'Bitcoin has a habit of bouncing along a "support band" during healthy periods — a zone drawn from its average price over the last 20–21 weeks. Traders call it the Bull Market Support Band. We call this tile the Yo-Yo Meter because in strong markets, price keeps snapping back up from this band like a yo-yo.',
    howToReadIt:
      'Green means Bitcoin ended the week above the band — historically the healthier regime. Amber means it is sitting inside the band, which is the zone where bounces or breakdowns happen. Red means it ended the week below — historically the more defensive regime. The percentage shows how far price is from the band right now.',
    watchOut:
      'One bad day does not flip this tile. It only changes after a confirmed weekly close, so it will always look "slow" next to a fast-moving chart. That is deliberate — it filters out noise.',
  },
  eth_llrb: {
    whatItIs:
      "A long-term floor estimate for Ethereum. We draw a curve through ETH's entire price history (on a log scale, which suits assets that grow in percentage terms) and shift it down so it touches the deepest bear-market lows ever recorded. That lower curve is the floor band.",
    howToReadIt:
      'Green means ETH is comfortably above its historical floor — more than 20% clear. Amber means it is within 20% of the floor, the zone where past bear markets bottomed out. Red means it has dropped below every historical precedent. The percentage shows the current gap between price and the floor.',
    watchOut:
      'This is an experimental, statistics-based estimate, not a law of nature. The curve is refitted as history grows, so the floor moves slightly over time. A floor that held in the past can still break.',
  },
  alt_btc_50d: {
    whatItIs:
      'A measure of whether smaller coins ("alts") are gaining or losing ground against Bitcoin. We take the combined value of the largest coins excluding Bitcoin and Ethereum, divide it by Bitcoin\'s value, and compare that ratio to its own 50-day average.',
    howToReadIt:
      'Green means alts have been outpacing Bitcoin — money is feeling adventurous, which usually happens in risk-on conditions. Red means Bitcoin is outpacing alts — money is huddling in the biggest, safest crypto asset. Amber means the ratio is sitting right on its average, with no clear winner.',
    watchOut:
      'Alts outpacing Bitcoin can happen in rallies and in periods where Bitcoin falls faster than everything else. Read this tile together with the others — that is exactly what the confluence score at the top does.',
  },
  total3_trend: {
    whatItIs:
      'The total value of the altcoin market — every major coin except Bitcoin and Ethereum, added together — compared with its own 50-day and 200-day averages. Chart watchers know this number as TOTAL3. Think of it as the tide level for the whole altcoin sea.',
    howToReadIt:
      'Green means the altcoin market is above both its short-term (50-day) and long-term (200-day) averages — the tide is in. Red means it is below both — the tide is out. Amber means the two averages disagree, which is common around turning points.',
    watchOut:
      'We approximate TOTAL3 from the top 100 coins, so the level can differ slightly from what charting sites show — the shape and the regime reads are what matter. Market-cap totals can also jump when new coins enter the top 100.',
  },
  confluence: {
    whatItIs:
      'One number that sums up all four tiles. Each green tile adds a point, each red tile takes one away, and amber tiles count as zero. The result runs from −4 (everything defensive) to +4 (everything constructive).',
    howToReadIt:
      'The further from zero, the more the four tiles agree. Readings near zero mean the market is genuinely mixed — that is information too, not a malfunction.',
    watchOut:
      'The score describes the current market regime. It says nothing about what happens next, and it is not advice of any kind.',
  },
};
