#!/usr/bin/env node
// Generate images/icon.png (128x128) by drawing pixels in code — an original icon:
// a white page on a light portrait card with a coloured title band and text bars.
import { mkdirSync, writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

const S = 128;
const px = new Uint8Array(S * S * 4); // RGBA

function set(x, y, [r, g, b, a = 255]) {
	if (x < 0 || y < 0 || x >= S || y >= S) return;
	const i = (y * S + x) * 4;
	px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}
function rect(x0, y0, x1, y1, c) {
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, c);
}

const CARD = [225, 236, 248];      // outer card
const PAGE = [255, 255, 255];      // document page
const TITLE = [0x2f, 0x6f, 0xc9];  // title band blue
const BAR = [0xc9, 0xd2, 0xde];    // text lines grey

rect(12, 4, 116, 124, CARD);
rect(34, 20, 94, 108, PAGE);
rect(40, 28, 88, 40, TITLE);
rect(40, 50, 88, 56, BAR);
rect(40, 64, 88, 70, BAR);
rect(40, 78, 74, 84, BAR);

// PNG assembly (no deps)
const crcTable = [];
for (let n = 0; n < 256; n++) {
	let c = n;
	for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	crcTable[n] = c >>> 0;
}
function crc32(buf) {
	let c = 0xffffffff;
	for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
	const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type), data]);
	const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
	return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
	raw[y * (S * 4 + 1)] = 0; // filter: none
	Buffer.from(px.buffer, y * S * 4, S * 4).copy(raw, y * (S * 4 + 1) + 1);
}

mkdirSync(new URL('../images', import.meta.url), { recursive: true });
const png = Buffer.concat([
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
	chunk('IHDR', ihdr),
	chunk('IDAT', deflateSync(raw)),
	chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('../images/icon.png', import.meta.url), png);
console.log('✓ images/icon.png (128x128, code-drawn)');
