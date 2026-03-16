# Loom v2 — Architecture Design

> Captured from design session 2026-03-16 (Shaun + Dai).
> This replaces the vision/ docs as the canonical architecture reference.

## Problem Statement

AI coding tools (Claude Code, Copilot, Codex, Gemini) each have their own format for instructions, skills, and agents. Maintaining these per-repo, per-tool is unsustainable — especially when:

- Instruction files aren't git-tracked (they contain local paths, personal preferences)
- Improvements made during development (in worktrees) don't flow back to the source
- Global process skills (cleansing, analyse, commit) are duplicated across repos
- Repo-specific knowledge (setup scripts, DTO workflows) has no structured home
- The AI doesn't know which tools to run and when — that binding is tribal knowledge

Loom is a **write-once, compile-many** system: author skills in a single source format, compile to each AI's native format, deploy to project locations, and harvest improvements back.

## Core Concepts

### The Pipeline

```
Author → Compile → Deploy → Work → Harvest
   ↑                                    │
   └────────────────────────────────────┘
```

Every step is git-committed in the Loom repo for auditability and rollback.

### Three Types of Content

| Type | What it is | Example |
|------|-----------|---------|
| **Instructions** | Always-loaded context — the AI reads these on every interaction | Team conventions, architecture overview, project-specific quirks |
| **Skills** | On-demand capabilities — loaded when relevant | Cleansing, analyse, setup-env, dto-changes |
| **Agents** | Orchestrators — preloaded system prompts that direct a workflow and reference skills | `/work` (read plan → setup → implement → commit loop) |

### Two Layers

| Layer | Scope | Example |
|-------|-------|---------|
| **Global** | Applies to all projects | Commit conventions, cleansing process, ticket-fetching |
| **Project** | Applies to one repo | Platinum's IIS setup, iFreedom's build process |

**Project overrides global.** If both layers define `setup-env`, the project version wins for that project. Instructions concatenate (global + project merged into one file).

### Skills vs Tools

- **Skills** = process knowledge (when + why + what order). The AI *follows* these.
- **Tools** = executable operations (ps1 scripts, CLI commands). The AI *uses* these.
- **Skills reference tools**, not the other way around.

A tool doc says: "here's what `reset-database.ps1` does, its options, and its pwd requirement."
A skill says: "when setting up Platinum's dev env, run `reset-database.ps1` with seed data first."

## Source Structure

```
~/.loom/                                    ← Loom home (its own git repo)
│
├── config.yaml                             ← registered projects, settings
│
├── global/
│   ├── instructions/
│   │   ├── conventions.md                  ← commit rules, branch naming, team standards
│   │   └── architecture.md                 ← cross-project data flows, layer overview
│   │
│   ├── agents/
│   │   └── work.md                         ← orchestrator: plan → worktree → implement → commit
│   │
│   ├── skills/
│   │   ├── cleansing/SKILL.md              ← sprint cleansing prep
│   │   ├── analyse/SKILL.md                ← deep analysis and planning
│   │   ├── worktree-setup/SKILL.md         ← create worktree, copy instruction files
│   │   ├── committing/SKILL.md             ← commit message format, frequency rules
│   │   ├── review/SKILL.md                 ← PR description, BA summary generation
│   │   └── testing/SKILL.md                ← test loop, naming, patterns
│   │
│   └── tools/
│       ├── reset-database.md               ← options: blank | seed, pwd requirement
│       └── docker-setup.md                 ← branch options, container profiles
│
├── projects/
│   ├── platinum/
│   │   ├── instructions/
│   │   │   └── platinum-specifics.md       ← IIS, MST4Build, layer quirks
│   │   ├── agents/
│   │   │   └── work.md                     ← (optional) Platinum-specific work flow override
│   │   ├── skills/
│   │   │   ├── setup-env/SKILL.md          ← recipe: DB(seed) → Docker(default) → IIS → MST4Build
│   │   │   └── dto-changes/SKILL.md        ← Platinum mapping + RunMST4Build.ps1
│   │   └── tools/
│   │       └── setup-iis.md                ← Platinum-only, requires admin
│   │
│   └── ifreedom/
│       ├── instructions/
│       │   └── ifreedom-specifics.md        ← microservice context, shared DB/containers
│       └── skills/
│           └── setup-env/SKILL.md           ← recipe: DB(seed) → Docker(custom set) → build
│
└── .git/                                    ← everything is version-controlled
```

## Commands

### `loom init`

Initialises a Loom workspace at the current directory. Creates the folder structure above, runs `git init`, creates initial commit.

### `loom register <name> <path>`

Registers a project. Adds entry to `config.yaml`:

```yaml
projects:
  platinum:
    path: D:\git\platinum
    targets: [claude, copilot]
  ifreedom:
    path: D:\git\ifreedom
    targets: [claude, copilot]
```

Also scaffolds `projects/<name>/` with empty `instructions/`, `skills/`, `agents/`, `tools/` folders.

### `loom compile [project]`

Reads source files, merges global + project layers, produces target-specific output. **Commits the result to the Loom git repo.**

Without a project arg, compiles all registered projects.

#### Compile Targets

