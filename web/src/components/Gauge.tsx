interface Props {
  /** Confluence score, clamped to [-4, 4]. */
  score: number;
  tone: 'green' | 'amber' | 'red';
}

const CX = 160;
const CY = 172;
const R_ARC = 126;
const ARC_W = 16;
const MIN = -4;
const MAX = 4;

/** Score → degrees on a 180° dial: -4 → 180° (left), 0 → 90° (up), +4 → 0° (right). */
function angleFor(score: number): number {
  const t = (Math.max(MIN, Math.min(MAX, score)) - MIN) / (MAX - MIN);
  return 180 - t * 180;
}

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

/** Top-arc path between two scores (clockwise on screen). */
function arc(fromScore: number, toScore: number, r: number): string {
  const p0 = polar(angleFor(fromScore), r);
  const p1 = polar(angleFor(toScore), r);
  return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${r} ${r} 0 0 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

/** The analog confluence gauge: coloured zones, ticks, and a metal needle. */
export function Gauge({ score, tone }: Props) {
  const needle = polar(angleFor(score), R_ARC - 22);
  const dir = { x: needle.x - CX, y: needle.y - CY };
  const len = Math.hypot(dir.x, dir.y) || 1;
  const perp = { x: -dir.y / len, y: dir.x / len };
  const baseW = 5;
  const tail = 16;
  const needlePath = [
    `${(CX + perp.x * baseW).toFixed(2)} ${(CY + perp.y * baseW).toFixed(2)}`,
    `${needle.x.toFixed(2)} ${needle.y.toFixed(2)}`,
    `${(CX - perp.x * baseW).toFixed(2)} ${(CY - perp.y * baseW).toFixed(2)}`,
    `${(CX - (dir.x / len) * tail).toFixed(2)} ${(CY - (dir.y / len) * tail).toFixed(2)}`,
  ].join(' L');

  const zones: { from: number; to: number; cls: 'red' | 'amber' | 'green' }[] = [
    { from: -4, to: -0.5, cls: 'red' },
    { from: -0.5, to: 0.5, cls: 'amber' },
    { from: 0.5, to: 4, cls: 'green' },
  ];
  const ticks = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

  return (
    <svg className="gauge" viewBox="0 0 320 196" role="img" aria-label={`Confluence gauge reading ${score} of a range from minus 4 to plus 4`}>
      <defs>
        <linearGradient id="needle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f6fb" />
          <stop offset="100%" stopColor="#aeb6c6" />
        </linearGradient>
        <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000" floodOpacity="0.55" />
        </filter>
      </defs>

      {/* Coloured zone arcs — the active tone glows, the rest sit muted. */}
      {zones.map((z) => (
        <path
          key={z.cls}
          d={arc(z.from, z.to, R_ARC)}
          className={`state-stroke-${z.cls}`}
          strokeWidth={ARC_W}
          fill="none"
          strokeLinecap="butt"
          opacity={z.cls === tone ? 1 : 0.28}
          style={z.cls === tone ? { filter: `drop-shadow(0 0 6px var(--trace-glow))` } : undefined}
        />
      ))}

      {/* Tick marks + end labels */}
      {ticks.map((t) => {
        const a = angleFor(t);
        const inner = polar(a, R_ARC - ARC_W / 2 - 4);
        const outer = polar(a, R_ARC - ARC_W / 2 + 4);
        return (
          <line
            key={t}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={t === 0 ? 2 : 1}
          />
        );
      })}
      {[-4, 0, 4].map((t) => {
        const p = polar(angleFor(t), R_ARC - ARC_W - 12);
        return (
          <text
            key={t}
            x={p.x}
            y={p.y}
            fill="#9aa2b4"
            fontSize="11"
            fontFamily="var(--mono)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {t > 0 ? `+${t}` : t}
          </text>
        );
      })}

      {/* Needle + hub */}
      <path d={`M${needlePath} Z`} fill="url(#needle)" filter="url(#needleShadow)" />
      <circle cx={CX} cy={CY} r="11" fill="#2b2f37" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <circle cx={CX} cy={CY} r="5" fill="#0f1115" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
    </svg>
  );
}
