import type { State } from '../types';
import { copy } from '../content/copy';
import { explainers } from '../content/explainers';
import { fmtDate } from '../format';
import { Gauge } from './Gauge';

function scoreClass(score: number): 'green' | 'amber' | 'red' {
  if (score >= 1) return 'green';
  if (score <= -1) return 'red';
  return 'amber';
}

export function ConfluenceHeadline({ confluence, tiles }: Pick<State, 'confluence' | 'tiles'>) {
  const tone = scoreClass(confluence.score);
  const explainer = explainers.confluence;
  const tileName = (id: string) => tiles.find((t) => t.id === id)?.name ?? id;
  return (
    <section className="confluence metal">
      <p className="confluence-title engrave">{copy.confluenceTitle}</p>
      <div className="confluence-cluster">
        <Gauge score={confluence.score} tone={tone} />
        <div className="confluence-readout">
          <span className={`confluence-score readout state-text-${tone}`}>
            {confluence.score > 0 ? `+${confluence.score}` : confluence.score}
          </span>
          <span className="confluence-label">{confluence.label}</span>
        </div>
      </div>
      <p className="confluence-note">
        {confluence.changedThisWeek.length > 0 ? (
          <>
            {copy.changedThisWeekPrefix}{' '}
            {confluence.changedThisWeek
              .map((f) => `${tileName(f.tile)} ${f.from} → ${f.to} (${fmtDate(f.date)})`)
              .join(' · ')}
          </>
        ) : (
          copy.noChangeThisWeek
        )}
      </p>
      {explainer && (
        <details className="explainer">
          <summary>{copy.explainerToggle}</summary>
          <h3>{copy.explainerHeadings.whatItIs}</h3>
          <p>{explainer.whatItIs}</p>
          <h3>{copy.explainerHeadings.howToReadIt}</h3>
          <p>{explainer.howToReadIt}</p>
          <h3>{copy.explainerHeadings.watchOut}</h3>
          <p>{explainer.watchOut}</p>
        </details>
      )}
    </section>
  );
}
