# Content Guide

Loom manages three types of content: **instructions**, **skills**, and **agents**. Each type can be authored at two layers: **global** (applies to all projects) and **project** (applies to one project).

---

## Global vs Project

Content lives in two layers inside `.loom/`:

```
.loom/
├── global/              ← applies to every registered project
│   ├── instructions/
│   ├── skills/
│   └── agents/
└── projects/
    └── myproject/       ← applies only to "myproject"
        ├── instructions/
        ├── skills/
        └── agents/
```

**Global** content is shared across all your projects — team conventions, common workflows, reusable agents. **Project** content is specific to one codebase — setup steps, architecture notes, project-specific workflows.

When you compile, the two layers are merged. The merge strategy depends on the content type (see each section below).

---

## Instructions

Instructions are always-loaded context — the AI reads them on every interaction. Use these for conventions, architecture overviews, project setup notes, and anything the AI should always know.

### File format

Plain markdown files. Any filename ending in `.md`.

### Where to put them

| Scope | Path | Use for |
|-------|------|---------|
| Global | `.loom/global/instructions/<name>.md` | Team conventions, coding standards, shared knowledge |
| Project | `.loom/projects/<name>/instructions/<name>.md` | Project architecture, setup quirks, repo-specific context |

### Merge rule

**Concatenated.** Global instructions come first, then project instructions, separated by `---`. All instruction files within a layer are combined into a single output file per target.

### Example

Create a global instruction for team conventions:

```bash
# .loom/global/instructions/conventions.md
```

```markdown
# Conventions

- Use conventional commits (feat:, fix:, chore:)
- Branch names: feature/<ticket-id>-<short-description>
- All PRs require at least one approval
- Write tests for new features
```

Create a project-specific instruction:

```bash
# .loom/projects/myproject/instructions/architecture.md
```

```markdown
# MyProject Architecture

- .NET 8 Web API with Entity Framework Core
- PostgreSQL database, migrations managed via EF
- Always run `dotnet ef database update` after switching branches
- The Facade layer handles all business logic — never put logic in controllers
```

After `loom compile`, the Claude target produces a single `CLAUDE.md` containing both files concatenated (conventions first, then architecture, separated by `---`).

---

## Skills

Skills are on-demand workflows — the AI loads them when relevant. Use these for repeatable processes: analysis steps, environment setup, testing procedures, code review checklists.

### File format

A folder containing a `SKILL.md` file. The folder name is the skill name. The file can optionally include YAML frontmatter with `name`, `description`, and `argument-hint`.

```
skills/
└── analyse/
    └── SKILL.md
```

### Where to put them

| Scope | Path | Use for |
|-------|------|---------|
| Global | `.loom/global/skills/<skill-name>/SKILL.md` | Workflows shared across projects |
| Project | `.loom/projects/<name>/skills/<skill-name>/SKILL.md` | Project-specific workflows |

### Merge rule

**Project overrides global by name.** If both global and project define a skill called `setup-env`, the project version wins for that project. Global skills with no project override are included as-is.

### Example

Create a global skill for analysing tickets:

```bash
mkdir -p .loom/global/skills/analyse
```

```markdown
# .loom/global/skills/analyse/SKILL.md

---
name: analyse
description: Analyse a ticket and create an implementation plan
---

# Analyse

When asked to analyse a ticket:

1. Read the ticket description and acceptance criteria
2. Identify the affected files and components
3. List any dependencies or risks
4. Write a step-by-step implementation plan
5. Estimate the scope (small / medium / large)

Output the plan as a markdown checklist.
```

Create a project-specific skill that overrides nothing (new skill, unique to this project):

```bash
mkdir -p .loom/projects/myproject/skills/setup-env
```

```markdown
# .loom/projects/myproject/skills/setup-env/SKILL.md

---
name: setup-env
description: Set up the local development environment for MyProject
---

# Setup Environment

To set up MyProject locally:

1. Run `dotnet restore` in the solution root
2. Run `docker compose up -d` to start PostgreSQL and Redis
3. Run `dotnet ef database update` to apply migrations
4. Run `dotnet build` to verify everything compiles
5. Run `dotnet test` to confirm the test suite passes

If the database is in a bad state, run `docker compose down -v` and start again from step 2.
```

After compiling, both skills are available. The `analyse` skill came from global, the `setup-env` skill came from the project.

If you later create `.loom/projects/myproject/skills/analyse/SKILL.md`, that project-level version would override the global `analyse` skill — but only for `myproject`. Other projects still get the global version.

---

## Agents

Agents are workflow orchestrators — they define a system prompt and direct the AI through a multi-step process, often referencing skills. Use these for complex workflows like "read a ticket, set up the environment, implement, test, and commit."

### File format

A single markdown file. The filename (without `.md`) is the agent name. Can include YAML frontmatter for target-specific configuration.

### Where to put them

| Scope | Path | Use for |
|-------|------|---------|
| Global | `.loom/global/agents/<name>.md` | Workflows shared across projects |
| Project | `.loom/projects/<name>/agents/<name>.md` | Project-specific orchestration |

