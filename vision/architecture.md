# Architecture

## Stack

- **Language:** TypeScript
- **Runtime:** Node.js 18+
- **Package manager:** npm
- **Distribution:** npm registry (`npx loom-cli`)
- **Config format:** YAML

## Project Structure

```
loom/
  src/
    index.ts              # CLI entry point
    commands/             # Command implementations
      init.ts
      compile.ts
      deploy.ts
      add-project.ts
      discover.ts
    compilers/            # Per-target output formatters
      claude.ts
      copilot.ts
      codex.ts
      gemini.ts
    config/               # Config loading and resolution
      loader.ts
      resolver.ts
    types/                # Shared type definitions
      index.ts
  dist/                   # Compiled output (gitignored)
  vision/                 # Project vision and specs
  docs/                   # User documentation
```

## Key Concepts

### Source Skills
Markdown files in `.loom/skills/`. These are your canonical definitions, written in a neutral format that any human or AI can read.

### Compilers
Each target AI has a compiler that transforms source skills into the tool's native format. Compilers handle differences in structure, naming, and conventions.

### Config Resolution
Loom uses a two-layer config model:
- **Global** (`~/.loom/`) — shared skills and defaults
- **Project** (`.loom/` in a repo) — project-specific overrides

Project config inherits from global. Project wins on conflicts.

### Targets
Registered output destinations. Each target has a type (claude, copilot, etc.) and a path (where to write the compiled output).
