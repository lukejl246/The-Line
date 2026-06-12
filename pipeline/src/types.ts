export type TileState = 'green' | 'amber' | 'red';

/** One daily observation. `date` is the UTC day (YYYY-MM-DD) the value belongs to. */
export interface DailyPoint {
  date: string;
  value: number;
}

/**
 * One completed weekly close. Weeks run Monday–Sunday UTC; the candle closes
 * Monday 00:00 UTC. `date` is the Sunday that ends the week.
 */
export interface WeeklyClose {
  date: string;
  value: number;
}

export interface FlipEvent {
  tile: string;
  date: string;
  from: TileState;
  to: TileState;
}

/**
 * A weekly observation fed to the flip state machine.
 * `breakoutPct` is how far (in %) the close sits beyond the boundary it
 * crossed into `rawState`'s zone — used for the decisive-close rule.
 */
export interface WeeklyReading {
  date: string;
  rawState: TileState;
  breakoutPct: number;
}

export interface TileResult {
  id: string;
  name: string;
  /** State confirmed by weekly closes (what the traffic light shows). */
  confirmedState: TileState;
  /** State implied by the latest daily value — may differ intraweek. */
  liveState: TileState;
  pendingFlip: { toState: TileState; closes: number; needed: number } | null;
  /** Signed % distance for the headline number, tile-specific meaning. */
  distancePct: number;
  /** Plain-English label for the distance, e.g. "12.3% above the band". */
  distanceLabel: string;
  lastFlip: { date: string; from: TileState; to: TileState } | null;
  sparkline: {
    dates: string[];
    metric: number[];
    line: number[];
  };
  detail: Record<string, number | string>;
}
