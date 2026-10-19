---
name: Create Skills
description: >
  Use when the user asks you to create a new OpenCode skill. Do NOT use for
  editing existing skills, reading skill contents, or general OpenCode config
  questions.
compatibility: opencode
---

# Skill: Create Skills

## Workflow

When the user asks to create a new skill, go through the decision tree below.
For each question, check if the answer is already implied by the user's message;
only ask if it's ambiguous.

## Decision Tree

### 1. Scope

- **Project-level** (default): `<project-root>/.opencode/skills/<name>/`
- **Global**: `~/.config/opencode/skills/<name>/`
  — Only use this if the user explicitly says "global" or "全局".
  — Otherwise ALWAYS default to project-level.

### 2. Front-matter

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Short, human-readable, Pascal Case or Title Case |
| `description` | Yes | Comma-separated trigger keywords. What conversations should load this skill? |
| `allowed-tools` | No | Default: unrestricted. Add only if the skill's workflows need specific tooling. |
| `license` | No | Only when sharing. |
| `metadata.category` | No | Optional classification tag. |
| `compatibility` | No | Defaults to `opencode`. |

### 3. Body structure

Decide which of these sections the skill needs:

| Section | Needed when… |
|---|---|
| Workflow / process steps | The skill describes a multi-step procedure |
| Rules / constraints | There are hard rules the agent must follow |
| Code patterns / conventions | The skill documents code style or architecture decisions |
| Token tables / config values | The skill documents specific values (colors, keys, sizes) |
| Templates | The skill provides boilerplate text for output |

### 4. Supporting files

Create these directories only if the skill actually needs them:

- `references/` — detailed reference docs loaded on demand
- `scripts/` — executable scripts (bash, python, etc.)

If the skill is purely documentation/instruction, skip both.

### 5. Usage verification

After creating the skill:

1. Check that `description` keywords match real-world triggers.
2. If no `.opencode/opencode.jsonc` exists yet, create one with minimal content to ensure the skills directory is discoverable:
   ```jsonc
   {
     "$schema": "https://opencode.ai/config.json",
     "skills": [".opencode/skills"]
   }
   ```
   (OpenCode auto-discovers `.opencode/skills/` by default, so this file is only needed if explicit config is desired.)
3. No manual registration step needed — OpenCode scans the directory automatically.
