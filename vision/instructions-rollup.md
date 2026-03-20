# Instructions Rollup

## Problem

Instructions are stored as separate markdown files in `instructions/`. During compilation they're concatenated (global first, then project, separated by `---`). This produces invalid markdown — multiple H1 headings, broken document structure.

Example source:

```
instructions/
├── 01-conventions.md    →  # Conventions\n\nUse strict mode...
└── 02-testing.md        →  # Testing\n\nAll tests use vitest...
```

Current compiled output:

```markdown
# Conventions

Use strict mode...

---

# Testing

All tests use vitest...
```

Two H1s in one document. Most markdown renderers tolerate this but it's technically invalid and some AI targets may weight the first H1 as the document title.

## Solution

Demote headings during rollup. Each instruction file's headings are shifted down one level, and the file's name (or H1) becomes an H2 section.

Compiled output:

```markdown
# Instructions

## Conventions

Use strict mode...

---

## Testing

All tests use vitest...
```

### Rules

1. The compiled instructions file gets a single H1: `# Instructions` (or configurable per target)
2. Each source file's headings are demoted by one level (`#` → `##`, `##` → `###`, etc.)
3. If a source file starts with an H1, it becomes the section's H2 title
4. If a source file has no H1, derive the section title from the filename (e.g. `01-conventions.md` → `## Conventions`)
5. The `---` separator between files is preserved
6. Heading demotion applies only during rollup — individual instruction files remain valid standalone markdown

## Edge Cases

- Files with numeric prefixes (`01-`, `02-`) — strip the prefix when deriving a section title
- Files with only body content (no headings) — add a derived H2 title, leave body unchanged
- Deeply nested headings (`####`, `#####`) — demote anyway, even if it produces `######` (H6 is the markdown limit, but this is unlikely in practice)
- Single instruction file — still demote and wrap with H1 for consistency

## Open Questions

- Should the top-level H1 be configurable per project? e.g. `# Project Guidelines` instead of `# Instructions`
- Should loom preserve the original H1 as-is and only demote H2+ (treating each file's H1 as an intentional section title)?
