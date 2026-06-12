import { describe, expect, it } from 'vitest';
import { dayIndexFrom, fitLogLog, lowerBand } from '../src/indicators/regression.js';

describe('fitLogLog', () => {
  it('recovers slope and intercept from alternating noise, band touches the low', () => {
    // log10(price) = 1 + 0.5 * log10(day) ± 0.1 (alternating)
    const points = Array.from({ length: 100 }, (_, i) => {
      const dayIndex = i + 1;
      const noise = i % 2 === 0 ? 0.1 : -0.1;
      return { dayIndex, price: 10 ** (1 + 0.5 * Math.log10(dayIndex) + noise) };
    });
    const fit = fitLogLog(points);
    expect(fit.b).toBeCloseTo(0.5, 1);
    expect(fit.sigma).toBeCloseTo(0.1, 2);
    // Noise is not perfectly orthogonal to log-time, so k is only near 1.
    expect(fit.k).toBeGreaterThan(0.8);
    expect(fit.k).toBeLessThan(1.3);
    // Every "low" point (noise = -0.1) sits on (not below) the lower band.
    const low = points[1]!;
    expect(low.price / lowerBand(fit, low.dayIndex)).toBeCloseTo(1, 1);
    // No point falls below the band.
    for (const p of points) {
      expect(p.price).toBeGreaterThanOrEqual(lowerBand(fit, p.dayIndex) * 0.999);
    }
  });

  it('handles a perfect fit without dividing by zero', () => {
    const points = Array.from({ length: 50 }, (_, i) => ({
      dayIndex: i + 1,
      price: 10 ** (1 + 0.5 * Math.log10(i + 1)),
    }));
    const fit = fitLogLog(points);
    // The band offset (k * sigma, in log10 space) is what must vanish.
    expect(Math.abs(fit.k * fit.sigma)).toBeLessThan(1e-9);
    expect(Number.isFinite(fit.k)).toBe(true);
  });

  it('rejects series that are too short', () => {
    expect(() => fitLogLog([{ dayIndex: 1, price: 10 }])).toThrow();
  });
});

describe('dayIndexFrom', () => {
  it('counts whole UTC days from genesis with a floor of 1', () => {
    expect(dayIndexFrom('2015-07-30', '2015-07-30')).toBe(1);
    expect(dayIndexFrom('2015-07-30', '2015-08-09')).toBe(10);
  });
});
