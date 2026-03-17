# Loom CLI — Command Reference

Complete reference for all Loom commands, flags, and variations.

---

## `loom init`

Initialise a new Loom workspace.

**Usage:**
```bash
loom init
```

**What it does:**
1. Creates the folder structure at `~/.loom/` (or `$LOOM_DIR` if set):
   ```
   ~/.loom/
   ├── config.yaml          # Project registry (gitignored)
   ├── .gitignore            # Ignores config.yaml
   ├── global/
   │   ├── instructions/     # Always-loaded context
   │   ├── skills/           # On-demand capabilities
   │   ├── agents/           # Workflow orchestrators
   │   └── tools/            # Reference docs (not compiled)
   └── projects/
   ```
2. Runs `git init` to create a versioned workspace
3. Creates an initial commit: `loom init`

**Notes:**
- Idempotent — running twice won't reinitialise
- Empty directories get `.gitkeep` files so git tracks the structure
- `config.yaml` is gitignored because it contains real project paths

**Environment:**
- `LOOM_DIR` — Override the default `~/.loom/` location (useful for testing or multiple workspaces)

---

## `loom register <name> <path>`

Register a project for compilation and deployment.

**Usage:**
```bash
loom register <name> <path> [--targets <targets>]
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Codename for the project (e.g. `anvil`, `spark`) |
| `path` | Yes | Absolute or relative path to the project directory |

**Flags:**

| Flag | Default | Description |
|------|---------|-------------|
| `--targets <list>` | `claude,copilot` | Comma-separated list of compile targets |

**Valid targets:** `claude`, `copilot`, `codex`, `gemini`

**Examples:**
```bash
# Register with default targets (claude + copilot)
loom register anvil D:\git\myproject

# Register with specific targets
loom register spark /home/user/project --targets claude,copilot,codex

# Register for Gemini only
loom register tools ~/tools-repo --targets gemini
```

**What it does:**
1. Resolves the path to an absolute path
2. Adds the project to `config.yaml`
3. Scaffolds `projects/<name>/{instructions,skills,agents,tools}/` with `.gitkeep` files
4. Commits: `register: <name>`

**Notes:**
- The path must exist
- Loom must be initialised first (`loom init`)
- Re-registering updates the existing entry

---

## `loom compile [project]`

Compile source files into target-specific output.

**Usage:**
```bash
loom compile            # Compile all registered projects
loom compile anvil      # Compile a specific project
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Project name to compile. Omit to compile all. |

**What it does:**
1. Reads global source files from `global/{instructions,skills,agents}/`
2. Reads project source files from `projects/<name>/{instructions,skills,agents}/`
3. Merges the two layers:
   - **Instructions:** Concatenated (global first, then project, separated by `---`)
   - **Skills:** Project overrides global (same name = project wins)
   - **Agents:** Project overrides global (same name = project wins)
4. Runs each enabled compiler to produce native output files
5. Writes output to `.compiled/<project>/`
6. Commits: `compile: <project> (<timestamp>)`

**Compile targets:**

| Target | Instructions | Skills | Agents |
|--------|-------------|--------|--------|
| Claude | `CLAUDE.md` | `.claude/skills/<name>/SKILL.md` | `.claude/agents/<name>.md` |
| Copilot | `.github/copilot-instructions.md` | `.github/skills/<name>/SKILL.md` | `.github/agents/<name>.agent.md` |
| Codex | `AGENTS.md` | — | — |
| Gemini | `GEMINI.md` | — | — |

**Notes:**
- Previous compiled output is cleaned before writing (stale files removed)
- Compiled output is committed to the Loom git repo for auditability
- Tools are reference docs — they are NOT compiled into output

---

## `loom deploy [project]`

Copy compiled output to registered project locations.

**Usage:**
```bash
loom deploy             # Deploy all registered projects
loom deploy anvil       # Deploy a specific project
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Project name to deploy. Omit to deploy all. |

**What it does:**
1. Reads compiled output from `.compiled/<project>/`
2. Copies each file to the registered project path
3. Appends to `.deploy-log` with timestamp and hash
4. Commits: `deploy: <project> @<hash> (<timestamp>)`
5. Creates a git tag: `deploy/<project>/<timestamp>` (for easy rollback)

**Example:**
```bash
loom compile anvil && loom deploy anvil
```

After deploy, the project directory has:
```
D:\git\myproject\
├── CLAUDE.md
├── .claude/
│   ├── skills/analyse/SKILL.md
│   └── agents/work.md
├── .github/
│   ├── copilot-instructions.md
│   ├── skills/analyse/SKILL.md
│   └── agents/work.agent.md
├── AGENTS.md
└── GEMINI.md
```

**Notes:**
- Project must be compiled first
- Skips projects with no compiled output
- Does NOT remove stale files at the target (if you delete a skill from source, manually remove the old deployed file)

---

## `loom harvest [project]`

Scan for changes made to deployed files and merge them back to source.

**Usage:**
```bash
loom harvest            # Harvest all registered projects
loom harvest anvil      # Harvest a specific project
loom harvest --yes      # Auto-accept all changes (no prompt)
loom harvest anvil --yes
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Project name to harvest. Omit to harvest all. |