| Source | Claude Code | Copilot | Codex | Gemini |
|--------|------------|---------|-------|--------|
| `instructions/*.md` | `CLAUDE.md` (concatenated) | `.github/copilot-instructions.md` | `AGENTS.md` | `GEMINI.md` |
| `skills/foo/SKILL.md` | `.claude/skills/foo/SKILL.md` | `.github/copilot/skills/foo/SKILL.md` | — | — |
| `agents/work.md` | `.claude/skills/work/SKILL.md` (with `agent: true` frontmatter) | `.github/copilot/agents/work.md` | — | — |

**Merge rules:**
- Instructions: global files first, then project files, concatenated into one output file per target
- Skills: project overrides global (same name = project wins)
- Agents: project overrides global (same name = project wins)
- Tools: referenced by skills, not compiled into output directly

**Git:** Each compile creates a commit: `compile: <project> (<timestamp>)`

### `loom deploy [project]`

Copies compiled output to the registered project path. Creates a commit/tag in the Loom repo recording what was deployed and where.

```
compile output → D:\git\platinum\CLAUDE.md
              → D:\git\platinum\.claude\skills\*
              → D:\git\platinum\.github\copilot-instructions.md
              → D:\git\platinum\.github\copilot\agents\*
              → D:\git\platinum\.github\copilot\skills\*
```

**Git:** Creates commit: `deploy: <project> @<compile-hash> (<timestamp>)`

### `loom harvest [project]`

Scans deployed locations (including worktrees) for changes made since the last deploy.

**Discovery:**
1. Reads registered project path from config
2. Finds `<project>.worktrees/*/` sibling folders
3. Scans for instruction files, skills, agents in each location
4. Diffs against the Loom source (not against main checkout — that's just a stale deploy target)

**Default mode (mechanical diff):**
```
$ loom harvest platinum

platinum.worktrees/GOS-123456/CLAUDE.md — 3 new lines:
  + "Always check EF migrations after switching branches"
  + "PropertyFacade requires both Amount and TaxCode"
  + "Run tests from the Facade.Tests project, not root"

platinum.worktrees/GOS-789012/CLAUDE.md — unchanged
platinum/CLAUDE.md — unchanged (stale deploy, no direct edits)

Accept changes? [y/n/interactive]
```

Approved changes are merged back into `~/.loom/projects/platinum/` (or `~/.loom/global/` if flagged as global).

**AI-assisted mode (`loom harvest --extract`):**
Spawns an agent that categorises each diff:
- **Global learning** → merge into `global/instructions/` or relevant global skill
- **Project learning** → merge into `projects/<name>/`
- **Noise** (temporary hack, one-off workaround) → discard

**Git:** Creates commit: `harvest: <project> +<N> changes (<timestamp>)`

### `loom diff [project]`

Preview what `deploy` would change without writing anything. Shows the diff between compiled output and what's currently at the deploy target.

### `loom discover`

Scans for registered projects, shows status of each: last compile, last deploy, pending harvests.

## Git Strategy

The Loom folder is its own git repo. Every significant action commits:

```
git log --oneline
a1b2c3d harvest: platinum +3 changes (2026-03-16 16:00)
e4f5g6h deploy: platinum @h7i8j9k (2026-03-16 14:30)
h7i8j9k compile: platinum (2026-03-16 14:30)
b0c1d2e compile: platinum, ifreedom (2026-03-16 10:15)
f3g4h5i loom init (2026-03-16 09:00)
```

Benefits:
- **Rollback:** Bad harvest? `git revert`. Bad compile? `git revert`.
- **Audit trail:** When was this skill last changed? `git log -- global/skills/cleansing/`
- **AI-friendly:** An agent can read the git graph to understand evolution
- **Local only:** No remote required. Push if you want backup, but it's optional.

## Relationship to SDP

Loom replaces SDP. The migration path:

1. `loom init` in a new location
2. Copy SDP source skills (`src/skills/*.md`) → `~/.loom/global/skills/`
3. Copy SDP agents (`src/agents/*.md`) → `~/.loom/global/agents/`
4. Extract conventions from SDP's compiled instruction files → `~/.loom/global/instructions/`
5. Register projects: `loom register platinum D:\git\platinum`
6. Add project-specific skills that were previously tribal knowledge
7. `loom compile && loom deploy`
8. Retire SDP

## Design Principles

1. **Source is king.** The Loom source folder is the single source of truth. Everything else is derived.
2. **Compile is deterministic.** Same source → same output, every time. No AI in the compile step.
3. **Deploy is dumb copy.** No transformation at deploy time. Compile already did the work.
4. **Harvest is where AI helps.** Categorising and merging changes back is the hard part — that's where intelligence adds value.
5. **Git everything.** Every action is a commit. Rollback is always possible.
6. **Skills bind tools to process.** A skill says "when doing X, run tool Y." The tool docs describe Y. The skill is the glue.
7. **Two layers, no more.** Global + project. No nesting beyond that. Three layers of indirection is where comprehension breaks down.

## Future Considerations

- **Watch mode:** Auto-compile on source file changes
- **Remote sync:** Push Loom repo to a remote for backup/sharing
- **Team mode:** Multiple developers sharing a Loom repo (global skills shared, project skills may vary)
- **Pre-cleansing automation:** Scheduled ticket scanning that produces cleansing prep ahead of ceremonies
- **Playwright feedback loops:** Skills for browser-based testing with CDP endpoint
