import type { DailyPoint } from '../types.js';
import { fetchJson, sleep } from './http.js';

const BASE = 'https://api.binance.com/api/v3';

type Kline = [number, string, string, string, string, string, number, ...unknown[]];

/**
 * All completed daily closes for a symbol from `startMs` onward, paginated.
 * The date is the UTC day the candle opened; only candles whose close time
 * has passed are returned (the in-progress day is excluded).
 */
export async function fetchDailyCloses(symbol: string, startMs: number): Promise<DailyPoint[]> {
  const out: DailyPoint[] = [];
  let cursor = startMs;
  const now = Date.now();
  for (;;) {
    const url = `${BASE}/klines?symbol=${symbol}&interval=1d&startTime=${cursor}&limit=1000`;
    const klines = await fetchJson<Kline[]>(url);
    if (klines.length === 0) break;
    for (const k of klines) {
      const [openTime, , , , close, , closeTime] = k;
      if (closeTime > now) continue; // in-progress candle
      out.push({
        date: new Date(openTime).toISOString().slice(0, 10),
        value: Number(close),
      });
    }
    const lastClose = klines[klines.length - 1]![6];
    if (klines.length < 1000 || lastClose > now) break;
    cursor = lastClose + 1;
    await sleep(300);
  }
  return out;
}
