import * as vscode from 'vscode';

const VIEW_TYPE = 'wordcraft.viewer';

interface WordcraftDoc extends vscode.CustomDocument {
	uri: vscode.Uri;
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			VIEW_TYPE,
			new WordcraftViewerProvider(context),
			{ supportsMultipleEditorsPerDocument: false },
		),
	);
}

class WordcraftViewerProvider implements vscode.CustomEditorProvider<WordcraftDoc> {
	/** The viewer never edits, so nothing ever fires. */
	private readonly nothingChanged = new vscode.EventEmitter<{ document: WordcraftDoc; edits: readonly object[] }>();
	onDidChangeCustomDocument = this.nothingChanged.event;

	constructor(private readonly context: vscode.ExtensionContext) { }

	async openCustomDocument(uri: vscode.Uri): Promise<WordcraftDoc> {
		return { uri, dispose: () => { } };
	}

	async resolveCustomEditor(document: WordcraftDoc, webviewPanel: vscode.WebviewPanel): Promise<void> {
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'dist')],
		};

		const appJs = webviewPanel.webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'app.js'),
		);
		const wasmUrl = webviewPanel.webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'wordcraft_embed_bg.wasm'),
		);
		const nonce = getNonce();
		webviewPanel.webview.html = webviewHtml(webviewPanel.webview, appJs, wasmUrl, nonce);

		webviewPanel.webview.onDidReceiveMessage(async (msg: { type?: string; message?: string }) => {
			if (msg && msg.type === 'ready') {
				try {
					const bytes = await vscode.workspace.fs.readFile(document.uri);
					await webviewPanel.webview.postMessage({
						type: 'open',
						name: fileNameOf(document.uri),
						data: base64(bytes),
					});
				} catch (err) {
					await webviewPanel.webview.postMessage({
						type: 'error',
						message: err instanceof Error ? err.message : String(err),
					});
				}
			}
		});
	}

	saveCustomDocument(): Thenable<void> { return Promise.resolve(); }
	saveCustomDocumentAs(): Thenable<void> { return Promise.resolve(); }
	revertCustomDocument(): Thenable<void> { return Promise.resolve(); }
	backupCustomDocument(): Thenable<vscode.CustomDocumentBackup> {
		return Promise.resolve({ id: 'readonly', delete: () => { } });
	}
}

function fileNameOf(uri: vscode.Uri): string {
	return uri.path.split('/').filter(Boolean).pop() ?? 'document';
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function base64(bytes: Uint8Array): string {
	let out = '';
	// 0x8000 = String.fromCharCode spread limit safety margin
	for (let i = 0; i < bytes.length; i += 0x8000) {
		out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return Buffer.from(out, 'binary').toString('base64');
}

function webviewHtml(webview: vscode.Webview, appJs: vscode.Uri, wasmUrl: vscode.Uri, nonce: string): string {
	const csp = webview.cspSource;
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
	content="default-src 'none'; img-src ${csp} data: blob:; font-src ${csp} data: blob:; style-src ${csp} 'unsafe-inline'; script-src ${csp} 'wasm-unsafe-eval' 'nonce-${nonce}'; connect-src ${csp} data: blob: https:;">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
	html, body, #root { height: 100%; margin: 0; }
</style>
</head>
<body>
<div id="root"></div>
<script nonce="${nonce}">self.globalThis.WORDCRAFT_WASM_URL = "${wasmUrl}";</script>
<script type="module" nonce="${nonce}" src="${appJs}"></script>
</body>
</html>`;
}
