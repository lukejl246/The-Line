interface Props {
  /** Confluence score in [-4, 4]. */
  score: number;
  tone: 'green' | 'amber' | 'red';
}

const SEGMENTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

/** A calm segmented read-out of the confluence score from −4 to +4. */
export function SegmentedScore({ score, tone }: Props) {
  return (
    <div className="segscore">
      <div
        className="segscore-track"
        role="img"
        aria-label={`Score ${score}, on a scale from minus 4 to plus 4`}
      >
        {SEGMENTS.map((s) => (
          <span key={s} className={`seg${s === score ? ` seg-active state-bg-${tone}` : ''}`} />
        ))}
      </div>
      <div className="segscore-scale" aria-hidden="true">
        <span>−4</span>
        <span>0</span>
        <span>+4</span>
      </div>
    </div>
  );
}
