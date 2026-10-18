// Runs an Astro command (check or build) without breaking a running dev server.
// Every content sync rewrites .astro/content-assets.mjs and content-modules.mjs.
// A production sync writes them without the dev-only sample fixtures, and the
// dev server re-reads them from disk on its next content change, losing the
// sample images. So save them first and put them back afterwards, also when
// the command fails or is interrupted. The dev server ignores both writes
// (vite.server.watch in astro.config.mjs).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const files = ['content-assets.mjs', 'content-modules.mjs'].map((file) =>
  fileURLToPath(new URL(`../.astro/${file}`, import.meta.url)),
);
const saved = files.filter((file) => existsSync(file)).map((file) => ({ file, text: readFileSync(file, 'utf8') }));

// Ctrl-C still stops the command; this process waits for it, then restores.
process.on('SIGINT', () => {});

const [command, ...args] = process.argv.slice(2);
const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });

for (const { file, text } of saved) {
  if (!existsSync(file) || readFileSync(file, 'utf8') !== text) writeFileSync(file, text);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
