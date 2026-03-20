# Command Reference

All commands that accept `[project]` run against all registered projects when no project name is given. Pass `_global` to target only user-level compilation.

---

## `loom init`

Initialise a new Loom workspace in the current directory.

```bash
loom init
```

Creates the folder structure, `config.yaml`, and a git repo inside `.loom/`:

```
.loom/
├── config.yaml
├── global/
│   ├── instructions/
│   ├── skills/
│   └── agents/
└── projects/
```

Each step is individually idempotent — running `loom init` again only creates what's missing.

Everything is tracked in the `.loom/` git repo, including `config.yaml`.

**Environment variable:** Set `LOOM_DIR` to override the default `cwd/.loom` location.

---

## `loom register <name> <path>`

Register a project for compilation and deployment.

```bash
loom register myproject /path/to/project
```

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Short name for the project (e.g. `anvil`, `api`). `_global` is reserved. |
| `path` | Yes | Path to the project directory (must exist) |

What it does:

1. Adds the project to `config.yaml`
2. Creates `projects/<name>/instructions/`, `projects/<name>/skills/`, `projects/<name>/agents/`
3. Commits: `register: <name>`

```bash
# Examples
loom register anvil D:\git\myproject
loom register api ~/code/api-service
```

---

## `loom compile [project]`

Merge global and project source layers, then compile to target-specific output.

```bash
loom compile            # Compile all projects + _global
loom compile myproject  # Compile one project only
loom compile _global    # Compile only user-level output
```

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Compile only this project (or `_global` for user-level only) |

The compile step:

1. Reads global source from `global/{instructions,skills,agents}/`
2. Reads project source from `projects/<name>/{instructions,skills,agents}/`
3. Merges the two layers (see [Content Guide](content-guide.md) for merge rules)
4. Generates target-specific files for each enabled target
5. Writes output to `dist/<project>/`
6. Commits: `compile: <project> (<timestamp>)`

**Per-project output:**

| Target | Instructions | Skills | Agents |
|--------|-------------|--------|--------|
| Claude | `CLAUDE.md` | `.claude/skills/<name>/SKILL.md` | `.claude/agents/<name>.md` |
| Copilot | `.github/copilot-instructions.md` | `.github/skills/<name>/SKILL.md` | `.github/agents/<name>.agent.md` |
| Codex | `AGENTS.md` | — | — |
| Gemini | `GEMINI.md` | — | — |

**Global (user-level) output** — compiled to `dist/_global/<target>/` with paths remapped for user-level directories:

| Target | Instructions | Skills | Agents |
|--------|-------------|--------|--------|
| Claude | `CLAUDE.md` | `skills/<name>/SKILL.md` | `agents/<name>.md` |
| Copilot | `copilot-instructions.md` | `skills/<name>/SKILL.md` | `agents/<name>.agent.md` |

Global compilation uses only global content (no project merge). Only Claude and Copilot have user-level equivalents.

---

## `loom deploy [project]`

Copy compiled output to the registered project paths.

```bash
loom deploy            # Deploy all projects + _global
loom deploy myproject  # Deploy one project only
loom deploy _global    # Deploy only to user-level directories
```

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Deploy only this project (or `_global` for user-level only) |

What it does:

1. Copies files from `dist/<project>/` to the registered project path
2. Copies files from `dist/_global/claude/` to `~/.claude/`
3. Copies files from `dist/_global/copilot/` to `~/.copilot/`
4. Creates directories as needed
5. Logs the deploy to `.deploy-log`
6. Commits: `deploy: <project> @<hash> (<timestamp>)`
7. Creates a git tag: `deploy/<project>/<timestamp>`

After deploying, the project directory will contain the target-specific files:

```
/path/to/project/
├── CLAUDE.md
├── AGENTS.md
├── GEMINI.md
├── .claude/
│   ├── skills/analyse/SKILL.md
│   └── agents/work.md
└── .github/
    ├── copilot-instructions.md
    ├── skills/analyse/SKILL.md
    └── agents/work.agent.md
```

And user-level directories will contain:

```
~/.claude/
├── CLAUDE.md
├── skills/analyse/SKILL.md
└── agents/work.md

~/.copilot/
├── copilot-instructions.md
├── skills/analyse/SKILL.md
└── agents/work.agent.md
```

The project must be compiled first — deploy skips projects with no compiled output.

---

## `loom harvest [project] [--yes]`

Scan deployed locations for changes and merge them back to source.

```bash
loom harvest              # Harvest all projects (interactive)
loom harvest myproject    # Harvest one project
loom harvest --yes        # Auto-accept all changes
loom harvest myproject --yes
```

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Harvest only this project |

| Flag | Description |
|------|-------------|
| `--yes` | Accept all changes without prompting |

What it does:

1. Scans the registered project path and any worktree siblings (`<project>.worktrees/*/`)
2. Diffs deployed instruction, skill, and agent files against compiled output
3. Shows detected additions for review
4. On approval, merges changes back to the Loom source:
   - Instruction changes go to `projects/<name>/instructions/harvested.md`
   - Skill changes go to `projects/<name>/skills/<skill>/SKILL.md`
   - Agent changes go to `projects/<name>/agents/<agent>.md`
5. Commits: `harvest: <project> +N changes (<timestamp>)`

**Worktree scanning** — if your project is at `/code/myproject`, Loom also scans `/code/myproject.worktrees/*/`:

```
/code/
├── myproject/                  ← scanned
└── myproject.worktrees/
    ├── feature-branch-1/       ← scanned
    └── feature-branch-2/       ← scanned
```

**Example output:**

```
myproject: found 2 changed file(s):

  /code/myproject.worktrees/feature-branch-1/CLAUDE.md:
    + Always run migrations after switching branches
    + Use PropertyFacade for all tax calculations

Accept changes? [y/n]
```

---

## `loom diff [project]`

Preview what `deploy` would change without writing anything.

```bash
loom diff              # Diff all projects + _global
loom diff myproject    # Diff one project
loom diff _global      # Diff only user-level directories
```

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Diff only this project (or `_global` for user-level only) |

Shows new files (`+`) and modified files (`~`):

```
myproject:
  + .claude/skills/setup-env/SKILL.md (new)
  ~ CLAUDE.md (modified)
  (2 file(s) would change)

_global/claude:
  + CLAUDE.md (new)
  + skills/analyse/SKILL.md (new)
  2 file(s) would change
```

Run after `compile` and before `deploy` to review changes before they land.

---

## `loom discover`

Show registered projects and their current status.

```bash
loom discover
```

Displays the Loom home directory, configured targets, and for each project: its path, whether it's been compiled, and the last compile/deploy commits.

```
Loom home: .loom

2 project(s) registered:

  myproject
    Path:     /code/myproject
    Compiled: yes
    Last compile: f3ccc6e compile: myproject (2026-03-16 22:30)
    Last deploy:  b6bccee deploy: myproject @f3ccc6e (2026-03-16 22:35)

  api
    Path:     /code/api-service
    Compiled: no
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOM_DIR` | `cwd/.loom` | Override the Loom workspace location |

---

## Typical Workflow

```bash
# One-time setup
loom init
loom register myproject /code/myproject

# Author content in .loom/ (instructions, skills, agents)

# Build and deploy
loom compile
loom diff          # Review changes
loom deploy

# Work on a ticket... AI learns things, edits CLAUDE.md...

# Pull learnings back
loom harvest

# Check status
loom discover

# Rollback a bad deploy
git -C .loom log --oneline     # Find the commit
git -C .loom revert <hash>     # Undo it
loom deploy                     # Redeploy clean version
```
