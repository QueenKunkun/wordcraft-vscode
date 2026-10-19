#!/bin/bash
set -e
cd "$(dirname "$0")/.."

pnpm run package-vsix

VSIX=$(ls -t wordcraft-vscode-*.vsix | head -1)
echo "Installing $VSIX..."
code --install-extension "$VSIX" --force
echo "Done."
