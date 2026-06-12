import type { FlipEvent, TileState, WeeklyReading } from '../types.js';

export interface FlipOptions {
  /** A single close beyond the boundary by more than this % confirms at once. */
  bufferPct?: number;
  /** Closes needed to confirm when each one stays within the buffer. */
  confirmCloses?: number;
}

export interface FlipReplay {
  confirmedState: TileState;
  /** Date of the weekly close that confirmed the current state. */
  confirmedSince: string;
  pending: { toState: TileState; closes: number; needed: number } | null;
  flips: FlipEvent[];
}

/**
 * Replay the weekly-close confirmation rules over a tile's full history.
 *
 * Rules: a flip is confirmed by one weekly close beyond the boundary by more
 * than `bufferPct`, or by `confirmCloses` consecutive closes within the
 * buffer. A close back in the confirmed state's zone resets the counter; a
 * close in a different new state restarts the counter for that state.
 *
 * Replaying from the start of history every run keeps the pipeline
 * stateless and idempotent, and yields the historical flip log for free.
 */
export function replayFlips(
  tileId: string,
  readings: WeeklyReading[],
  options: FlipOptions = {},
): FlipReplay {
  const bufferPct = options.bufferPct ?? 2;
  const confirmCloses = options.confirmCloses ?? 2;
  if (readings.length === 0) {
    throw new Error(`no weekly readings for tile ${tileId}`);
  }

  let confirmedState = readings[0]!.rawState;
  let confirmedSince = readings[0]!.date;
  let pending: { toState: TileState; closes: number } | null = null;
  const flips: FlipEvent[] = [];

  for (const reading of readings.slice(1)) {
    if (reading.rawState === confirmedState) {
      pending = null;
      continue;
    }
    if (pending && pending.toState === reading.rawState) {
      pending.closes += 1;
    } else {
      pending = { toState: reading.rawState, closes: 1 };
    }
    const decisive = reading.breakoutPct > bufferPct;
    if (decisive || pending.closes >= confirmCloses) {
      flips.push({ tile: tileId, date: reading.date, from: confirmedState, to: reading.rawState });
      confirmedState = reading.rawState;
      confirmedSince = reading.date;
      pending = null;
    }
  }

  return {
    confirmedState,
    confirmedSince,
    pending: pending ? { ...pending, needed: confirmCloses } : null,
    flips,
  };
}
