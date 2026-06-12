import { describe, expect, it } from 'vitest';
import { weekEndingSunday, weeklyCloses } from '../src/indicators/weekly.js';

// 2024-01-01 was a Monday; the first week of 2024 ends Sunday 2024-01-07.
function daily(dates: string[], values: number[]) {
  return dates.map((date, i) => ({ date, value: values[i]! }));
}

describe('weekEndingSunday', () => {
  it('maps Monday through Sunday to the same Sunday', () => {
    expect(weekEndingSunday('2024-01-01')).toBe('2024-01-07');
    expect(weekEndingSunday('2024-01-04')).toBe('2024-01-07');
    expect(weekEndingSunday('2024-01-07')).toBe('2024-01-07');
    expect(weekEndingSunday('2024-01-08')).toBe('2024-01-14');
  });
});

describe('weeklyCloses', () => {
  it('uses the Sunday close and excludes the in-progress week', () => {
    const dates = Array.from({ length: 10 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`);
    const closes = weeklyCloses(daily(dates, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    // Days 8-10 belong to the week ending 01-14, which has not closed yet.
    expect(closes).toEqual([{ date: '2024-01-07', value: 7 }]);
  });

  it('falls back to the last available close when the Sunday is missing', () => {
    const closes = weeklyCloses(
      daily(['2024-01-01', '2024-01-05', '2024-01-09'], [1, 5, 9]),
    );
    expect(closes).toEqual([{ date: '2024-01-07', value: 5 }]);
  });

  it('treats a series ending exactly on a Sunday as not yet closed', () => {
    const closes = weeklyCloses(daily(['2024-01-06', '2024-01-07'], [6, 7]));
    expect(closes).toEqual([]);
  });
});
