# Loom

Weave AI skills once, compile to every coding agent.

Loom manages your AI coding skills from a single source and compiles them into the native format for each tool: Claude Code, GitHub Copilot, Codex, and Gemini. Write once, deploy everywhere, harvest improvements back.

## Installation

- Requires Node.js 18+
- `npm install -g loom-cli`
- Or run without installing: `npx loom-cli`

## Getting Started

```bash
# 1. Initialise a loom workspace
loom init

# 2. Register a project
loom register anvil ~/repos/anvil --targets claude,copilot

# 3. Add global content
#    ~/.loom/global/instructions/conventions.md
#    ~/.loom/global/skills/analyse/SKILL.md
#    ~/.loom/global/agents/work.md

# 4. Add project-specific content
#    ~/.loom/projects/anvil/instructions/anvil-setup.md
#    ~/.loom/projects/anvil/skills/setup-env/SKILL.md

# 5. Compile to target formats
loom compile anvil

# 6. Deploy to project
loom deploy anvil

# 7. Preview changes without deploying
loom diff anvil

# 8. Harvest improvements from worktrees
loom harvest anvil

# 9. See all projects
loom discover
```

## Architecture

```
~/.loom/                          ← loom home (its own git repo)
├── config.yaml                   ← registered projects (gitignored)
├── global/
│   ├── instructions/*.md         ← always-loaded context for every project
│   ├── skills/*/SKILL.md         ← on-demand capabilities
│   ├── agents/*.md               ← orchestrator prompts
│   └── tools/*.md                ← reference docs (not compiled)
├── projects/
│   └── <name>/
│       ├── instructions/*.md     ← project-specific context
│       ├── skills/*/SKILL.md     ← project-specific skills
│       ├── agents/*.md           ← project-specific agent overrides
│       └── tools/*.md            ← project-specific tool docs
└── .compiled/                    ← compiled output (gitignored)
```

### The Pipeline

```
Author → Compile → Deploy → Work → Harvest
  ↑                                    │
  └────────────────────────────────────┘
```

### Content Types

| Type | Purpose | Example |
|------|---------|---------|
| **Instructions** | Always-loaded context | Conventions, architecture overview |
| **Skills** | On-demand capabilities | Cleansing, analyse, setup-env |
| **Agents** | Orchestrator prompts | `/work` (plan → setup → implement → commit) |
| **Tools** | Reference docs (not compiled) | Script docs, CLI references |

### Merge Rules

- **Instructions**: Global + project concatenated (global first)
- **Skills**: Project overrides global (same name = project wins)
- **Agents**: Project overrides global (same name = project wins)

### Compile Targets

| Source | Claude Code | Copilot | Codex | Gemini |
|--------|------------|---------|-------|--------|
| Instructions | `CLAUDE.md` | `.github/copilot-instructions.md` | `AGENTS.md` | `GEMINI.md` |
| Skills | `.claude/skills/<name>/SKILL.md` | `.github/copilot/skills/<name>/SKILL.md` | — | — |
| Agents | `.claude/skills/<name>/SKILL.md` (agent:true) | `.github/copilot/agents/<name>.md` | — | — |

## Commands

| Command | Description |
|---------|-------------|
| `loom init` | Create loom workspace with directory structure |
| `loom register <name> <path>` | Register a project for compilation |
| `loom compile [project]` | Compile source to target-specific output |
| `loom deploy [project]` | Copy compiled output to project paths |
| `loom harvest [project]` | Scan worktrees for changes, merge back |
| `loom diff [project]` | Preview what deploy would change |
| `loom discover` | Show registered projects and status |

## Development

```bash
npm install
npm run build          # TypeScript compile
npm test               # Run tests
npm run test:coverage  # Tests with coverage
npm run lint           # ESLint
npm run format:check   # Prettier check
```

## Design Principles

1. **Source is king.** The loom source folder is the single source of truth.
2. **Compile is deterministic.** Same source → same output.
3. **Deploy is dumb copy.** No transformation at deploy time.
4. **Harvest is where AI helps.** Categorising changes is the hard part.
5. **Git everything.** Every action is a commit. Rollback is always possible.
6. **Two layers, no more.** Global + project. No deeper nesting.

## License

MIT
