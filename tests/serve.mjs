// Browser harness: run the app outside VS Code by stubbing acquireVsCodeApi
// and loading a sample .docx, exactly the way the extension host does.
//   node tests/serve.mjs     then open http://127.0.0.1:8137/tests/harness.html
import { readFileSync, existsSync } from 'fs';
import { createServer } from 'http';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = 8137;
const MIME = {
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.html': 'text/html',
	'.wasm': 'application/wasm',
	'.css': 'text/css',
	'.png': 'image/png',
};

createServer((req, res) => {
	const path = req.url.split('?')[0].split('#')[0];
	const file = `${ROOT}${decodeURIComponent(path)}`;
	if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
	for (const [ext, type] of Object.entries(MIME)) {
		if (path.endsWith(ext)) res.setHeader('Content-Type', type);
	}
	res.end(readFileSync(file));
}).listen(PORT, () => console.log(`harness: http://127.0.0.1:${PORT}/tests/harness.html`));
