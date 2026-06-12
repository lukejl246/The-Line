import type { State } from '../types';
import { copy } from '../content/copy';
import { explainers } from '../content/explainers';
import { fmtDate } from '../format';

const SCORES = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

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
    <section className="confluence">
      <p className="confluence-title">{copy.confluenceTitle}</p>
      <div className="confluence-main">
        <span className={`confluence-score state-text-${tone}`}>
          {confluence.score > 0 ? `+${confluence.score}` : confluence.score}
        </span>
        <span className="confluence-label">{confluence.label}</span>
      </div>
      <div className="confluence-meter" role="img" aria-label={`Score ${confluence.score} of a range from minus 4 to plus 4`}>
        {SCORES.map((s) => (
          <span
            key={s}
            className={`meter-seg${s === confluence.score ? ` meter-active state-bg-${tone}` : ''}`}
          />
        ))}
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
