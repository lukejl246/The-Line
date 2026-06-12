export type TileState = 'green' | 'amber' | 'red';

export interface FlipEvent {
  tile: string;
  date: string;
  from: TileState;
  to: TileState;
}

export interface Tile {
  id: string;
  name: string;
  confirmedState: TileState;
  liveState: TileState;
  pendingFlip: { toState: TileState; closes: number; needed: number } | null;
  distancePct: number;
  distanceLabel: string;
  lastFlip: { date: string; from: TileState; to: TileState } | null;
  sparkline: {
    dates: string[];
    metric: number[];
    line: number[];
  };
  detail: Record<string, number | string>;
}

export interface State {
  updatedAt: string;
  confluence: {
    score: number;
    label: string;
    changedThisWeek: FlipEvent[];
  };
  tiles: Tile[];
}
