# The Line

A beginner-friendly crypto market-state dashboard. Four regime tiles, one
confluence score, updated automatically every day. The Line describes
market state — it never tells anyone what to do with their money.

## The four tiles

| Tile | What it tracks | Green / Amber / Red |
| --- | --- | --- |
| **BTC Yo-Yo Meter** | BTC weekly closes vs the Bull Market Support Band (20W SMA + 21W EMA) | above / inside / below the band |
| **ETH Floor Gauge** | ETH vs the lower band of a log-log regression over its full history, calibrated to the deepest historical low | >20% above / 0–20% above / below the floor |
| **Alts vs Bitcoin** | TOTAL3 ÷ BTC market cap vs its 50-day average | >1% above / within ±1% / >1% below |
| **Altcoin Market Tide** | TOTAL3 market cap vs its 50-day and 200-day averages | above both / mixed / below both |

**Confluence score:** each green tile +1, each red −1, amber 0 → a score
from −4 to +4 with a regime label, shown as the page headline.

**State flips are confirmed on weekly closes only** (Monday 00:00 UTC).
A flip needs one weekly close beyond the boundary by more than 2%, or two
consecutive closes within that buffer; an opposing close resets the counter.
Intraweek disagreement shows as a "not yet confirmed" note, never as a flip.

## How it runs

```
pipeline/   TypeScript daily job: fetch → append history → compute → write JSON
web/        React + Vite static dashboard (reads data/state.json)
data/       committed history CSVs + state.json + flips.json (the alert feed)
```

- A GitHub Actions cron (`.github/workflows/daily.yml`) runs the pipeline at
  00:15 UTC, commits the updated `data/` files, rebuilds the dashboard, and
  deploys it to GitHub Pages. No servers, no manual steps.
- Prices come from Binance public klines. Market caps come from CoinGecko's
  free tier; TOTAL3 is approximated as the summed market caps of the top 100
  coins excluding BTC and ETH.
- The pipeline is stateless: flip history is replayed from the stored series
  on every run, so re-runs are idempotent and the flip log is reproducible.

## Local development

```bash
npm install
npm run backfill    # one-off: seed data/history/ (re-runs only fill gaps)
npm run pipeline    # compute data/state.json + data/flips.json
npm run dev         # dashboard at http://localhost:5173
npm run test        # unit tests, incl. the forbidden-words copy guard
```

## One-time GitHub setup

1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. (Optional) Add a free CoinGecko demo key as the `COINGECKO_API_KEY`
   secret to raise the API rate limit.
3. Merge to `main` — the daily workflow also runs on push, so the first
   deploy happens immediately.

## Roadmap

Phase 2 adds market-structure tiles (ETF flows, funding, stablecoin supply,
open interest). Email alerts will read `data/flips.json` — confirmed flips
only, never intraweek noise. See the standing rule above about language:
the words that describe trading instructions do not appear in this product.
