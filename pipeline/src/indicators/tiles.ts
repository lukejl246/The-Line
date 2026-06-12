import type { DailyPoint, FlipEvent, TileResult, TileState, WeeklyReading } from '../types.js';
import { ema, pctFrom, round, sma } from './math.js';
import { lastPerCompletedWeek, weeklyCloses } from './weekly.js';
import { dayIndexFrom, fitLogLog, lowerBand } from './regression.js';
import { replayFlips, type FlipReplay } from './flip.js';

export interface TileOutput {
  result: TileResult;
  flips: FlipEvent[];
}

const SPARKLINE_DAYS = 90;

/** Classify a value against a [lo, hi] band, with % depth past the boundary. */
function classifyBand(value: number, lo: number, hi: number): { state: TileState; breakoutPct: number } {
  if (value > hi) return { state: 'green', breakoutPct: pctFrom(value, hi) };
  if (value < lo) return { state: 'red', breakoutPct: -pctFrom(value, lo) };
  const depth = Math.min(((hi - value) / hi) * 100, ((value - lo) / lo) * 100);
  return { state: 'amber', breakoutPct: depth };
}

function buildSparkline(rows: { date: string; metric: number; line: number | null }[]): TileResult['sparkline'] {
  const recent = rows.slice(-SPARKLINE_DAYS).filter((r) => r.line !== null);
  return {
    dates: recent.map((r) => r.date),
    metric: recent.map((r) => round(r.metric, 4)),
    line: recent.map((r) => round(r.line!, 4)),
  };
}

function finish(
  id: string,
  name: string,
  replay: FlipReplay,
  live: { state: TileState; distancePct: number; distanceLabel: string },
  sparkline: TileResult['sparkline'],
  detail: TileResult['detail'],
): TileOutput {
  const lastFlip = replay.flips.length > 0 ? replay.flips[replay.flips.length - 1]! : null;
  return {
    result: {
      id,
      name,
      confirmedState: replay.confirmedState,
      liveState: live.state,
      pendingFlip: replay.pending,
      distancePct: round(live.distancePct, 1),
      distanceLabel: live.distanceLabel,
      lastFlip: lastFlip ? { date: lastFlip.date, from: lastFlip.from, to: lastFlip.to } : null,
      sparkline,
      detail,
    },
    flips: replay.flips,
  };
}

/**
 * Tile 1 — BTC Yo-Yo Meter. BTC weekly closes vs the Bull Market Support
 * Band (20W SMA + 21W EMA). Green above the band, amber inside, red below.
 */
export function bmsbTile(btcDaily: DailyPoint[]): TileOutput {
  const weekly = weeklyCloses(btcDaily);
  const closes = weekly.map((w) => w.value);
  const sma20 = sma(closes, 20);
  const ema21 = ema(closes, 21);

  const bands: { sunday: string; lo: number; hi: number }[] = [];
  const readings: WeeklyReading[] = [];
  for (let i = 0; i < weekly.length; i++) {
    const s = sma20[i];
    const e = ema21[i];
    if (s == null || e == null) continue;
    const lo = Math.min(s, e);
    const hi = Math.max(s, e);
    bands.push({ sunday: weekly[i]!.date, lo, hi });
    const { state, breakoutPct } = classifyBand(weekly[i]!.value, lo, hi);
    readings.push({ date: weekly[i]!.date, rawState: state, breakoutPct });
  }

  const band = bands[bands.length - 1]!;
  const latest = btcDaily[btcDaily.length - 1]!;
  const live = classifyBand(latest.value, band.lo, band.hi);
  const mid = (band.lo + band.hi) / 2;
  const distance =
    live.state === 'green'
      ? { pct: pctFrom(latest.value, band.hi), label: `${round(pctFrom(latest.value, band.hi), 1)}% above the band` }
      : live.state === 'red'
        ? { pct: pctFrom(latest.value, band.lo), label: `${round(-pctFrom(latest.value, band.lo), 1)}% below the band` }
        : { pct: pctFrom(latest.value, mid), label: 'inside the band' };

  // Sparkline: daily price vs the band midpoint in effect that day
  // (carried forward from the most recent completed week).
  let bi = -1;
  const sparkRows = btcDaily.map((p) => {
    while (bi + 1 < bands.length && bands[bi + 1]!.sunday < p.date) bi++;
    const b = bi >= 0 ? bands[bi]! : null;
    return { date: p.date, metric: p.value, line: b ? (b.lo + b.hi) / 2 : null };
  });

  return finish(
    'btc_bmsb',
    'BTC Yo-Yo Meter',
    replayFlips('btc_bmsb', readings),
    { state: live.state, distancePct: distance.pct, distanceLabel: distance.label },
    buildSparkline(sparkRows),
    {
      latestClose: round(latest.value, 2),
      bandLow: round(band.lo, 2),
      bandHigh: round(band.hi, 2),
    },
  );
}

/**
 * Tile 2 — ETH Lower Log Regression Band. ETH price vs the lower band of a
 * log-log regression over its full history, calibrated to the deepest
 * historical low. Green >20% above the band, amber 0–20%, red below.
 */
