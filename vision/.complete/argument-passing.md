# Argument Passing

## Problem

Skills accept arguments — a ticket ID, a file path, a mode flag. Each AI target has different syntax for passing and accessing arguments. Loom needs a neutral syntax that compiles correctly per target.

## Per-Target Syntax

### Claude Code

Positional arguments with `$ARGUMENTS` (all args) and `$0`, `$1`, `$2` (by index):

```markdown
Fetch ticket `$ARGUMENTS` from Trac.
```

```markdown
Analyse `$0` using the `$1` strategy.
```

Invoked as: `/cleanse 123456` → `$ARGUMENTS` = `123456`, `$0` = `123456`

### Copilot CLI

Named inputs with `${input:varName:Prompt text}`:

```markdown
Fetch ticket ${input:ticketId:Enter the ticket number} from Trac.
```

Copilot prompts the user with "Enter the ticket number" and substitutes the response. There are no positional arguments — every input is named and prompted.

### Codex CLI / Gemini CLI

No argument substitution. Skills/prompts aren't supported. Instructions are static.

## Loom Syntax

Use `{args}` for all arguments and `{arg:name}` for named arguments:

```markdown
Fetch ticket {args} from Trac.
```

```markdown
Analyse {arg:ticket} using the {arg:strategy} strategy.
```

### Named vs positional

Loom uses **named arguments only**. Named args compile naturally to both Claude (positional by order) and Copilot (named inputs). Positional-only args are fragile and don't map to Copilot's model.

`{args}` is shorthand for "the entire argument string" — used when a skill takes a single, obvious input.

## Compilation Per Target

### `{args}` (all arguments)

| Target | Output |
|---|---|
| Claude | `$ARGUMENTS` |
| Copilot | `${input:input:Provide the input}` (generic prompt) |
| Codex/Gemini | Stripped — replaced with natural language |

### `{arg:name}` (named argument)

| Target | Output |
|---|---|
| Claude | `$0`, `$1`, `$2`... (mapped by order of first appearance) |
| Copilot | `${input:name:Enter name}` (name becomes both the variable and prompt hint) |
| Codex/Gemini | Stripped — replaced with natural language |

### Example

Source:
```markdown
Fetch ticket {arg:ticket-id} and check area {arg:component}.
```

Claude:
```markdown
Fetch ticket $0 and check area $1.
```

Copilot:
```markdown
Fetch ticket ${input:ticketId:Enter ticket-id} and check area ${input:component:Enter component}.
```

## Argument Hints

The `argument-hint` frontmatter field should be auto-generated from `{arg:*}` usage if not explicitly set:

Source with `{arg:ticket-id}` and `{arg:component}`:
```yaml
argument-hint: <ticket-id> <component>
```

If the author sets `argument-hint` explicitly, that takes precedence.

## Edge Cases

- `{args}` used alongside `{arg:name}` — compile error. Use one or the other.
- `{arg:name}` used multiple times — same positional index each time (Claude), same variable (Copilot).
- Hyphens in names — `{arg:ticket-id}` compiles to `${input:ticketId:Enter ticket-id}` for Copilot (camelCase the variable, keep the display text).
- No arguments in skill — no substitution needed, `argument-hint` omitted.

## Open Questions

- Should `{arg:name}` support a custom prompt? e.g. `{arg:ticket-id:Enter the 6-digit ticket number}` → Copilot uses the custom prompt text, Claude ignores it.
- Should loom validate argument count consistency — e.g. warn if `argument-hint` lists 2 args but the body only references 1?
- Should Codex/Gemini compilation replace `{args}` with a comment like `<!-- provide: ticket-id -->` or just strip entirely?
