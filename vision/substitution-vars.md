# Substitution Variables

## Problem

SKILL.md files need to reference paths — the script next to them, the project root, the loom workspace. Each AI target has different (or no) native path variables. Loom needs a neutral syntax that compiles to the best available option per target.

## Loom Variables

| Variable | Resolves to | Example |
|---|---|---|
| `{skill}` | The directory containing this SKILL.md | `D:\Git\project-a\.claude\skills\test\` |
| `{project}` | The registered project root | `D:\Git\project-a\` |
| `{loom}` | The directory where loom was initialised (parent of `.loom/`) | `D:\Git\` |

**`{loom}` is the workspace root, not the `.loom/` folder itself** — `.loom/` is an internal working directory, not a location skills should reference.

### Usage in SKILL.md

```markdown
Run `npx tsx {skill}/trac.ts GetTicket $ARGUMENTS`
Read `{skill}/pointing-guide.md` for estimation criteria.
Check `{project}/src/` for existing patterns.
See `{loom}/shared/conventions.md` for cross-project standards.
```

## Per-Target Compilation

### Claude Code

Claude has native `${CLAUDE_SKILL_DIR}` which matches `{skill}` exactly. No native equivalent for `{project}` or `{loom}`.

| Loom var | Compiled output | Strategy |
|---|---|---|
| `{skill}` | `${CLAUDE_SKILL_DIR}` | Native variable — dynamic, portable |
| `{project}` | Absolute path (e.g. `D:\Git\project-a`) | Resolved at compile time from config |
| `{loom}` | Absolute path (e.g. `D:\Git`) | Resolved at compile time from config |

```markdown
Run `npx tsx ${CLAUDE_SKILL_DIR}/trac.ts GetTicket $ARGUMENTS`
Check `D:\Git\project-a\src\` for existing patterns.
```

### Copilot CLI

Copilot has no native path variables. All three must be resolved to paths at compile time.

| Loom var | Compiled output | Strategy |
|---|---|---|
| `{skill}` | Relative path from project root (e.g. `.github/skills/test`) | Relative — works if AI runs from project root |
| `{project}` | `.` or omitted | Relative — project root is the working directory |
| `{loom}` | Absolute or relative path | Resolved at compile time from config |

```markdown
Run `npx tsx .github/skills/test/trac.ts GetTicket` with the ticket ID provided by the user.
Check `src/` for existing patterns.
```

For `{skill}`, use the relative compiled path (`.github/skills/<name>`) rather than an absolute path — Copilot always runs from the project root.

For `{project}`, compile to `.` or strip it entirely — references like `{project}/src/` become `src/`.

### Codex CLI

No native path variables. Same strategy as Copilot — resolve at compile time.

| Loom var | Compiled output | Strategy |
|---|---|---|
| `{skill}` | N/A — Codex doesn't support skills | Not applicable |
| `{project}` | `.` or omitted | Relative |
| `{loom}` | Absolute path | Resolved at compile time |

### Gemini CLI

No native path variables. Same strategy as Copilot.

| Loom var | Compiled output | Strategy |
|---|---|---|
| `{skill}` | N/A — Gemini doesn't support skills | Not applicable |
| `{project}` | `.` or omitted | Relative |
| `{loom}` | Absolute path | Resolved at compile time |

## Resolution Priority

For each variable, use this priority:

1. **Native variable** — if the target has one (Claude's `${CLAUDE_SKILL_DIR}`), use it. Dynamic and portable.
2. **Relative path** — if the working directory is predictable (project root), use a relative path. Portable across machines.
3. **Absolute path** — last resort. Resolved at compile time from loom config. Works but breaks if the project moves.

## Edge Cases

### Global skills (`_global`)

Global skills are deployed to user-level directories (`~/.claude/skills/`, `~/.copilot/skills/`). There is no project context.

| Loom var | Behaviour |
|---|---|
| `{skill}` | Resolves to the user-level skill path (e.g. `~/.claude/skills/test/`) |
| `{project}` | **Compile error** — global skills have no project. Warn and leave unresolved. |
| `{loom}` | Resolves to loom workspace root as normal |

### Nested or escaped braces

Loom should only replace `{skill}`, `{project}`, `{loom}` — exact matches, case-sensitive. `{other}` passes through unchanged. `{{skill}}` (double-braced) could be an escape syntax if needed, but defer until a real use case arises.

## Implementation

1. After frontmatter translation, run a string replacement pass over the SKILL.md body
2. Replace `{skill}`, `{project}`, `{loom}` using the target-specific strategy above
3. Values come from: the compiled skill path (for `{skill}`), `config.yaml` project entry (for `{project}`), and loom root (for `{loom}`)
4. Log a warning if `{project}` appears in a global skill

## Open Questions

- Should instructions (not just skills) support substitution? e.g. `{project}` in a CLAUDE.md instruction could be useful.
- Should `{args}` / `{arg0}` be part of this system too, or kept separate? Claude has `$ARGUMENTS`/`$0`, Copilot has nothing — see `vision/skill-assets.md`.
