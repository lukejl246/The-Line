import { useId } from 'react';

interface Props {
  metric: number[];
  line: number[];
  state: 'green' | 'amber' | 'red';
}

const W = 240;
const H = 56;
const PAD = 4;

function points(values: number[], min: number, max: number): { x: number; y: number }[] {
  const span = max - min || 1;
  return values.map((v, i) => ({
    x: PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2),
    y: H - PAD - ((v - min) / span) * (H - PAD * 2),
  }));
}

const toPath = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** Calm sparkline: a soft area fill under the metric line, dashed reference. */
export function Sparkline({ metric, line, state }: Props) {
  const gradId = useId();
  if (metric.length < 2) return null;
  const all = [...metric, ...line];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const mPts = points(metric, min, max);
  const area = `${toPath(mPts)} L${mPts[mPts.length - 1]!.x.toFixed(1)},${H} L${mPts[0]!.x.toFixed(1)},${H} Z`;

  return (
    <svg
      className={`sparkline trace-${state}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="90-day trend"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="sparkline-area" d={area} fill={`url(#${gradId})`} />
      <path className="sparkline-ref" d={toPath(points(line, min, max))} />
      <path className="sparkline-metric" d={toPath(mPts)} />
    </svg>
  );
}
