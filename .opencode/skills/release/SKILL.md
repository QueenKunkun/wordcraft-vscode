---
name: release
description: >
  Prepare a release of the wordcraft-vscode VS Code extension: summarize changes
  since last release tag, determine major vs patch, update
  package.json, CHANGELOG.md, README.md (if needed), commit, tag,
  and print publish instructions. Use this whenever the user says
  "发版", "release", "bump version", or "publish".
allowed-tools: Read, Edit, Write, Bash(node:*), Bash(git:*)
---

# Prerequisites

Before starting any release work, load this skill explicitly via `skill("release")`.

Then check what already exists in the project:

- `.opencode/skills/` — read existing skill files before creating or modifying
- `scripts/` — check for automation scripts before writing manual steps
- `README.md` Features list — know what's already documented

Do **not** guess or search by filename pattern. Read the directory directly.

After any setup step (creating files, installing config), verify it actually took effect. For example, after adding a new skill, check that it appears in `<available_skills>` in the next conversation.

# Release workflow

Releases are identified by git tags (`vX.Y.Z`). A tag means that version has been published to the marketplace. Always use `git tag -l "v*" --sort=-v:refname | head -1` to find the last released version. Do **not** use `package.json`'s version field or git commit messages to determine the last release — only tags are authoritative.

## Steps

### 1. Discover changes since last release tag

```bash
git tag -l "v*" --sort=-v:refname | head -1
```

List commits since that tag:

```bash
git log --oneline <last-tag>..HEAD --no-merges
```

### 2. Summarize changelog

**Only list genuinely new features.** Scan the commits and ask: "Is this a first-time capability for the user?" If yes, list it. If it's a bugfix, enhancement, visual polish, or internal change — drop it. Users don't care about fixes to things they just got.

Format: one line per feature, `feat: Add X`. No explanations, no parentheses, no benefits. Users scan, they don't read.

```
feat: Add docx preview in a read-only webview
```

Before writing, identify the **headline** — the single most impactful new feature. List it first. Every version should have one line that makes users want to upgrade.

You can use the helper script to review commits, but do **not** translate commit messages into changelog entries. They are not the same thing.

```bash
node scripts/release.mjs --summarize
```

### 3. Determine major vs patch (ask the user or decide yourself)

- **major** (middle number +1, patch reset to 0): new user-facing features or behavior changes. These require updating the Features list in README.md.
- **patch** (last number +1): bug fixes, refactors, chores, docs, deps — nothing the user needs to know about as a new capability.

Read the current README.md Features section. If the feature is already described there, it's a patch.

### 4. Run release.mjs

Use the Node.js release script. Write the changelog message to a temp file first to avoid shell quoting issues, then pass it:

```bash
cat > /tmp/_relmsg.txt << 'EOF'
- feat: add "Wrap" toggle button in the preview toolbar to wrap long table cells
EOF

# For patch (auto-commits):
node scripts/release.mjs patch --message "$(cat /tmp/_relmsg.txt)"

# For major (--no-commit, so you can update README first):
node scripts/release.mjs major --message "$(cat /tmp/_relmsg.txt)" --no-commit
```

### 5. For major: update README.md

Add the new feature to the Features bullet list in README.md. Use the same concise style as the changelog — one line per feature, no explanations. Keep the total list short; readers of README also don't read long lists.

### 6. Commit and tag

```bash
git add -A
git commit -m "release: v<new-version>"
git tag v<new-version>
```

### 7. Print next steps

```
git push && git push --tags && pnpm publish-all
```

`pnpm publish-all` first runs `scripts/check-size.mjs`, which packages `wordcraft-vscode.vsix` and aborts if it exceeds the size limit (prompt to continue, or `ALLOW_LARGE_VSIX=1` to skip); it then publishes that same artifact to the VS Marketplace and Open VSX (PAT/tokens via `.env`).

Leave the final publish to the user.
