# Rules Support

## Problem

Claude Code supports `.claude/rules/` — path-scoped instruction files that only load when the AI reads matching files. This is more efficient than putting everything in `CLAUDE.md`, which loads unconditionally and consumes context every session.

Currently, Loom compiles all instructions into a single file per target (`CLAUDE.md`, `copilot-instructions.md`, etc.). There's no way to produce path-scoped rules that load conditionally.

## Proposal

Add a fourth content type — **rules** — alongside instructions, skills, and agents.

### Source format

Rules live in `rules/` directories at both global and project layers:

```
.loom/
├── global/
│   ├── instructions/
│   ├── skills/
│   ├── agents/
│   └── rules/              ← new
│       ├── code-style.md
│       └── testing.md
└── projects/
    └── myproject/
        ├── instructions/
        ├── skills/
        ├── agents/
        └── rules/          ← new
            └── api-design.md
```

Each rule is a markdown file with optional YAML frontmatter for path scoping:

```markdown
---
description: API design conventions for TypeScript endpoints
paths:
  - "src/api/**/*.ts"
---

# API Design

- Validate all inputs with zod schemas
- Use the standard error response format
- Include OpenAPI documentation comments
```

Rules without `paths` frontmatter are unconditional (always loaded).

### Merge rule

**Project overrides global by filename.** Same as skills and agents — if both layers define `testing.md`, the project version wins.

### Compile targets

| Target | Output path (project) | Output path (user-level) |
|--------|----------------------|--------------------------|
| Claude | `.claude/rules/<name>.md` | `rules/<name>.md` (in `~/.claude/`) |
| Copilot | Not supported (Copilot has no equivalent of path-scoped rules) |
| Codex | Not supported |
| Gemini | Not supported |

Copilot supports `.github/instructions/*.instructions.md` with `applyTo` globs, which is similar but uses a different format. This could be added later as a separate compile step if needed.

### Changes required

#### Types

Add `rules` to `SourceContent` handling. No new type needed — rules are `SourceContent[]` like agents.

#### Source reading

- Add `readRulesDir(dir)` to `sources.ts` — reads `*.md` files from a flat directory (same as `readMarkdownDir` but preserves frontmatter)
- Add `rules/` to the `SUBDIRS` list in init and register

#### Merge

- Add rules to `MergedProject`: `rules: SourceContent[]`
- Merge with `mergeLayers` (project overrides global by name)

#### Compilers

- Claude: output rules to `.claude/rules/<name>.md`, preserving frontmatter
- Copilot: skip (or later: convert `paths` to `applyTo` and output to `.github/instructions/<name>.instructions.md`)
- Codex/Gemini: skip

#### User-level compilation

- Claude: output to `rules/<name>.md` (deployed to `~/.claude/rules/`)
- User-level rules would typically not have `paths` frontmatter (they're global conventions, not path-scoped)

#### Commands

- `compile`: read rules from both layers, merge, compile per target
- `deploy`: no changes needed (already copies all files from dist)
- `harvest`: add rules file detection (`.claude/rules/*.md`)
- `init`: add `global/rules/` to subdirs
- `register`: add `projects/<name>/rules/` to subdirs

#### Config

No config changes needed — rules are always compiled for targets that support them.

### What this unlocks

1. **Granular context loading** — path-scoped rules only load when relevant, reducing context consumption
2. **Organised instructions** — instead of one huge CLAUDE.md, split instructions by topic
3. **Mixed approach** — use instructions for always-loaded context, rules for conditional context
4. **User-level rules** — global rules deployed to `~/.claude/rules/` apply across all projects on the machine

### Example workflow

```bash
# Add a global rule for all TypeScript files
cat > .loom/global/rules/typescript.md << 'EOF'
---
description: TypeScript conventions
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript

- Use strict mode
- Prefer explicit return types
- Avoid `any`
EOF

# Add a project-specific rule
cat > .loom/projects/myproject/rules/api-design.md << 'EOF'
---
description: API design conventions
paths:
  - "src/api/**/*.ts"
---

# API Design

- Validate inputs with zod
- Use standard error format
EOF

# Compile and deploy
loom compile
loom deploy

# Result in project:
# .claude/rules/typescript.md    (from global)
# .claude/rules/api-design.md   (from project)
```
