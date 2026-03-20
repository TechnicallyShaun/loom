# Skill Assets & Path Translation

## Problem

Skills can contain supporting files (scripts, templates, assets, references) alongside SKILL.md. Currently loom only compiles SKILL.md and discards everything else. Additionally, SKILL.md may reference these files using relative paths or platform-specific variables — these references need translating per target.

## Scope

Two changes:

1. **Copy supporting files** during compile
2. **Translate path references** in SKILL.md content to target-native syntax

## 1. Copy Supporting Files

When compiling a skill, copy the entire skill folder — not just SKILL.md. Any subdirectory or file alongside SKILL.md is included in the compiled output.

The compiler copies everything in the skill folder — flat files, nested subdirectories, whatever structure the author uses. Only SKILL.md gets frontmatter/content translation; all other files are byte-copied. Neither Claude nor Copilot treat subdirectory names specially — they're just files the AI reads or executes based on what SKILL.md says.

Source (flat):
```
.loom/global/skills/cleanse/
├── SKILL.md
└── trac.ts
```

Source (nested):
```
.loom/global/skills/cleanse/
├── SKILL.md
├── scripts/
│   └── trac.ts
└── templates/
    └── ticket.md
```

Both compile identically — structure preserved, SKILL.md translated, everything else copied:

Compiled (Claude):
```
.claude/skills/cleanse/
├── SKILL.md          ← frontmatter + path references translated
├── scripts/
│   └── trac.ts       ← copied as-is
└── templates/
    └── ticket.md     ← copied as-is
```

Compiled (Copilot):
```
.github/skills/cleanse/
├── SKILL.md          ← frontmatter + path references translated
├── scripts/
│   └── trac.ts       ← copied as-is
└── templates/
    └── ticket.md     ← copied as-is
```

Path references in SKILL.md (e.g. `${SKILL_DIR}/scripts/trac.ts` or `${SKILL_DIR}/trac.ts`) are translated regardless of whether the referenced file is flat or nested.

Only SKILL.md gets frontmatter translation. All other files are byte-copied.

## 2. Translate Path References

SKILL.md content may reference files within the skill folder. Each target has different syntax for resolving these paths at runtime.

### Loom-neutral syntax

Use a loom placeholder in source SKILL.md:

```markdown
Run `npx tsx ${SKILL_DIR}/scripts/trac.ts GetTicket ${ARGS}`
```

### Per-target translation

| Placeholder | Claude | Copilot |
|---|---|---|
| `${SKILL_DIR}` | `${CLAUDE_SKILL_DIR}` | `.github/skills/<name>` (literal path) |
| `${ARGS}` | `$ARGUMENTS` | Dropped — instruct conversationally |
| `${ARG0}`, `${ARG1}` | `$0`, `$1` | Dropped |

### Claude output

```markdown
Run `npx tsx ${CLAUDE_SKILL_DIR}/scripts/trac.ts GetTicket $ARGUMENTS`
```

### Copilot output

```markdown
Run `npx tsx .github/skills/cleanse/scripts/trac.ts GetTicket` with the ticket ID provided by the user.
```

### Translation rules

- `${SKILL_DIR}` → target-native skill directory reference
- `${ARGS}` / `${ARG0}` etc → target-native argument substitution, or rewritten to natural language if the target has no equivalent
- Unknown `${...}` placeholders → passed through unchanged (forward-compatible)

## Open Questions

- Should `${ARGS}` on Copilot be rewritten automatically to natural language, or just stripped with a warning? Auto-rewriting is fragile; stripping with a comment may be safer.
- Should shared scripts (outside a skill folder) be supported? e.g. `.loom/global/scripts/` copied to `.claude/scripts/` — or is that out of scope for skills?
- Should loom validate that referenced paths (`${SKILL_DIR}/scripts/foo.ts`) actually exist at compile time?
