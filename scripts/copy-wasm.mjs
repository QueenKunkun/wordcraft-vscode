#!/usr/bin/env node
// Copy the WordCraft WASM binary into dist/ so it is served from the webview.
// The glue JS is bundled into app.js; it looks the binary up at the URL passed
// as `wasmUrl` (see src/frontend/index.tsx).
import { copyFileSync, mkdirSync } from 'fs';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = `${ROOT}node_modules/@gamine/wordcraft-react/wasm/wordcraft_embed_bg.wasm`;
const OUT_DIR = `${ROOT}dist`;

mkdirSync(OUT_DIR, { recursive: true });
copyFileSync(SRC, `${OUT_DIR}/wordcraft_embed_bg.wasm`);
console.log('✓ dist/wordcraft_embed_bg.wasm');
