import { useEffect, useState } from 'react';
import type { State } from './types';
import { copy } from './content/copy';
import { fmtDate, fmtDateTime, isStale } from './format';
import { ConfluenceHeadline } from './components/ConfluenceHeadline';
import { TileCard } from './components/TileCard';

type Loading = { status: 'loading' } | { status: 'error' } | { status: 'ready'; state: State };

export function App() {
  const [data, setData] = useState<Loading>({ status: 'loading' });

  useEffect(() => {
    fetch('data/state.json', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((state: State) => setData({ status: 'ready', state }))
      .catch(() => setData({ status: 'error' }));
  }, []);

  return (
    <div className="page">
      <header className="masthead">
        <h1>{copy.brand}</h1>
        <p className="tagline">{copy.tagline}</p>
      </header>

      {data.status === 'loading' && <p className="status-note">…</p>}
      {data.status === 'error' && <p className="status-note">{copy.loadError}</p>}

      {data.status === 'ready' && (
        <>
          {isStale(data.state.updatedAt) && (
            <div className="stale-banner">{copy.staleBanner(fmtDate(data.state.updatedAt))}</div>
          )}
          <ConfluenceHeadline confluence={data.state.confluence} tiles={data.state.tiles} />
          <main className="tile-grid">
            {data.state.tiles.map((tile) => (
              <TileCard key={tile.id} tile={tile} />
            ))}
          </main>
          <p className="updated-at">{copy.updatedAt(fmtDateTime(data.state.updatedAt))}</p>
        </>
      )}

      <footer className="footer">
        <p>{copy.footer.method}</p>
        <p>{copy.footer.disclaimer}</p>
      </footer>
    </div>
  );
}
