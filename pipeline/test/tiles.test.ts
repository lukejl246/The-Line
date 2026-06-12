import { describe, expect, it } from 'vitest';
import { altBtcTile, bmsbTile, llrbTile, total3Tile } from '../src/indicators/tiles.js';
import { confluence, confluenceLabel } from '../src/indicators/confluence.js';
import type { DailyPoint } from '../src/types.js';

/** Daily series starting Monday 2024-01-01. */
function series(length: number, value: (i: number) => number): DailyPoint[] {
  return Array.from({ length }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 1 + i));
    return { date: d.toISOString().slice(0, 10), value: value(i) };
  });
}

describe('bmsbTile', () => {
  it('reads green in a steady uptrend', () => {
    const tile = bmsbTile(series(250, (i) => 100 + i));
    expect(tile.result.id).toBe('btc_bmsb');
    expect(tile.result.confirmedState).toBe('green');
    expect(tile.result.liveState).toBe('green');
    expect(tile.result.distancePct).toBeGreaterThan(0);
    expect(tile.result.sparkline.metric.length).toBeLessThanOrEqual(90);
    expect(tile.result.sparkline.metric.length).toBe(tile.result.sparkline.line.length);
  });

  it('reads red in a steady downtrend', () => {
    const tile = bmsbTile(series(250, (i) => 1000 - 2 * i));
    expect(tile.result.confirmedState).toBe('red');
    expect(tile.result.distancePct).toBeLessThan(0);
  });
});

describe('llrbTile', () => {
  it('produces a coherent result on noisy power-law data', () => {
    const tile = llrbTile(
      series(400, (i) => 10 ** (1 + 0.4 * Math.log10(i + 200) + (i % 2 === 0 ? 0.05 : -0.05))),
      '2023-12-31',
    );
    expect(tile.result.id).toBe('eth_llrb');
    expect(['green', 'amber', 'red']).toContain(tile.result.confirmedState);
    expect(tile.result.detail.bandSigmas).toBeGreaterThan(0);
    // Distance label and pct agree in sign.
    if (tile.result.distancePct >= 0) {
      expect(tile.result.distanceLabel).toContain('above');
    }
  });
});

describe('altBtcTile', () => {
  it('reads green when alts outpace BTC', () => {
    const total3 = series(300, (i) => 1000 + 5 * i);
    const btcMcap = series(300, () => 2000);
    const tile = altBtcTile(total3, btcMcap);
    expect(tile.result.confirmedState).toBe('green');
    expect(tile.result.distancePct).toBeGreaterThan(1);
  });

  it('reads red when alts lag BTC', () => {
    const total3 = series(300, (i) => 3000 - 5 * i);
    const btcMcap = series(300, () => 2000);
    const tile = altBtcTile(total3, btcMcap);
    expect(tile.result.confirmedState).toBe('red');
  });
});

describe('total3Tile', () => {
  it('is green above both averages, red below both', () => {
    expect(total3Tile(series(300, (i) => 1000 + 5 * i)).result.confirmedState).toBe('green');
    expect(total3Tile(series(300, (i) => 3000 - 5 * i)).result.confirmedState).toBe('red');
  });
});

describe('confluence', () => {
  it('scores +1 green, -1 red, 0 amber', () => {
    const tiles = [
      { confirmedState: 'green' },
      { confirmedState: 'green' },
      { confirmedState: 'amber' },
      { confirmedState: 'red' },
    ] as Parameters<typeof confluence>[0];
    expect(confluence(tiles, []).score).toBe(1);
  });

  it('labels every score in range', () => {
    expect(confluenceLabel(4)).toBe('Risk-on regime');
    expect(confluenceLabel(3)).toBe('Risk-on regime');
    expect(confluenceLabel(1)).toBe('Leaning risk-on');
    expect(confluenceLabel(0)).toBe('Mixed');
    expect(confluenceLabel(-1)).toBe('Leaning risk-off');
    expect(confluenceLabel(-4)).toBe('Risk-off regime');
  });
});
