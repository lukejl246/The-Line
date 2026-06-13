/** All fixed user-facing copy. Scanned by the forbidden-words guard. */
export const copy = {
  brand: 'The Line',
  tagline: 'Which side of the line is the market on?',
  loading: 'Loading…',
  readingsLabel: 'The four readings',
  confluenceTitle: 'Market state right now',
  changedThisWeekPrefix: 'Changed at the last weekly close:',
  noChangeThisWeek: 'No tiles changed at the last weekly close.',
  pendingFlipBadge: (closes: number, needed: number, state: string) =>
    `${closes} of ${needed} weekly closes toward ${state}`,
  lastFlip: (state: string, date: string) => `${capitalise(state)} since ${date}`,
  noFlipYet: 'No state change in recorded history',
  liveDiffers: (state: string) => `Today's reading leans ${state} — not yet confirmed`,
  explainerToggle: 'What is this? · 60-second read',
  explainerHeadings: {
    whatItIs: 'What it is',
    howToReadIt: 'How to read it',
    watchOut: 'Watch out',
  },
  staleBanner: (date: string) =>
    `Heads up: this data last refreshed on ${date}. States shown may be out of date.`,
  loadError: 'Could not load the latest market state. Try refreshing in a minute.',
  updatedAt: (when: string) => `Updated ${when}`,
  stateWords: { green: 'green', amber: 'amber', red: 'red' } as const,
  footer: {
    method:
      'States change only on confirmed weekly closes (Monday 00:00 UTC), so this page moves slowly on purpose. Prices from Binance; market caps from CoinGecko, with TOTAL3 approximated from the top 100 coins excluding BTC and ETH.',
    disclaimer:
      'The Line describes market state. It is not financial advice and it never tells you what to do with your money. Crypto assets are volatile and you can lose what you put in.',
  },
};

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
