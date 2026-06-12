import type { FlipEvent, TileResult } from '../types.js';

export interface Confluence {
  /** Sum of +1 per green tile, -1 per red, 0 per amber. Range [-4, +4]. */
  score: number;
  label: string;
  /** Confirmed flips from the most recent weekly close, for the headline note. */
  changedThisWeek: FlipEvent[];
}

export function confluenceLabel(score: number): string {
  if (score >= 3) return 'Risk-on regime';
  if (score >= 1) return 'Leaning risk-on';
  if (score <= -3) return 'Risk-off regime';
  if (score <= -1) return 'Leaning risk-off';
  return 'Mixed';
}

export function confluence(tiles: TileResult[], allFlips: FlipEvent[]): Confluence {
  const score = tiles.reduce(
    (acc, t) => acc + (t.confirmedState === 'green' ? 1 : t.confirmedState === 'red' ? -1 : 0),
    0,
  );
  const changedThisWeek = allFlips.filter((f) => isWithinDays(f.date, 8));
  return { score, label: confluenceLabel(score), changedThisWeek };
}

function isWithinDays(date: string, days: number): boolean {
  return Date.now() - Date.parse(`${date}T00:00:00Z`) < days * 86_400_000;
}
