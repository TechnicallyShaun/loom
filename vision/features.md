# Features

## `loom init`
Create a `.loom/` directory in the current location with starter config and example skills. Optionally specify `--global` to initialise at `~/.loom/`.

## `loom compile`
Read all source skills from `.loom/skills/`, merge global and project-level configs, and produce target-specific output files in `dist/`. Each enabled target gets its own compiled output.

## `loom deploy`
Copy compiled output from `dist/` to registered target locations. Handles both global paths (e.g. `~/.claude/CLAUDE.md`) and per-project paths (e.g. `./CLAUDE.md`, `./.github/copilot-instructions.md`).

## `loom add-project <path>`
Register a project directory for deployment. Stores the path and its enabled targets in config. Loom will deploy project-level output to this location.

## `loom discover`
Scan for global and project-level `.loom/` directories. Display what was found: config, skills, registered projects, and enabled targets. Useful for debugging and orientation.

## Compiler Targets

| Target | Native file | Global path | Repo path |
|--------|------------|-------------|-----------|
| Claude Code | `CLAUDE.md` | `~/CLAUDE.md` | `./CLAUDE.md` |
| GitHub Copilot | `copilot-instructions.md` | `~/.github/copilot-instructions.md` | `./.github/copilot-instructions.md` |
| Codex CLI | `AGENTS.md` | `~/AGENTS.md` | `./AGENTS.md` |
| Gemini CLI | `GEMINI.md` | `~/GEMINI.md` | `./GEMINI.md` |
| Cursor | `.cursorrules` | N/A | `./.cursorrules` |

## Future Considerations

- **Harvest:** Pull changes back from deployed files into source skills
- **Diff:** Show what would change before deploying
- **Watch:** Auto-compile on skill file changes
