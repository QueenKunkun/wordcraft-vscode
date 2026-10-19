# Agent preferences

## Committing
- Do NOT amend commits unless it's a genuine error (typo, broken build).
- Feature changes, requirement changes, and bug fixes all get new commits.
- Each commit message should accurately describe what changed.
- Commit messages must be in English.
- Commit one logical change at a time. After finishing each change (edit files, build passes, `pnpm run lint` passes), commit immediately before moving to the next task.

## Testing
- `pnpm run compile` (webpack) builds `dist/extension.js`
- `pnpm test` runs compile-tests → compile → lint → vscode-test; `vscode-test` needs a running VS Code instance and fails in a plain terminal
- After changing anything, run `pnpm run lint` at minimum, and `pnpm test` when VS Code is available

## Docs
- NEVER add documentation to this repo except `README.md`, `CHANGELOG.md` and `vsc-extension-quickstart.md`.
- All plans, postmortems, TODOs, chat logs and any file containing Chinese go to the sibling private repo
  `../wordcraft-vscode-private/docs/` (see `docs/README_FIRST.md`). Never commit Chinese content to the public repo.

## Versioning and release
- Do NOT bump the version number unless the user asks, or the `release` skill (below) instructs it.
- Never create releases manually: load the release skill first via `skill("release")`, then follow it. Triggers: "发版", "release", "bump version", "publish".
- Releases are identified by git tags `vX.Y.Z`; tags are the only authoritative record.

## Skills
Project skills live in `.opencode/skills/`:
- `release` — the release workflow (uses `scripts/release.mjs`)
- `create-skills` — how to create or modify opencode skills

Do not copy code between places: extract functions or reuse existing logic instead.

## House rules (same as the on-air project)
1. Never copy code — extract or reuse.
2. One commit per logical change.
3. Commit directly; no need to wait for user approval for commits.
4. Never bump the version number yourself.
5. Run the tests after every change.
6. Commit postmortems immediately after writing them (into the private repo).
7. Always load the release skill before any release work.
