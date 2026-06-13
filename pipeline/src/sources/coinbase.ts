import type { DailyPoint } from '../types.js';
import { fetchJson } from './http.js';

const BASE = 'https://api.exchange.coinbase.com';

// [ time (seconds), low, high, open, close, volume ]
type Candle = [number, number, number, number, number, number];

/**
 * Map Coinbase daily candles to completed daily closes from `startMs` onward.
 * The in-progress day (UTC) is excluded so semantics match the Binance
 * source: the latest point is the most recent *completed* daily close.
 */
export function parseCandles(candles: Candle[], startMs: number, nowMs: number): DailyPoint[] {
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const out: DailyPoint[] = [];
  for (const c of candles) {
    const ms = c[0] * 1000;
    if (ms < startMs) continue;
    const date = new Date(ms).toISOString().slice(0, 10);
    if (date >= today) continue; // in-progress candle
    out.push({ date, value: c[4] });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Daily closes for a Coinbase product (e.g. BTC-USD). The candles endpoint
 * returns up to ~300 of the most recent daily candles — ample for the daily
 * incremental append, since full history already lives in data/history/.
 */
export async function fetchDailyCloses(product: string, startMs: number): Promise<DailyPoint[]> {
  const url = `${BASE}/products/${product}/candles?granularity=86400`;
  const candles = await fetchJson<Candle[]>(url, { headers: { 'User-Agent': 'the-line-pipeline' } });
  return parseCandles(candles, startMs, Date.now());
}
