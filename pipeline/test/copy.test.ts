import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Standing product rule: the words buy/sell/signal (and derivatives) must
 * never appear anywhere in the product. We describe market state and
 * regime — we do not issue trading instructions.
 */
const FORBIDDEN = /\b(buy|sell|signal)/i;

const webRoot = join(import.meta.dirname, '..', '..', 'web');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(tsx?|css|html)$/.test(entry)) out.push(path);
  }
  return out;
}

describe('forbidden words guard', () => {
  const files = [...sourceFiles(join(webRoot, 'src')), join(webRoot, 'index.html')];

  it('finds the dashboard source files', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(files.map((f) => [f.replace(webRoot, 'web')] as const))('%s', (label) => {
    const path = join(webRoot, label.replace(/^web/, '.'));
    const offending = readFileSync(path, 'utf8')
      .split('\n')
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => FORBIDDEN.test(line));
    expect(offending).toEqual([]);
  });
});