**Flags:**

| Flag | Description |
|------|-------------|
| `--yes` | Auto-accept all changes without prompting. Useful for scripting/CI. |

**What it does:**
1. For each project, finds all locations to scan:
   - The registered project path (main checkout)
   - Any `<project>.worktrees/*/` sibling directories
2. Diffs each location's instruction/skill/agent files against the compiled output
3. Displays additions found in each file
4. Prompts for approval (unless `--yes`)
5. Merges approved changes back to the Loom source:
   - Instruction files → `projects/<name>/instructions/harvested.md`
   - Skill files → `projects/<name>/skills/<skillname>/SKILL.md`
   - Agent files → `projects/<name>/agents/<agentname>.md`
6. Commits: `harvest: <project> +N changes (<timestamp>)`

**Worktree scanning:**

Loom automatically finds worktree siblings. If your project is at `D:\git\myproject`, it scans `D:\git\myproject.worktrees/*/` for any worktree directories.

```
D:\git\
├── myproject/                    ← main checkout (scanned)
└── myproject.worktrees/
    ├── GOS-123456/               ← worktree (scanned)
    └── GOS-789012/               ← worktree (scanned)
```

**Example output:**
```
anvil: found 2 changed file(s):

  D:\git\myproject.worktrees\GOS-123456/CLAUDE.md:
    + Always check EF migrations after switching branches
    + PropertyFacade requires both Amount and TaxCode

Accept changes? [y/n]
```

**Notes:**
- Diffs are line-level additions only (doesn't detect reordered or deleted lines)
- Only names projects with accepted changes in the commit message

---

## `loom diff [project]`

Preview what `deploy` would change without writing anything.

**Usage:**
```bash
loom diff               # Diff all registered projects
loom diff anvil         # Diff a specific project
```

**Arguments:**

| Argument | Required | Description |
|----------|----------|-------------|
| `project` | No | Project name to diff. Omit to diff all. |

**What it does:**
1. Compares compiled output against what's currently at the deploy target
2. Shows new files (`+`), modified files (`~`), and unchanged files

**Example output:**
```
anvil:
  + .claude/skills/setup-env/SKILL.md (new)
  ~ CLAUDE.md (modified)
  (2 file(s) would change)
```

**Notes:**
- Read-only — no files are written
- Run after `compile` and before `deploy` to review changes

---

## `loom discover`

Show registered projects and their status.

**Usage:**
```bash
loom discover
```

**What it does:**
1. Lists all registered projects from `config.yaml`
2. Shows each project's path, enabled targets, compiled status
3. Shows last compile and deploy from git log

**Example output:**
```
Loom home: /home/user/.loom

2 project(s) registered:

  anvil
    Path:    D:\git\myproject
    Targets: claude, copilot
    Compiled: yes
    Last compile: f3ccc6e compile: anvil (2026-03-16 22:30)
    Last deploy: b6bccee deploy: anvil @f3ccc6e (2026-03-16 22:35)

  spark
    Path:    D:\git\otherproject
    Targets: claude, copilot, codex
    Compiled: no
```

---

## Global Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOM_DIR` | `~/.loom` | Override the Loom workspace location |

---

## Source File Conventions

### Instructions
- Location: `global/instructions/*.md` or `projects/<name>/instructions/*.md`
- Format: Plain markdown files, any name
- Compiled: Concatenated into one file per target (global first, then project)

### Skills
- Location: `global/skills/<name>/SKILL.md` or `projects/<name>/skills/<name>/SKILL.md`
- Format: Markdown with optional YAML frontmatter (`name`, `description`, `argument-hint`)
- Compiled: One file per skill per target that supports skills

### Agents
- Location: `global/agents/<name>.md` or `projects/<name>/agents/<name>.md`
- Format: Markdown with optional YAML frontmatter (target-specific options)
- Compiled: One file per agent per target that supports agents

### Tools
- Location: `global/tools/*.md` or `projects/<name>/tools/*.md`
- Format: Plain markdown reference docs
- **Not compiled** — these are reference docs that skills point to. The actual scripts/executables live in your project repo.

---

## Typical Workflow

```bash
# One-time setup
loom init
loom register anvil D:\git\myproject
loom register spark D:\git\otherproject

# Author skills in ~/.loom/
# (edit global/instructions, global/skills, projects/anvil/skills, etc.)

# Build and deploy
loom compile
loom diff              # Review before deploying
loom deploy

# Work on a ticket using worktrees...
# AI learns things, modifies CLAUDE.md in the worktree...

# Pull learnings back
loom harvest           # Interactive review
loom harvest --yes     # Or auto-accept

# Check status
loom discover

# Rollback a bad deploy
git -C ~/.loom log --oneline    # Find the commit
git -C ~/.loom revert <hash>    # Undo it
loom deploy                      # Redeploy clean version
```
