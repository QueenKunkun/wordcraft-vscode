# WordCraft Viewer

View Microsoft Word documents (.docx, .doc) inside VS Code, powered by the
[WordCraft](https://github.com/storytold/wordcraft) engine compiled from Rust to WebAssembly,
with page layout, headers/footers and document fidelity. Read-only.

## Features

<!-- Keep this list short: one line per feature, user-visible capabilities only.
     Update it on every major release (see .opencode/skills/release/SKILL.md). -->

- Open Microsoft Word documents (.docx/.doc) read-only next to your code
- View Chinese Word documents with correct fonts, no missing glyphs

Not affiliated with or endorsed by Microsoft. Built on
[WordCraft](https://github.com/storytold/wordcraft), the open-source engine.

## How to use

Open any `.docx` or `.doc` file in VS Code — it renders in the WordCraft viewer instead of
showing raw XML. Close the tab to release the viewer.

## Requirements

- Rendering runs entirely in the webview (WebGL).
- Chinese documents fetch their CJK fonts (Noto Serif/Sans SC) on first open — needs network
  once per window, then cached in IndexedDB.

## Known Issues

- The UI (status bar, menus) is English-only.
- `.docm`/`.dotm` open read-only; some documents may not render 100% faithfully.

## Release Notes

See [CHANGELOG.md](CHANGELOG.md).