export function llrbTile(ethDaily: DailyPoint[], genesis = '2015-07-30'): TileOutput {
  const fit = fitLogLog(
    ethDaily.map((p) => ({ dayIndex: dayIndexFrom(genesis, p.date), price: p.value })),
  );

  const rows = ethDaily.map((p) => {
    const band = lowerBand(fit, dayIndexFrom(genesis, p.date));
    return { date: p.date, close: p.value, band, pct: pctFrom(p.value, band) };
  });

  const classify = (pct: number): { state: TileState; breakoutPct: number } => {
    if (pct > 20) return { state: 'green', breakoutPct: pct - 20 };
    if (pct < 0) return { state: 'red', breakoutPct: -pct };
    return { state: 'amber', breakoutPct: Math.min(pct, 20 - pct) };
  };

  const readings: WeeklyReading[] = lastPerCompletedWeek(rows).map((r) => {
    const { state, breakoutPct } = classify(r.pct);
    return { date: r.date, rawState: state, breakoutPct };
  });

  const latest = rows[rows.length - 1]!;
  const live = classify(latest.pct);
  const label =
    latest.pct >= 0
      ? `${round(latest.pct, 1)}% above the floor band`
      : `${round(-latest.pct, 1)}% below the floor band`;

  return finish(
    'eth_llrb',
    'ETH Floor Gauge',
    replayFlips('eth_llrb', readings),
    { state: live.state, distancePct: latest.pct, distanceLabel: label },
    buildSparkline(rows.map((r) => ({ date: r.date, metric: r.close, line: r.band }))),
    {
      latestClose: round(latest.close, 2),
      lowerBand: round(latest.band, 2),
      bandSigmas: round(fit.k, 2),
      fitSlope: round(fit.b, 3),
    },
  );
}

/**
 * Tile 3 — Alts vs Bitcoin. TOTAL3 ÷ BTC market cap vs its own 50-day SMA.
 * Green >1% above the average, amber within ±1%, red >1% below.
 */
export function altBtcTile(total3Daily: DailyPoint[], btcMcapDaily: DailyPoint[]): TileOutput {
  const btcByDate = new Map(btcMcapDaily.map((p) => [p.date, p.value]));
  const ratioRows = total3Daily
    .filter((p) => btcByDate.has(p.date))
    .map((p) => ({ date: p.date, ratio: p.value / btcByDate.get(p.date)! }));

  const ma = sma(ratioRows.map((r) => r.ratio), 50);
  const rows = ratioRows
    .map((r, i) => ({ ...r, ma: ma[i] }))
    .filter((r): r is { date: string; ratio: number; ma: number } => r.ma !== null)
    .map((r) => ({ ...r, pct: pctFrom(r.ratio, r.ma) }));

  const classify = (pct: number): { state: TileState; breakoutPct: number } => {
    if (pct > 1) return { state: 'green', breakoutPct: pct - 1 };
    if (pct < -1) return { state: 'red', breakoutPct: -pct - 1 };
    return { state: 'amber', breakoutPct: 1 - Math.abs(pct) };
  };

  const readings: WeeklyReading[] = lastPerCompletedWeek(rows).map((r) => {
    const { state, breakoutPct } = classify(r.pct);
    return { date: r.date, rawState: state, breakoutPct };
  });

  const latest = rows[rows.length - 1]!;
  const live = classify(latest.pct);
  const label =
    live.state === 'amber'
      ? 'on its 50-day line'
      : latest.pct > 0
        ? `${round(latest.pct, 1)}% above its 50-day line`
        : `${round(-latest.pct, 1)}% below its 50-day line`;

  return finish(
    'alt_btc_50d',
    'Alts vs Bitcoin',
    replayFlips('alt_btc_50d', readings),
    { state: live.state, distancePct: latest.pct, distanceLabel: label },
    buildSparkline(rows.map((r) => ({ date: r.date, metric: r.ratio, line: r.ma }))),
    {
      ratio: round(latest.ratio, 4),
      sma50: round(latest.ma, 4),
    },
  );
}

/**
 * Tile 4 — Altcoin Market Tide. TOTAL3 market cap vs its 50-day and 200-day
 * SMAs. Green above both, amber between them, red below both.
 */
export function total3Tile(total3Daily: DailyPoint[]): TileOutput {
  const values = total3Daily.map((p) => p.value);
  const s50 = sma(values, 50);
  const s200 = sma(values, 200);
  const rows = total3Daily
    .map((p, i) => ({ date: p.date, v: p.value, s50: s50[i], s200: s200[i] }))
    .filter((r): r is { date: string; v: number; s50: number; s200: number } => r.s50 !== null && r.s200 !== null);

  const classify = (v: number, ma50: number, ma200: number): { state: TileState; breakoutPct: number } => {
    const p50 = pctFrom(v, ma50);
    const p200 = pctFrom(v, ma200);
    if (p50 > 0 && p200 > 0) return { state: 'green', breakoutPct: Math.min(p50, p200) };
    if (p50 < 0 && p200 < 0) return { state: 'red', breakoutPct: Math.min(-p50, -p200) };
    return { state: 'amber', breakoutPct: Math.min(Math.abs(p50), Math.abs(p200)) };
  };

  const readings: WeeklyReading[] = lastPerCompletedWeek(rows).map((r) => {
    const { state, breakoutPct } = classify(r.v, r.s50, r.s200);
    return { date: r.date, rawState: state, breakoutPct };
  });

  const latest = rows[rows.length - 1]!;
  const live = classify(latest.v, latest.s50, latest.s200);
  const p50 = pctFrom(latest.v, latest.s50);
  const label =
    p50 >= 0
      ? `${round(p50, 1)}% above its 50-day average`
      : `${round(-p50, 1)}% below its 50-day average`;

  return finish(
    'total3_trend',
    'Altcoin Market Tide',
    replayFlips('total3_trend', readings),
    { state: live.state, distancePct: p50, distanceLabel: label },
    buildSparkline(rows.map((r) => ({ date: r.date, metric: r.v, line: r.s50 }))),
    {
      marketCap: round(latest.v, 0),
      sma50: round(latest.s50, 0),
      sma200: round(latest.s200, 0),
      pctFrom200d: round(pctFrom(latest.v, latest.s200), 1),
    },
  );
}
