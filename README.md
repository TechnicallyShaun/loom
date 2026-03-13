# Loom

Weave AI skills once, compile to every coding agent.

Loom manages your AI coding skills from a single source and compiles them into the native format for each tool: Claude Code, GitHub Copilot, Codex, Gemini CLI, Cursor, and others. One place to update, improvements cascade everywhere.

## Installation

- Requires Node.js 18+
- `npm install -g loom-cli`
- Or run without installing: `npx loom-cli`

## Getting Started

1. **Initialise Loom** — create a `.loom/` config directory with starter files:
   ```
   loom init
   ```

2. **Add a project** — register a repo so Loom knows where to deploy skills:
   ```
   loom add-project ~/repos/my-app
   ```

3. **Add skills** — write your skills as markdown in `.loom/skills/`:
   ```
   .loom/skills/git-workflow.md
   .loom/skills/commit-conventions.md
   ```

4. **Compile** — build target-specific output from your source skills:
   ```
   loom compile
   ```

5. **Deploy** — copy compiled output to global and project locations:
   ```
   loom deploy
   ```

## How It Works

```
.loom/
  config.yaml          # targets, projects, preferences
  skills/              # your source skills (write once)
  agents/              # process-phase definitions

        ↓ loom compile

dist/
  claude/CLAUDE.md
  copilot/copilot-instructions.md
  codex/AGENTS.md
  gemini/GEMINI.md

        ↓ loom deploy

~/.claude/CLAUDE.md              # global
~/repos/my-app/CLAUDE.md         # per-project
~/repos/my-app/.github/copilot-instructions.md
```

## License

MIT
