# Skill Chaining

## Problem

Skills often reference other skills — a developer agent calls `/code-monkey`, which calls `/commit`. Each AI target handles this differently.

## Per-Target Support

### Claude Code

Full native support. Skills and agents invoke other skills with `/skill-name`:

```markdown
1. Run /analyse to understand the ticket
2. Run /code-monkey to implement
3. Run /commit to save
```

Claude resolves `/skill-name` at runtime, loads the skill, and executes it. Agents can declare upfront which skills they use via the `skills:` frontmatter field.

### Copilot CLI

**No skill chaining.** Skills cannot invoke other skills. Copilot's model is:

- **Auto-discovery** — skills are loaded by relevance based on their `description` field
- **Conversation flow** — the user chains prompts manually, not skills programmatically
- **Stateless** — each skill is a standalone context module

A `/skill-name` reference in a Copilot skill is meaningless — it won't trigger anything.

### Codex CLI / Gemini CLI

No skill support at all. Instructions only.

## Loom Strategy

### Source syntax

Use `/skill-name` in loom source. This is natural, readable, and matches Claude's native syntax:

```markdown
1. Run /analyse to understand the ticket
2. Run /code-monkey to implement
3. Run /commit to save
```

### Compilation per target

| Target | Strategy |
|---|---|
| Claude | Pass through — `/skill-name` works natively |
| Copilot | Rewrite to description-based hints so Copilot's auto-discovery can find the right skill |
| Codex/Gemini | Inline the referenced skill content (since these targets don't support skills at all) |

### Copilot rewriting

Replace `/skill-name` with a natural language reference that matches the skill's description. Loom knows all skill descriptions at compile time.

Source:
```markdown
Run /analyse to understand the ticket.
```

If the `analyse` skill has `description: "Analyse a ticket and create an implementation plan"`:

Copilot output:
```markdown
Analyse the ticket and create an implementation plan.
```

This leans on Copilot's auto-discovery — if the description-based text is close enough, Copilot will load the relevant skill automatically.

### Codex/Gemini inlining

For targets with no skill support, inline the referenced skill's content directly into the instructions. This produces a larger single document but preserves the full workflow.

## Agent `skills:` Field

Claude agents declare skills in frontmatter:

```yaml
---
skills:
  - analyse
  - code-monkey
  - commit
---
```

This tells Claude to pre-load these skills. For Copilot, this field is dropped (auto-discovery handles it). For Codex/Gemini, the skills are inlined into the instructions.

## Test This Assumption

Copilot may informally support `/skill-name` references even though it's not documented. If a skill says "Run /analyse", Copilot's auto-discovery might match that text to the `analyse` skill's description and load it anyway — the AI is smart enough to connect the dots. If this works reliably, loom can pass `/skill-name` through unchanged for Copilot (same as Claude) and skip the description-based rewriting entirely.

**To validate:** Deploy a multi-skill workflow to Copilot with explicit `/skill-name` references and test whether Copilot chains them. If it does, the rewriting strategy becomes a fallback for targets that genuinely can't handle it, not the default.

## Open Questions

- Should Copilot rewriting use the skill's description verbatim, or should loom allow a custom `copilot-hint` field for hand-tuned text?
- For Codex/Gemini inlining, should the inlined content be wrapped in a section heading derived from the skill name?
- Should loom warn if a skill references another skill that doesn't exist?
