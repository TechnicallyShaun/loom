# Architecture

## Stack

- **Language:** TypeScript (strict mode, ES2022, NodeNext)
- **Runtime:** Node.js 22+
- **Package manager:** npm
- **Distribution:** npm registry (`npm install -g loom-cli`)
- **Config format:** YAML
- **Dependencies:** `yaml` (single runtime dep)

## Project Structure

```
loom-cli/
  src/
    index.ts              # CLI entry point (process.argv dispatch)
    commands/
      init.ts             # Initialise .loom/ workspace
      register.ts         # Register a project for compilation
      compile.ts          # Merge layers and compile per target
      deploy.ts           # Copy compiled output to project paths
      harvest.ts          # Diff deployed files, merge changes back
      diff.ts             # Preview what deploy would change
      discover.ts         # Show registered projects and status
    compilers/
      index.ts            # Dispatcher (compileForTarget, compileForTargetUserLevel)
      claude.ts           # Claude Code output
      copilot.ts          # GitHub Copilot output
      codex.ts            # Codex CLI output
      gemini.ts           # Gemini CLI output
    config/
      loader.ts           # YAML config loading, saving, validation
    types/
      index.ts            # Shared types and constants
    utils/
      paths.ts            # Path resolution (loomDir, compiledDir, userLevelDir)
      sources.ts          # File reading, layer merging, directory walking
      git.ts              # Git operations (init, commit, tag)
  dist/                   # TypeScript compiled output (gitignored)
  vision/                 # Future plans and specs
  docs/                   # User documentation
```

## Pipeline

The core data flow is: **source -> compile -> deploy** (and **harvest** for the reverse).

1. **Source** lives in `.loom/` — a self-contained git repo with global and per-project layers
2. **Compile** merges the two layers, then runs per-target compilers to produce output in `dist/<project>/`
3. **Deploy** copies compiled files to registered project paths (pure file copy, no transformation)
4. **Harvest** diffs deployed files against compiled output to detect changes, then writes them back to source

### Two-tier compilation

- **Per-project:** merged global + project content -> `dist/<project>/` -> deploy to project path
- **Global (user-level):** global-only content -> `dist/_global/<target>/` -> deploy to `~/.claude/`, `~/.copilot/`

## Key Concepts

### Source types and merge rules

Three content types with two-layer (global + project) merging:

- **Instructions** (`instructions/*.md`): always-loaded context. Layers are **concatenated** (global first, separated by `---`).
- **Skills** (`skills/*/SKILL.md`): on-demand workflows in folders. Project **overrides** global by name.
- **Agents** (`agents/*.md`): orchestrator definitions. Project **overrides** global by name.

### Config

YAML-based (`config.yaml`) with `targets` array and `projects` map. Tracked in the `.loom/` git repo.

### Targets

Registered output destinations. Each target has a compiler that transforms source content into the tool's native format.

| Target | Instructions | Skills | Agents | User-level |
|--------|-------------|--------|--------|------------|
| Claude | Yes | Yes | Yes | `~/.claude/` |
| Copilot | Yes | Yes | Yes | `~/.copilot/` |
| Codex | Yes | No | No | No |
| Gemini | Yes | No | No | No |