### Merge rule

**Project overrides global by name.** Same as skills — if both layers define `work.md`, the project version wins for that project.

### Example

Create a global agent for a standard work loop:

```markdown
# .loom/global/agents/work.md

---
name: work
description: Standard implementation workflow
---

# Work

You are an implementation agent. Follow this process:

1. **Analyse** — Use the /analyse skill to understand the ticket
2. **Plan** — Break the work into small, testable increments
3. **Implement** — Write the code, following project conventions
4. **Test** — Run the test suite and fix any failures
5. **Commit** — Create a conventional commit with a clear message

After each step, verify the result before moving to the next. If anything is unclear, ask before proceeding.
```

Create a project-specific override that adds setup steps:

```markdown
# .loom/projects/myproject/agents/work.md

---
name: work
description: MyProject implementation workflow with environment setup
---

# Work

You are an implementation agent for MyProject. Follow this process:

1. **Setup** — Use the /setup-env skill to prepare the local environment
2. **Analyse** — Use the /analyse skill to understand the ticket
3. **Plan** — Break the work into small, testable increments
4. **Implement** — Write the code using the Facade pattern for all business logic
5. **Test** — Run `dotnet test` and fix any failures
6. **Commit** — Create a conventional commit with a clear message

After each step, verify the result before moving to the next. If anything is unclear, ask before proceeding.
```

For `myproject`, the project-level `work.md` replaces the global one entirely. Other projects still get the global version.

---

## Substitution Variables

Skills support substitution variables for paths and arguments. These compile to the correct syntax per target.

### Path variables

Use these to reference files relative to the skill, project, or workspace:

| Variable | Resolves to | Example |
|---|---|---|
| `{skill}` | The directory containing this SKILL.md | `.claude/skills/analyse/` |
| `{project}` | The registered project root | `D:\Git\project-a\` |
| `{loom}` | The workspace root (parent of `.loom/`) | `D:\Git\` |

```markdown
Run `npx tsx {skill}/trac.ts GetTicket`
Check `{project}/src/` for existing patterns.
See `{loom}/shared/conventions.md` for cross-project standards.
```

Each target gets the best available form:

| Variable | Claude | Copilot | Codex | Gemini |
|---|---|---|---|---|
| `{skill}` | `${CLAUDE_SKILL_DIR}` | `.github/skills/<name>` | `.codex/skills/<name>` | `.gemini/skills/<name>` |
| `{project}` | Absolute path | `.` | `.` | `.` |
| `{loom}` | Absolute path | Absolute path | Absolute path | Absolute path |

### Argument variables

Use `{args}` for a single freeform input, or `{arg:name}` for named arguments. Don't mix both — it's a compile error.

**`{args}`** — the entire argument string:

```markdown
Fetch ticket {args} from Trac.
```

| Target | Output |
|---|---|
| Claude | `$ARGUMENTS` |
| Copilot | `${input:input:Provide the input}` |
| Codex | `$ARGUMENTS` |
| Gemini | `$ARGUMENTS` |

**`{arg:name}`** — named arguments (mapped positionally by order of first appearance):

```markdown
Analyse {arg:ticket} using the {arg:strategy} strategy.
```

| Target | Output |
|---|---|
| Claude | `$0`, `$1` |
| Copilot | `${input:ticket:Enter ticket}`, `${input:strategy:Enter strategy}` |
| Codex | `$0`, `$1` |
| Gemini | `$1`, `$2` |

### Argument hints

The `argument-hint` frontmatter field is auto-derived from `{arg:*}` usage if not set explicitly. A skill using `{arg:ticket}` and `{arg:strategy}` gets:

```yaml
argument-hint: <ticket> <strategy>
```

If you set `argument-hint` explicitly in frontmatter, that takes precedence.

### Edge cases

- `{arg:name}` used multiple times — same positional index each time (Claude), same variable (Copilot).
- Hyphens in names — `{arg:ticket-id}` compiles to `${input:ticketId:Enter ticket-id}` for Copilot (camelCase the variable, keep the display text).
- `{project}` in a global skill — logs a warning, since global skills have no project context.

---

## Target support

Not all targets support all content types:

| Content type | Claude | Copilot | Codex | Gemini |
|-------------|--------|---------|-------|--------|
| Instructions | Yes | Yes | Yes | Yes |
| Skills | Yes | Yes | No | No |
| Agents | Yes | Yes | No | No |

If you only target Codex or Gemini, skills and agents won't be compiled — but they're still preserved in the Loom source for when you add Claude or Copilot as targets.

---

## Tips

- **Start with global instructions.** Add your team's conventions and coding standards as global instructions. Every project benefits immediately.
- **Add project instructions early.** Architecture notes, build quirks, and setup steps save the AI from guessing.
- **Keep skills focused.** One skill per workflow. A skill called `analyse-and-test-and-deploy` should probably be three skills.
- **Use agents to compose skills.** An agent references skills by name — it's the orchestration layer that ties individual workflows together.
- **Override selectively.** Only create a project-level skill or agent when the global version genuinely doesn't fit. Most skills work across projects without changes.
