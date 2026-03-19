# Loom

Write AI skills once. Compile to every coding agent.

Loom manages AI instructions, skills, and agents across Claude Code, GitHub Copilot, Codex CLI, and Gemini CLI. Author your content once, compile it to each tool's native format, deploy to your projects, and harvest improvements back.

## Install

```bash
npm install -g loom-cli
```

## Quick Start

```bash
# 1. Initialise a Loom workspace
loom init

# 2. Register a project
loom register myproject /path/to/project

# 3. Add a global instruction (applies to all projects)
echo "# Conventions\n\nUse conventional commits." > ~/.loom/global/instructions/conventions.md

# 4. Add a global skill (on-demand workflow)
mkdir -p ~/.loom/global/skills/analyse
echo "# Analyse\n\nRead the ticket and create an implementation plan." > ~/.loom/global/skills/analyse/SKILL.md

# 5. Compile and deploy
loom compile
loom deploy
```

That's it. Your project now has `CLAUDE.md`, `.github/copilot-instructions.md`, `AGENTS.md`, and `GEMINI.md` — all generated from the same source.

## How It Works

```
Author → Compile → Deploy → Work → Harvest
   ↑                                    │
   └────────────────────────────────────┘
```

1. **Author** content in `~/.loom/` — instructions, skills, and agents
2. **Compile** merges global + project layers into target-specific output
3. **Deploy** copies compiled files to your project directories
4. **Harvest** detects changes made during development and merges them back

Every step creates a git commit in the `~/.loom/` repo, so you can always roll back.

## Source Structure

```
~/.loom/
├── config.yaml              # Registered projects
├── global/
│   ├── instructions/        # Always-loaded context
│   ├── skills/              # On-demand workflows
│   └── agents/              # Workflow orchestrators
└── projects/
    └── <name>/
        ├── instructions/    # Project-specific context (merged with global)
        ├── skills/          # Project skills (override global by name)
        └── agents/          # Project agents (override global by name)
```

## Compile Targets

| Source | Claude Code | Copilot | Codex | Gemini |
|--------|------------|---------|-------|--------|
| `instructions/*.md` | `CLAUDE.md` | `.github/copilot-instructions.md` | `AGENTS.md` | `GEMINI.md` |
| `skills/foo/SKILL.md` | `.claude/skills/foo/SKILL.md` | `.github/skills/foo/SKILL.md` | — | — |
| `agents/work.md` | `.claude/agents/work.md` | `.github/agents/work.agent.md` | — | — |

## Commands

| Command | Description |
|---------|-------------|
| `loom init` | Create `~/.loom/` workspace with git tracking |
| `loom register <name> <path>` | Register a project for compilation |
| `loom compile [project]` | Compile source to target-specific output |
| `loom deploy [project]` | Copy compiled output to project paths |
| `loom harvest [project] [--yes]` | Detect changes and merge back to source |
| `loom diff [project]` | Preview what deploy would change |
| `loom discover` | Show registered projects and status |

See [docs/commands.md](docs/commands.md) for the full command reference.

## Documentation

- [Command Reference](docs/commands.md) — all commands, flags, and examples
- [Content Guide](docs/content-guide.md) — how to write instructions, skills, and agents

## License

MIT
