import { describe, expect, it } from 'vitest';
import { ema, pctFrom, sma } from '../src/indicators/math.js';

describe('sma', () => {
  it('is null during warmup, then averages the window', () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
  });

  it('handles period equal to series length', () => {
    expect(sma([2, 4, 6], 3)).toEqual([null, null, 4]);
  });
});

describe('ema', () => {
  it('seeds with the SMA of the first period values', () => {
    // period 3, k = 0.5: seed = (2+4+6)/3 = 4, then 8*0.5 + 4*0.5 = 6
    expect(ema([2, 4, 6, 8], 3)).toEqual([null, null, 4, 6]);
  });

  it('returns all nulls when the series is shorter than the period', () => {
    expect(ema([1, 2], 5)).toEqual([null, null]);
  });
});

describe('pctFrom', () => {
  it('is signed', () => {
    expect(pctFrom(110, 100)).toBeCloseTo(10);
    expect(pctFrom(90, 100)).toBeCloseTo(-10);
  });
});
