#!/usr/bin/env node
import { statSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = 'wordcraft-vscode.vsix';
// The extension embeds the WordCraft WASM binary (~30 MB raw, ~12 MB gzipped).
// Raising the default limit and allowing an override via ALLOW_LARGE_VSIX=1.
const DEFAULT_LIMIT_MB = 60;
const LIMIT_MB = Number(process.env.VSIX_LIMIT_MB) || DEFAULT_LIMIT_MB;
const LIMIT = LIMIT_MB * 1024 * 1024;

function human(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, a => { rl.close(); resolve(a); }));
}

console.log(`Packaging ${OUT} …`);
execSync(`npx @vscode/vsce package --no-dependencies -o ${OUT}`, { cwd: ROOT, stdio: 'inherit' });

const size = statSync(`${ROOT}${OUT}`).size;

if (size <= LIMIT) {
  console.log(`✓ ${OUT} = ${human(size)} (under ${LIMIT_MB} MB)`);
  process.exit(0);
}

console.log(`⚠ ${OUT} = ${human(size)} (over ${LIMIT_MB} MB)`);

if (process.env.ALLOW_LARGE_VSIX === '1') {
  console.log('ALLOW_LARGE_VSIX=1 set — continuing.');
  process.exit(0);
}

const answer = (await ask('Publish anyway? (y/N) ')).trim().toLowerCase();
if (answer === 'y' || answer === 'yes') {
  process.exit(0);
}
console.error(`Aborted: package exceeds ${LIMIT_MB} MB.`);
process.exit(1);
