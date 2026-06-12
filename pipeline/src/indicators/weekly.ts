import type { DailyPoint, WeeklyClose } from '../types.js';

/** The Sunday (YYYY-MM-DD) ending the Monday–Sunday week containing `date`. */
export function weekEndingSunday(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay();
  const daysToSunday = day === 0 ? 0 : 7 - day;
  d.setUTCDate(d.getUTCDate() + daysToSunday);
  return d.toISOString().slice(0, 10);
}

/**
 * Last row of each Monday–Sunday UTC week, for completed weeks only. A week
 * counts as completed once the input contains a row dated after its Sunday —
 * the in-progress week is never included. Input must be sorted by date.
 */
export function lastPerCompletedWeek<T extends { date: string }>(rows: T[]): T[] {
  if (rows.length === 0) return [];
  const lastDate = rows[rows.length - 1]!.date;
  const byWeek = new Map<string, T>();
  for (const row of rows) {
    byWeek.set(weekEndingSunday(row.date), row); // sorted input → last wins
  }
  const out: { sunday: string; row: T }[] = [];
  for (const [sunday, row] of byWeek) {
    if (sunday < lastDate) out.push({ sunday, row });
  }
  return out.sort((a, b) => (a.sunday < b.sunday ? -1 : 1)).map((e) => e.row);
}

/**
 * Derive completed weekly closes from a daily series (sorted by date). The
 * weekly close is the last daily close in the week; `date` is normalised to
 * the Sunday ending that week (the candle itself closes Monday 00:00 UTC).
 */
export function weeklyCloses(daily: DailyPoint[]): WeeklyClose[] {
  return lastPerCompletedWeek(daily).map((p) => ({
    date: weekEndingSunday(p.date),
    value: p.value,
  }));
}
