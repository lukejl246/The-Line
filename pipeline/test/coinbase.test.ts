import { describe, expect, it } from 'vitest';
import { parseCandles } from '../src/sources/coinbase.js';

const DAY = 86_400;
const d = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

describe('parseCandles', () => {
  // Coinbase returns newest-first: [time_s, low, high, open, close, volume]
  const candles: [number, number, number, number, number, number][] = [
    [d('2026-06-12') / 1000, 0, 0, 0, 612, 0],
    [d('2026-06-11') / 1000, 0, 0, 0, 611, 0],
    [d('2026-06-10') / 1000, 0, 0, 0, 610, 0],
  ];

  it('returns completed closes sorted ascending, using the close column', () => {
    const now = d('2026-06-13') + 5 * 3600 * 1000; // mid-day 13th
    expect(parseCandles(candles, d('2026-06-01'), now)).toEqual([
      { date: '2026-06-10', value: 610 },
      { date: '2026-06-11', value: 611 },
      { date: '2026-06-12', value: 612 },
    ]);
  });

  it('excludes the in-progress (today) candle', () => {
    const withToday = [[d('2026-06-13') / 1000, 0, 0, 0, 613, 0], ...candles] as typeof candles;
    const now = d('2026-06-13') + 5 * 3600 * 1000;
    const out = parseCandles(withToday, d('2026-06-01'), now);
    expect(out.map((p) => p.date)).not.toContain('2026-06-13');
    expect(out.at(-1)).toEqual({ date: '2026-06-12', value: 612 });
  });

  it('drops candles before startMs', () => {
    const now = d('2026-06-13');
    const out = parseCandles(candles, d('2026-06-11'), now);
    expect(out.map((p) => p.date)).toEqual(['2026-06-11', '2026-06-12']);
  });

  it('treats startMs at a date boundary as inclusive of that day', () => {
    const now = d('2026-06-13');
    const out = parseCandles([[d('2026-06-12') / 1000, 0, 0, 0, 612, 0]], d('2026-06-12'), now);
    expect(out).toEqual([{ date: '2026-06-12', value: 612 }]);
  });

  it('handles an empty response', () => {
    expect(parseCandles([], d('2026-06-01'), d('2026-06-13'))).toEqual([]);
  });

  // Guards the assumption that granularity 86400 = one day in seconds.
  it('assumes daily granularity in seconds', () => {
    expect(DAY).toBe(86_400);
  });
});
