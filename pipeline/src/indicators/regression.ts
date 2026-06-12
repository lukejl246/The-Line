import { mean, stddev } from './math.js';

export interface LogLogFit {
  /** Intercept and slope of log10(price) = a + b * log10(dayIndex). */
  a: number;
  b: number;
  /** Standard deviation of fit residuals (in log10 space). */
  sigma: number;
  /**
   * Band offset in sigmas, calibrated so the lower band touches the deepest
   * historical low relative to the fit (the most negative residual).
   */
  k: number;
}

export interface RegressionPoint {
  /** Days since the asset's genesis date (must be >= 1). */
  dayIndex: number;
  price: number;
}

/**
 * OLS fit of log10(price) against log10(days since genesis), with the lower
 * band calibrated to the worst historical residual — i.e. the band passes
 * through the deepest bear-market low seen so far.
 */
export function fitLogLog(points: RegressionPoint[]): LogLogFit {
  if (points.length < 30) {
    throw new Error(`log regression needs at least 30 points, got ${points.length}`);
  }
  const xs = points.map((p) => Math.log10(p.dayIndex));
  const ys = points.map((p) => Math.log10(p.price));
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i]! - mx) * (ys[i]! - my);
    den += (xs[i]! - mx) ** 2;
  }
  const b = num / den;
  const a = my - b * mx;
  const residuals = ys.map((y, i) => y - (a + b * xs[i]!));
  const sigma = stddev(residuals);
  const k = sigma === 0 ? 0 : -Math.min(...residuals) / sigma;
  return { a, b, sigma, k };
}

/** The lower-band price at a given day index. */
export function lowerBand(fit: LogLogFit, dayIndex: number): number {
  return 10 ** (fit.a + fit.b * Math.log10(dayIndex) - fit.k * fit.sigma);
}

/** Whole days between genesis and `date`, minimum 1. */
export function dayIndexFrom(genesis: string, date: string): number {
  const ms = Date.parse(`${date}T00:00:00Z`) - Date.parse(`${genesis}T00:00:00Z`);
  return Math.max(1, Math.round(ms / 86_400_000));
}
