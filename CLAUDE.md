# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Loom is a TypeScript CLI that manages AI coding instructions, skills, and agents from a single source and compiles them into native formats for multiple AI coding assistants (Claude Code, Copilot, Codex, Gemini). Published to npm as `loom-cli`.

## Build, Test & Lint

```bash
npm run build           # Compile TypeScript to dist/
npm run dev             # Watch mode compilation
npm start               # Run compiled CLI (dist/index.js)
npm test                # Run all tests (vitest)
npm run test:watch      # Tests in watch mode
npm run test:coverage   # Tests with coverage report
npm run lint            # ESLint on src/
npm run format          # Prettier auto-format
npm run format:check    # Prettier check (no write)
```

CI (.github/workflows/ci.yml) runs lint, format:check, build, test, and coverage on Node 22.

## Architecture

### Pipeline

The core data flow is: **source → compile → deploy** (and **harvest** for the reverse).

1. **Source** lives in `.loom/` — a self-contained git repo with global and per-project layers
2. **Compile** runs per-target compilers on each layer independently — global to `dist/_global/`, project to `dist/<project>/`
3. **Deploy** copies compiled files to their destinations (project output → project path, global output → user-level dirs like `~/.claude/`), cleaning stale files first
4. **Harvest** diffs deployed files against compiled output to detect changes, then writes them back to source

### CLI entry point

`src/index.ts` dispatches commands via `process.argv[2]` using dynamic imports.

### Commands (`src/commands/`)

`init`, `register`, `compile`, `deploy`, `harvest`, `diff`, `discover` — every mutating command creates a git commit in the `.loom/` repo for audit trail and rollback.

### Compilers (`src/compilers/`)

Each compiler takes a `MergedProject` and returns `CompiledFile[]`. Targets: claude, copilot, codex, gemini. Claude and Copilot support instructions + skills + agents; Codex and Gemini support instructions only.

### Config (`src/config/loader.ts`)

YAML-based (`config.yaml`) with `targets` array and `projects` map. Config is tracked in the `.loom/` git repo. `validateTargets()` checks against `VALID_TARGETS`.

### Source types and compilation rules

Three content types at two layers (global + project). Each layer compiles independently — global to user-level output, project to project output. The AI target sees both at runtime.

- **Instructions** (`instructions/*.md`): always-loaded context. Global compiles to user-level, project compiles to project-level.
- **Skills** (`skills/*/SKILL.md`): on-demand workflows in folders. Global compiles to user-level, project compiles to project-level.
- **Agents** (`agents/*.md`): orchestrator definitions. Global compiles to user-level, project compiles to project-level.

### Utilities (`src/utils/`)

- `paths.ts` — Loom directory resolution (env var → walk-up search → default), path helpers
- `sources.ts` — File reading (`readMarkdownDir`, `readSkillsDir`), `mergeLayers`, `concatInstructions`, `walkDir`
- `git.ts` — `gitInit`, `gitCommit`, `getShortHash`, `gitTag` (all via `execSync`)

### Types (`src/types/index.ts`)

`TargetType` (union of target strings), `LoomConfig`, `ProjectEntry`, `SourceContent`, `MergedProject`, `CompiledFile`, `CompiledProject`.

## Conventions

- TypeScript strict mode, ES2022 target, NodeNext module resolution
- ESM throughout (imports use `.js` extensions for compiled output)
- Single runtime dependency: `yaml` for config parsing
- Prettier: double quotes, semicolons, trailing commas, 100 char width
- ESLint: unused args prefixed with `_` are allowed
- Design docs in `vision/` and `docs/` (canonical v2 design: `docs/v2-architecture.md`)
