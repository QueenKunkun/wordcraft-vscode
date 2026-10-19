import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { WordcraftEditor, type WordcraftEditorRef, type FontSource } from '@gamine/wordcraft-react';

interface OpenMsg { type: 'open'; name: string; data: string; }
interface ErrMsg { type: 'error'; message: string; }
type HostMsg = OpenMsg | ErrMsg;

declare function acquireVsCodeApi(): { postMessage(msg: object): void };
declare global {
	// injected for every webview instance by src/extension.ts
	// eslint-disable-next-line no-var
	var WORDCRAFT_WASM_URL: string;
}

const wasmUrl = self.globalThis.WORDCRAFT_WASM_URL;

// WASM builds have no system font fallback: Chinese documents draw tofu unless a CJK face is
// registered with the engine. We offer the font names Chinese documents actually use and back
// them with Noto Sans/Serif SC (full variable TTFs, fetched once from the Google Fonts repo).
const CJK_SANS_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf';
const CJK_SERIF_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf';

// Document font names that should render with a serif (song/face) CJK font.
const CJK_SERIF_NAMES = new Set([
	'SimSun', '宋体', 'NSimSun', '新宋体',
	'FangSong', '仿宋', 'FangSong_GB2312', '仿宋_GB2312',
	'STSong', '华文宋体', 'STZhongsong', '华文中宋', 'Songti SC',
	'KaiTi', '楷体', 'KaiTi_GB2312', '楷体_GB2312', 'STKaiti', '华文楷体',
]);
const DOC_FONT_NAMES = [
	...CJK_SERIF_NAMES,
	'SimHei', '黑体', 'Microsoft YaHei', '微软雅黑', 'DengXian', '等线',
	'STHeiti', 'STXihei', '华文细黑', 'LiSu', '隶书', 'YouYuan', '幼圆',
];

const fontFileCache = new Map<string, Promise<Uint8Array[]>>();
function cjkFontFile(url: string): Promise<Uint8Array[]> {
	let p = fontFileCache.get(url);
	if (!p) {
		p = fetch(url).then((r) => {
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			return r.arrayBuffer();
		}).then((b) => [new Uint8Array(b)]);
	}
	return p;
}

const cjkFontSource: FontSource = {
	families: () => DOC_FONT_NAMES,
	load: (family) => cjkFontFile(CJK_SERIF_NAMES.has(family) ? CJK_SERIF_URL : CJK_SANS_URL),
};

const isDark = () => document.body.classList.contains('vscode-dark');

type FileState = { name: string; data: Uint8Array } | null;

function App() {
	const ref = useRef<WordcraftEditorRef>(null);
	const [file, setFile] = useState<FileState>(null);
	const [error, setError] = useState<string | null>(null);
	const [dark, setDark] = useState(isDark());

	const inVsCode = typeof acquireVsCodeApi === 'function';

	useEffect(() => {
		if (!inVsCode) {
			setError('This page must run inside VS Code (no acquireVsCodeApi).');
			return;
		}
		const vsCodeApi = acquireVsCodeApi();
		vsCodeApi.postMessage({ type: 'ready' });
		const onHost = (ev: MessageEvent) => {
			const msg = ev.data as HostMsg;
			if (msg.type === 'open') {
				const bytes = base64ToBytes(msg.data);
				setFile({ name: msg.name, data: bytes });
				setError(null);
			} else if (msg.type === 'error') {
				setError(msg.message);
			}
		};
		window.addEventListener('message', onHost);

		const obs = new MutationObserver(() => setDark(isDark()));
		obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
		return () => {
			window.removeEventListener('message', onHost);
			obs.disconnect();
		};
	}, []);

	if (error) {
		return <div style={{ color: 'var(--vscode-errorForeground, #f66)', padding: 24 }}>Cannot open document: {error}</div>;
	}
	if (!inVsCode) {
		return null;
	}
	if (!file) {
		return <div style={{ color: 'var(--vscode-descriptionForeground, #999)', padding: 24 }}>Loading…</div>;
	}
	return (
		<WordcraftEditor
			ref={ref}
			document={{ name: file.name, data: file.data }}
			height="100%"
			permission="view"
			mode="viewing"
			ribbon="hidden"
			titleBar={false}
			dark={dark}
			fonts={cjkFontSource}
			// The UI font face in the wasm build has no CJK glyphs yet; English labels avoid tofu
			// in the status bar and menus.
			prefs={{ language: 'en' }}
			renderer="webgl"
			wasmUrl={wasmUrl}
			onError={(err) => setError(err instanceof Error ? err.message : String(err))}
		/>
	);
}

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) {
		out[i] = bin.charCodeAt(i);
	}
	return out;
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
