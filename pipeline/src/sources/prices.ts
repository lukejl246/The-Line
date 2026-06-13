import type { DailyPoint } from '../types.js';
import * as binance from './binance.js';
import * as coinbase from './coinbase.js';

/**
 * Daily closes with a source fallback. Binance has the cleanest full history
 * and is the primary source, but it geo-blocks some cloud IPs (it returns
 * HTTP 451 from GitHub Actions runners). When Binance is unavailable for any
 * reason, fall back to Coinbase — which serves the daily incremental fine,
 * since full history is already committed to data/history/. The tiny USD vs
 * USDT difference at the seam is immaterial to weekly averages and the band.
 */
export async function fetchDailyCloses(
  binanceSymbol: string,
  coinbaseProduct: string,
  startMs: number,
): Promise<DailyPoint[]> {
  try {
    return await binance.fetchDailyCloses(binanceSymbol, startMs);
  } catch (err) {
    console.warn(
      `  Binance unavailable (${(err as Error).message.slice(0, 70)}); falling back to Coinbase ${coinbaseProduct}`,
    );
    return coinbase.fetchDailyCloses(coinbaseProduct, startMs);
  }
}
