import type { Tile } from '../types';
import { copy } from '../content/copy';
import { explainers } from '../content/explainers';
import { fmtDate } from '../format';
import { Sparkline } from './Sparkline';
import { Explainer } from './Explainer';

export function TileCard({ tile, index }: { tile: Tile; index: number }) {
  const explainer = explainers[tile.id];
  const livesDiffer = tile.liveState !== tile.confirmedState;
  return (
    <article className="tile rise" style={{ animationDelay: `${0.06 * (index + 1)}s` }}>
      <header className="tile-head">
        <span className={`dot state-bg-${tile.confirmedState}`} aria-label={tile.confirmedState} />
        <h2 className="tile-name">{tile.name}</h2>
      </header>

      <p className={`tile-distance state-text-${tile.confirmedState}`}>{tile.distanceLabel}</p>

      <Sparkline metric={tile.sparkline.metric} line={tile.sparkline.line} state={tile.confirmedState} />

      <div className="tile-meta">
        <span>
          {tile.lastFlip
            ? copy.lastFlip(copy.stateWords[tile.confirmedState], fmtDate(tile.lastFlip.date))
            : copy.noFlipYet}
        </span>
        {tile.pendingFlip && (
          <span className={`badge state-text-${tile.pendingFlip.toState}`}>
            {copy.pendingFlipBadge(
              tile.pendingFlip.closes,
              tile.pendingFlip.needed,
              copy.stateWords[tile.pendingFlip.toState],
            )}
          </span>
        )}
        {livesDiffer && !tile.pendingFlip && (
          <span className={`badge state-text-${tile.liveState}`}>
            {copy.liveDiffers(copy.stateWords[tile.liveState])}
          </span>
        )}
      </div>

      {explainer && <Explainer content={explainer} />}
    </article>
  );
}
