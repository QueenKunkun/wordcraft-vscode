#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;
const PKG = JSON.parse(readFileSync(`${ROOT}package.json`, 'utf8'));
const CUR = PKG.version;
const args = process.argv.slice(2);

function exec(cmd, fatal = false) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).toString(); }
  catch (e) {
    if (fatal) { console.error(e.stderr?.toString() || e.message); process.exit(1); }
    return '';
  }
}

function help() {
  console.log(`
Usage: node scripts/release.mjs <patch|major> [options]

Arguments:
  patch|major          Bump type

Options:
  -m, --message TEXT   Changelog entries (newline-separated)
  --no-commit          Update files but do not git commit
  -h, --help           Show this help

Special mode:
  --summarize          Print git log since last release tag
`);
}

if (args.includes('-h') || args.includes('--help')) { help(); process.exit(0); }

// ---- summarize ----
if (args[0] === '--summarize') {
  const tags = exec('git tag -l "v*" --sort=-v:refname').trim().split('\n');
  const lastTag = tags[0];
  if (!lastTag) { console.log('(no tags found)'); process.exit(0); }
  const log = exec(`git log --oneline ${lastTag}..HEAD --no-merges`).trim();
  const feat = [], fix = [], other = [];
  for (const line of log.split('\n').filter(Boolean)) {
    if (line.includes(' feat:')) feat.push(line);
    else if (line.includes(' fix:')) fix.push(line);
    else other.push(line);
  }
  if (feat.length) { console.log('--- feat ---'); feat.forEach(l => console.log(l)); }
  if (fix.length)  { console.log('--- fix ---');  fix.forEach(l => console.log(l)); }
  if (other.length){ console.log('--- other ---'); other.forEach(l => console.log(l)); }
  process.exit(0);
}

// ---- parse args ----
const BUMP = args[0];
if (BUMP !== 'patch' && BUMP !== 'major') {
  console.error('Error: first argument must be "patch" or "major"'); help(); process.exit(1);
}

let NO_COMMIT = false;
let MSG = '';

for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === '--no-commit') { NO_COMMIT = true; }
  else if (a === '-m' || a === '--message') { MSG = args[++i] || ''; }
  else { console.error(`Unknown option: ${a}`); help(); process.exit(1); }
}

if (!MSG) { console.error('Error: --message is required'); process.exit(1); }

// ---- compute version ----
const [maj, min, pat] = CUR.split('.').map(Number);
let newMaj = maj, newMin = min, newPat = pat;
if (BUMP === 'patch') newPat++;
else { newMin++; newPat = 0; }
const NEW = `${newMaj}.${newMin}.${newPat}`;

console.log(`Bumping ${CUR} -> ${NEW} (${BUMP})`);

// ---- format bullets ----
const bullets = MSG.split('\n').map(l => {
  const t = l.trim();
  if (/^-\s/.test(t)) return '- ' + t.replace(/^-\s*/, '');
  return '- ' + t;
}).join('\n');

// ---- update package.json ----
PKG.version = NEW;
writeFileSync(`${ROOT}package.json`, JSON.stringify(PKG, null, 2) + '\n');
console.log(`✓ package.json -> ${NEW}`);

// ---- update CHANGELOG.md ----
const date = new Date().toISOString().slice(0, 10);
const changelog = readFileSync(`${ROOT}CHANGELOG.md`, 'utf8');
const header = `## [${NEW}] - ${date}\n\n${bullets}\n\n`;
const updated = changelog.replace(/^# Change Log\n/, '# Change Log\n\n' + header);
writeFileSync(`${ROOT}CHANGELOG.md`, updated);
console.log('✓ CHANGELOG.md updated');

// ---- commit or print ----
if (NO_COMMIT) {
  console.log(`\n✓ Files updated (not committed). Next:\n  git add -A && git commit -m "release: v${NEW}" && git tag v${NEW}`);
} else {
  exec(`git add -A && git commit -m "release: v${NEW}"`, true);
  console.log(`\n✓ Committed as release: v${NEW}`);
  console.log(`Next: git tag v${NEW} && git push && git push --tags && vsce package && vsce publish`);
}
