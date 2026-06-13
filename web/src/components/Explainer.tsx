import { copy } from '../content/copy';
import type { Explainer as ExplainerContent } from '../content/explainers';

/** The 60-second read, as a calm disclosure. */
export function Explainer({ content }: { content: ExplainerContent }) {
  return (
    <details className="explainer">
      <summary>
        <span className="chevron">›</span>
        {copy.explainerToggle}
      </summary>
      <div className="explainer-body">
        <h3>{copy.explainerHeadings.whatItIs}</h3>
        <p>{content.whatItIs}</p>
        <h3>{copy.explainerHeadings.howToReadIt}</h3>
        <p>{content.howToReadIt}</p>
        <h3>{copy.explainerHeadings.watchOut}</h3>
        <p>{content.watchOut}</p>
      </div>
    </details>
  );
}
