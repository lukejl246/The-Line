import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DailyPoint } from './types.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const dataDir = join(repoRoot, 'data');
export const historyDir = join(dataDir, 'history');

export function historyPath(name: string): string {
  return join(historyDir, `${name}.csv`);
}

export function readSeries(name: string): DailyPoint[] {
  const path = historyPath(name);
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, 'utf8').trim().split('\n').slice(1); // skip header
  return lines
    .filter((l) => l.length > 0)
    .map((line) => {
      const [date, value] = line.split(',');
      return { date: date!, value: Number(value) };
    });
}

/**
 * Merge `incoming` into the stored series. Existing dates are kept unless
 * `overwrite` — so a backfill can heal gaps without disturbing the exact
 * daily values the pipeline has already recorded.
 */
export function mergeSeries(name: string, incoming: DailyPoint[], overwrite = false): DailyPoint[] {
  const byDate = new Map<string, number>();
  for (const p of readSeries(name)) byDate.set(p.date, p.value);
  for (const p of incoming) {
    if (overwrite || !byDate.has(p.date)) byDate.set(p.date, p.value);
  }
  const merged = [...byDate.entries()]
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  writeSeries(name, merged);
  return merged;
}

export function writeSeries(name: string, series: DailyPoint[]): void {
  mkdirSync(historyDir, { recursive: true });
  const csv = ['date,value', ...series.map((p) => `${p.date},${p.value}`)].join('\n');
  writeFileSync(historyPath(name), csv + '\n');
}

export function writeJson(name: string, value: unknown): void {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, name), JSON.stringify(value, null, 2) + '\n');
}
