// Copies the pipeline's JSON output into the static asset directory so the
// dashboard can fetch it with a relative path in both dev and production.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(webRoot, '..', 'data');
const outDir = join(webRoot, 'public', 'data');

mkdirSync(outDir, { recursive: true });
for (const file of ['state.json', 'flips.json']) {
  const src = join(dataDir, file);
  if (existsSync(src)) {
    copyFileSync(src, join(outDir, file));
    console.log(`copied data/${file}`);
  } else {
    console.warn(`data/${file} not found — run the pipeline first`);
  }
}
