import { describe, expect, it } from 'vitest';
import { replayFlips } from '../src/indicators/flip.js';
import type { TileState, WeeklyReading } from '../src/types.js';

let week = 0;
function r(rawState: TileState, breakoutPct: number): WeeklyReading {
  week += 1;
  const d = new Date(Date.UTC(2024, 0, 7 + (week - 1) * 7));
  return { date: d.toISOString().slice(0, 10), rawState, breakoutPct };
}

describe('replayFlips', () => {
  it('starts in the first reading state with no flip event', () => {
    week = 0;
    const replay = replayFlips('t', [r('green', 5), r('green', 6)]);
    expect(replay.confirmedState).toBe('green');
    expect(replay.flips).toEqual([]);
    expect(replay.pending).toBeNull();
  });

  it('confirms in one close when the breakout exceeds the buffer', () => {
    week = 0;
    const readings = [r('green', 5), r('red', 5)];
    const replay = replayFlips('t', readings);
    expect(replay.confirmedState).toBe('red');
    expect(replay.flips).toHaveLength(1);
    expect(replay.flips[0]).toMatchObject({ from: 'green', to: 'red', date: readings[1]!.date });
  });

  it('a breakout exactly at the buffer is not decisive', () => {
    week = 0;
    const replay = replayFlips('t', [r('green', 5), r('red', 2)]);
    expect(replay.confirmedState).toBe('green');
    expect(replay.pending).toEqual({ toState: 'red', closes: 1, needed: 2 });
  });

  it('confirms after two consecutive closes within the buffer', () => {
    week = 0;
    const readings = [r('green', 5), r('red', 1), r('red', 1)];
    const replay = replayFlips('t', readings);
    expect(replay.confirmedState).toBe('red');
    expect(replay.flips[0]!.date).toBe(readings[2]!.date);
  });

  it('resets the counter when a close returns to the confirmed state', () => {
    week = 0;
    const readings = [r('green', 5), r('red', 1), r('green', 1), r('red', 1), r('red', 1)];
    const replay = replayFlips('t', readings);
    expect(replay.flips).toHaveLength(1);
    expect(replay.flips[0]!.date).toBe(readings[4]!.date);
  });

  it('restarts the counter when the pending state changes', () => {
    week = 0;
    const readings = [r('green', 5), r('amber', 0.5), r('red', 1), r('red', 1)];
    const replay = replayFlips('t', readings);
    // The amber close does not stack with the red ones.
    expect(replay.flips).toHaveLength(1);
    expect(replay.flips[0]).toMatchObject({ from: 'green', to: 'red', date: readings[3]!.date });
  });

  it('records confirmedSince as the confirming close date', () => {
    week = 0;
    const readings = [r('green', 5), r('red', 1), r('red', 1), r('red', 4)];
    const replay = replayFlips('t', readings);
    expect(replay.confirmedSince).toBe(readings[2]!.date);
  });
});
