# Loom

Write AI skills once. Compile to every coding agent.

Loom is a CLI tool that manages AI instructions, skills, and agents across multiple coding tools (Claude Code, GitHub Copilot, Codex CLI, Gemini CLI). Author your content once in a single source format, compile it to each tool's native format, deploy to your projects, and harvest improvements back.

## The Problem

Every AI coding tool has its own format:

- Claude Code wants `CLAUDE.md` + `.claude/skills/` + `.claude/agents/`
- Copilot wants `.github/copilot-instructions.md` + `.github/skills/` + `.github/agents/`
- Codex wants `AGENTS.md`
- Gemini wants `GEMINI.md`

Maintaining these per-repo, per-tool is unsustainable. Changes made during development don't flow back. Global process knowledge gets duplicated. Repo-specific knowledge has no structured home.

## The Solution

```
Author → Compile → Deploy → Work → Harvest
   ↑                                    │
   └────────────────────────────────────┘
```

## Install

```bash
npm install -g loom-cli
```

Or from source:

```bash
git clone https://github.com/TechnicallyShaun/loom.git
cd loom
npm install && npm run build && npm link
```

## Quick Start

```bash
# 1. Initialise (creates ~/.loom/ with git tracking)
loom init

# 2. Register a project
loom register myproject /path/to/project

# 3. Add some content
# Global instructions (apply to all projects):
echo "# Team Conventions\n\nUse conventional commits." > ~/.loom/global/instructions/conventions.md

# Global skill:
mkdir -p ~/.loom/global/skills/analyse
echo "# Analyse\n\nAnalyse the ticket and create a plan." > ~/.loom/global/skills/analyse/SKILL.md

# 4. Compile (produces target-specific output)
loom compile

# 5. Deploy (copies to project location)
loom deploy

# 6. After working, harvest improvements back
loom harvest
```

## Commands

| Command | Description |
|---------|-------------|
| `loom init` | Create `~/.loom/` with folder structure and git repo |
| `loom register <name> <path>` | Register a project for compilation |
| `loom compile [project]` | Compile source to target-specific output |
| `loom deploy [project]` | Copy compiled output to project paths |
| `loom harvest [project]` | Scan for changes and merge back to source |
| `loom diff [project]` | Preview what deploy would change |
| `loom discover` | Show registered projects and status |

All multi-project commands accept an optional project name. Without it, they run against all registered projects.

## Source Structure

```
~/.loom/
├── config.yaml              # Registered projects (gitignored)
├── global/
│   ├── instructions/        # Always-loaded context (→ CLAUDE.md, copilot-instructions.md, etc.)
│   ├── skills/              # On-demand capabilities (→ .claude/skills/, .github/skills/)
│   ├── agents/              # Orchestrators (→ .claude/agents/, .github/agents/)
│   └── tools/               # Reference docs (not compiled)
└── projects/
    └── <name>/
        ├── instructions/    # Project-specific context (merged with global)
        ├── skills/          # Project skills (override global if same name)
        ├── agents/          # Project agents (override global if same name)
        └── tools/           # Project-specific reference docs
```

## Three Types of Content

| Type | What it is | How it's compiled |
|------|-----------|-------------------|
| **Instructions** | Always-loaded context | Concatenated: global first, then project |
| **Skills** | On-demand workflows | Project overrides global (same name = project wins) |
| **Agents** | Workflow orchestrators | Project overrides global (same name = project wins) |
| **Tools** | Reference docs for scripts/CLIs | Not compiled — referenced by skills |

## Compile Targets

| Source | Claude Code | Copilot | Codex | Gemini |
|--------|------------|---------|-------|--------|
| `instructions/*.md` | `CLAUDE.md` | `.github/copilot-instructions.md` | `AGENTS.md` | `GEMINI.md` |
| `skills/foo/SKILL.md` | `.claude/skills/foo/SKILL.md` | `.github/skills/foo/SKILL.md` | — | — |
| `agents/work.md` | `.claude/agents/work.md` | `.github/agents/work.agent.md` | — | — |

## Git Tracking

Every `loom init` creates a git repo. Every compile, deploy, and harvest creates a commit:

```
git log --oneline
a1b2c3d harvest: myproject +3 changes
e4f5g6h deploy: myproject @h7i8j9k
h7i8j9k compile: myproject
f3g4h5i loom init
```

Rollback is always possible: `git revert <hash>`.

## Harvest

After working in a project (especially in git worktrees), `loom harvest` finds changes made to deployed files and merges them back to the Loom source.

It scans:
- The registered project path
- Any `<project>.worktrees/*/` sibling directories

Changes are presented as diffs for approval before merging.

## Development

```bash
npm install
npm run build        # TypeScript → dist/
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run lint         # ESLint
npm run format       # Prettier
npm run test:coverage # Coverage report
```

## License

MIT
