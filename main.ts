// Vice Coast Cover Studio — entry handoff program for make.fun gta6-cover-art-01.
//
// Copies the static web app (app/) and the screenshots (screenshots/) from this
// repository into the output directory, then writes dossier.json with the
// vendored buildDossier library so the scorer can rebuild and compare it.
// Runs under Node 22 with the standard library only; MAKEFUN_OUTPUT_DIR stands
// in for /output outside the grader. Both runs must write identical bytes, so
// nothing here reads the clock or the network.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTreeInto(fromDir: string, toDir: string): void {
  // Copy the whole tree as plain files: symlinks are refused by the gate, so
  // dereference stays off and anything unusual fails loudly instead of
  // silently producing a different dossier on the second run.
  mkdirSync(toDir, { recursive: true });
  cpSync(fromDir, toDir, { recursive: true, force: true, dereference: false });
}

function handInEntry(): void {
  const appSource = join(repoRoot, 'app');
  const shotsSource = join(repoRoot, 'screenshots');
  if (!existsSync(join(appSource, 'index.html'))) {
    throw new Error('main.ts: app/index.html is missing from the repository');
  }
  if (!existsSync(shotsSource)) {
    throw new Error('main.ts: screenshots/ is missing from the repository');
  }
  mkdirSync(outputDir, { recursive: true });
  copyTreeInto(appSource, join(outputDir, 'app'));
  copyTreeInto(shotsSource, join(outputDir, 'screenshots'));
  const dossierBytes = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
  console.log(`handed in app/ + screenshots/ to ${outputDir} (dossier ${dossierBytes.length} bytes)`);
}

handInEntry();
