interface Props {
  metric: number[];
  line: number[];
  state: 'green' | 'amber' | 'red';
}

const W = 220;
const H = 52;
const PAD = 3;

function path(values: number[], min: number, max: number): string {
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2);
      const y = H - PAD - ((v - min) / span) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** 90-day metric (solid, state-coloured) vs its reference line (dashed). */
export function Sparkline({ metric, line, state }: Props) {
  if (metric.length < 2) return null;
  const all = [...metric, ...line];
  const min = Math.min(...all);
  const max = Math.max(...all);
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="90-day trend"
    >
      <path className="sparkline-ref" d={path(line, min, max)} />
      <path className={`sparkline-metric state-stroke-${state}`} d={path(metric, min, max)} />
    </svg>
  );
}
