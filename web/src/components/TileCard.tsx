import type { Tile } from '../types';
import { copy } from '../content/copy';
import { explainers } from '../content/explainers';
import { fmtDate } from '../format';
import { Sparkline } from './Sparkline';

export function TileCard({ tile }: { tile: Tile }) {
  const explainer = explainers[tile.id];
  const livesDiffer = tile.liveState !== tile.confirmedState;
  return (
    <article className="tile metal">
      <header className="tile-head">
        <span className="led-bezel" aria-label={tile.confirmedState}>
          <span className={`led led-${tile.confirmedState}`} />
        </span>
        <h2 className="engrave">{tile.name}</h2>
      </header>

      <p className={`tile-distance readout state-text-${tile.confirmedState}`}>{tile.distanceLabel}</p>

      <div className="spark-screen metal-inset">
        <Sparkline metric={tile.sparkline.metric} line={tile.sparkline.line} state={tile.confirmedState} />
      </div>

      <div className="tile-meta">
        <span className="readout">
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
    </article>
  );
}
