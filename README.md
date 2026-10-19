# WordCraft Viewer

View Microsoft Word documents (.docx, .doc) inside VS Code, powered by the
[WordCraft](https://github.com/storytold/wordcraft) engine compiled from Rust to WebAssembly,
with the full ribbon, dialogs, page layout and document fidelity — fully offline. Read-only.

## Features

<!-- Keep this list short: one line per feature, user-visible capabilities only.
     Update it on every major release (see .opencode/skills/release/SKILL.md). -->

- feat: Open Microsoft Word documents (.docx/.doc) read-only next to your code
- feat: View Chinese Word documents with correct fonts, no missing glyphs

Not affiliated with or endorsed by Microsoft. Built on
[WordCraft](https://github.com/storytold/wordcraft), the open-source engine.

## How to use

Open any `.docx` or `.doc` file in VS Code. (TODO: hook up the custom editor; scaffold only for now.)

## Requirements

None — fonts and rendering run in the webview (WebGPU with WebGL2 fallback).

## Extension Settings

* `myExtension.enable`: Enable/disable this extension.

## Known Issues

## Release Notes

### 0.0.1

Initial scaffold.
