/**
 * Daily pipeline entrypoint. Fetches the latest data, appends it to the
 * stored history, recomputes every tile and the confluence score, and writes
 * data/state.json + data/flips.json. Stateless and idempotent: flip history
 * is replayed from the full stored series on every run.
 */
import { fetchDailyCloses } from './sources/prices.js';
import { fetchTopMarkets } from './sources/coingecko.js';
import { mergeSeries, readSeries, writeJson } from './storage.js';
import { altBtcTile, bmsbTile, llrbTile, total3Tile, type TileOutput } from './indicators/tiles.js';
import { confluence } from './indicators/confluence.js';
import type { DailyPoint } from './types.js';

function lastDateMs(series: DailyPoint[]): number {
  if (series.length === 0) throw new Error('series is empty — run `npm run backfill` first');
  return Date.parse(`${series[series.length - 1]!.date}T00:00:00Z`);
}

async function updatePrices(): Promise<{ btc: DailyPoint[]; eth: DailyPoint[] }> {
  const btcStored = readSeries('btc_usd');
  const ethStored = readSeries('eth_usd');
  // Refetch from the last stored day so completed candles are never missed,
  // even after a multi-day outage.
  const btcNew = await fetchDailyCloses('BTCUSDT', 'BTC-USD', lastDateMs(btcStored));
  const ethNew = await fetchDailyCloses('ETHUSDT', 'ETH-USD', lastDateMs(ethStored));
  return {
    btc: mergeSeries('btc_usd', btcNew, true),
    eth: mergeSeries('eth_usd', ethNew, true),
  };
}

async function updateMarketCaps(): Promise<{ total3: DailyPoint[]; btcMcap: DailyPoint[] }> {
  const today = new Date().toISOString().slice(0, 10);
  const markets = await fetchTopMarkets(100);
  const btcRow = markets.find((m) => m.id === 'bitcoin');
  if (!btcRow?.market_cap) throw new Error('CoinGecko response missing bitcoin market cap');
  const total3Now = markets
    .filter((m) => m.id !== 'bitcoin' && m.id !== 'ethereum')
    .reduce((acc, m) => acc + (m.market_cap ?? 0), 0);
  return {
    // Overwrite today's value: re-runs on the same day refresh the snapshot.
    total3: mergeSeries('total3_mcap', [{ date: today, value: total3Now }], true),
    btcMcap: mergeSeries('btc_mcap', [{ date: today, value: btcRow.market_cap }], true),
  };
}

async function main(): Promise<void> {
  console.log('Updating price history…');
  const { btc, eth } = await updatePrices();
  console.log(`  BTC ${btc.length} days (to ${btc[btc.length - 1]!.date})`);
  console.log(`  ETH ${eth.length} days (to ${eth[eth.length - 1]!.date})`);

  console.log('Updating market caps…');
  const { total3, btcMcap } = await updateMarketCaps();
  console.log(`  TOTAL3 ${total3.length} days, BTC mcap ${btcMcap.length} days`);

  console.log('Computing tiles…');
  const tiles: TileOutput[] = [
    bmsbTile(btc),
    llrbTile(eth),
    altBtcTile(total3, btcMcap),
    total3Tile(total3),
  ];

  const allFlips = tiles
    .flatMap((t) => t.flips)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const results = tiles.map((t) => t.result);
  const headline = confluence(results, allFlips);

  writeJson('state.json', {
    updatedAt: new Date().toISOString(),
    confluence: headline,
    tiles: results,
  });
  writeJson('flips.json', allFlips);

  for (const r of results) {
    console.log(
      `  ${r.id}: ${r.confirmedState}${r.liveState !== r.confirmedState ? ` (live ${r.liveState})` : ''} — ${r.distanceLabel}`,
    );
  }
  console.log(`Confluence: ${headline.score >= 0 ? '+' : ''}${headline.score} ${headline.label}`);
  console.log('Wrote data/state.json and data/flips.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
