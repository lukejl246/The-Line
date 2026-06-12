/**
 * One-off (re-runnable) history backfill.
 *
 *   npm run backfill              # prices + market caps
 *   npm run backfill -- --mcap-only   # heal mcap history after a cron outage
 *
 * Prices come from Binance (full daily history). Market caps come from
 * CoinGecko's free tier, which allows 365 days of daily history — enough to
 * seed the 200-day average. TOTAL3 is approximated as the summed market caps
 * of the current top 100 coins excluding BTC and ETH; existing stored dates
 * are never overwritten, so re-runs only fill gaps.
 */
import { fetchDailyCloses } from '../src/sources/binance.js';
import { fetchMcapHistory, fetchTopMarkets } from '../src/sources/coingecko.js';
import { sleep } from '../src/sources/http.js';
import { mergeSeries } from '../src/storage.js';

const BINANCE_START = Date.parse('2017-08-01T00:00:00Z');
const CG_DELAY_MS = Number(process.env.CG_DELAY_MS ?? 3000);

async function main(): Promise<void> {
  const mcapOnly = process.argv.includes('--mcap-only');

  if (!mcapOnly) {
    console.log('Backfilling BTC/USD daily closes from Binance…');
    const btc = await fetchDailyCloses('BTCUSDT', BINANCE_START);
    mergeSeries('btc_usd', btc, true);
    console.log(`  ${btc.length} days`);

    console.log('Backfilling ETH/USD daily closes from Binance…');
    const eth = await fetchDailyCloses('ETHUSDT', BINANCE_START);
    mergeSeries('eth_usd', eth, true);
    console.log(`  ${eth.length} days`);
  }

  console.log('Fetching top 100 coins from CoinGecko…');
  const markets = await fetchTopMarkets(100);
  const altIds = markets.map((m) => m.id).filter((id) => id !== 'bitcoin' && id !== 'ethereum');
  console.log(`  ${altIds.length} coins in the TOTAL3 proxy basket`);
  await sleep(CG_DELAY_MS);

  console.log('Backfilling BTC market cap…');
  mergeSeries('btc_mcap', await fetchMcapHistory('bitcoin'));
  await sleep(CG_DELAY_MS);

  console.log('Backfilling TOTAL3 proxy (this takes a few minutes)…');
  const total3 = new Map<string, number>();
  let done = 0;
  for (const id of altIds) {
    try {
      for (const p of await fetchMcapHistory(id)) {
        total3.set(p.date, (total3.get(p.date) ?? 0) + p.value);
      }
    } catch (err) {
      console.warn(`  skipping ${id}: ${(err as Error).message}`);
    }
    done += 1;
    if (done % 10 === 0) console.log(`  ${done}/${altIds.length} coins`);
    await sleep(CG_DELAY_MS);
  }
  const series = [...total3.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const merged = mergeSeries('total3_mcap', series);
  console.log(`TOTAL3 proxy: ${merged.length} days stored`);
  console.log('Backfill complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
