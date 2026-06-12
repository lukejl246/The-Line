import type { DailyPoint } from '../types.js';
import { fetchJson } from './http.js';

const BASE = 'https://api.coingecko.com/api/v3';

function headers(): Record<string, string> {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { 'x-cg-demo-api-key': key } : {};
}

export interface MarketRow {
  id: string;
  symbol: string;
  market_cap: number | null;
}

/** Current top markets by market cap (includes BTC and ETH). */
export async function fetchTopMarkets(perPage = 100): Promise<MarketRow[]> {
  const url = `${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1`;
  return fetchJson<MarketRow[]>(url, { headers: headers() });
}

/**
 * Daily market-cap history for one coin. CoinGecko returns 00:00 UTC values
 * at daily granularity for ranges over 90 days, plus a final "now" point —
 * the map keys by UTC date so the last point simply becomes today's value.
 */
export async function fetchMcapHistory(id: string, days = 365): Promise<DailyPoint[]> {
  const url = `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
  const body = await fetchJson<{ market_caps: [number, number][] }>(url, { headers: headers() });
  const byDate = new Map<string, number>();
  for (const [ts, value] of body.market_caps) {
    if (value > 0) byDate.set(new Date(ts).toISOString().slice(0, 10), value);
  }
  return [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
