import type { State } from '../types';
import { copy } from '../content/copy';
import { explainers } from '../content/explainers';
import { fmtDate } from '../format';
import { SegmentedScore } from './SegmentedScore';
import { Explainer } from './Explainer';

function scoreClass(score: number): 'green' | 'amber' | 'red' {
  if (score >= 1) return 'green';
  if (score <= -1) return 'red';
  return 'amber';
}

export function ConfluenceHeadline({ confluence, tiles }: Pick<State, 'confluence' | 'tiles'>) {
  const tone = scoreClass(confluence.score);
  const tileName = (id: string) => tiles.find((t) => t.id === id)?.name ?? id;
  return (
    <section className="hero rise">
      <p className="eyebrow">{copy.confluenceTitle}</p>
      <div className="hero-row">
        <h1 className="hero-title">{confluence.label}</h1>
        <span className={`score-pill state-text-${tone}`}>
          {confluence.score > 0 ? `+${confluence.score}` : confluence.score}
        </span>
      </div>
      <SegmentedScore score={confluence.score} tone={tone} />
      <p className="hero-note">
        {confluence.changedThisWeek.length > 0
          ? `${copy.changedThisWeekPrefix} ${confluence.changedThisWeek
              .map((f) => `${tileName(f.tile)} ${f.from} → ${f.to} (${fmtDate(f.date)})`)
              .join(' · ')}`
          : copy.noChangeThisWeek}
      </p>
      {explainers.confluence && <Explainer content={explainers.confluence} />}
    </section>
  );
}
