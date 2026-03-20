# Environment Variables for Skill Scripts

## Problem

Skills that call external APIs (e.g. Trac, Jira, GitHub) need credentials and config. These values must be:

1. Available to scripts executed by any AI target (Claude Code, Copilot CLI, Codex CLI, Gemini CLI)
2. Not hardcoded in source or committed to git
3. Loaded automatically — no manual export required before each session

## How Each AI Loads Env Vars

All four targets inherit the shell environment when executing commands. A script using `process.env.TRAC_URL` works identically across all of them.

The difference is how env vars get _into_ the shell:

| Target | Auto-loads `.env`? | Native env config |
|---|---|---|
| Claude Code | No | `settings.json` → `env` block |
| Copilot CLI | No | Inherits shell only |
| Codex CLI | No | `--env` flag or env file |
| Gemini CLI | No | Inherits shell only |

None of them auto-load a `.env` file. The common ground is: **if it's in the shell environment, all four can see it.**

## Portable Approach: dotenv in the Script

The simplest cross-target solution is loading `.env` from the script itself using `dotenv` or a manual read:

```typescript
// trac.ts
import "dotenv/config";  // loads .env from cwd

const url = process.env.TRAC_URL;
const user = process.env.TRAC_USER;
const pass = process.env.TRAC_PASS;
```

This works regardless of which AI runs it — the script handles its own env loading. The `.env` file lives at the project root (gitignored).

**Dependency trade-off:** This requires `dotenv` as a dependency. For zero-dependency scripts, a manual loader is trivial:

```typescript
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env", "utf-8")
    .split("\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.split("=", 2).map(s => s.trim()))
);

const url = env.TRAC_URL;
```

## Alternative: Shell Profile

Export in `~/.bashrc` or `$PROFILE` (PowerShell):

```bash
export TRAC_URL=https://trac.example.com/jsonrpc
export TRAC_USER=shaun
export TRAC_PASS=secret
```

Available to all four targets with no script changes. Downside: not project-scoped — every project sees the same values.

## Recommendation

For skill scripts executed via `npx tsx`:

1. Use a `.env` file at the project root (gitignored)
2. Load it in the script with `dotenv/config` or a manual reader
3. Reference vars via `process.env.*`

This is the only approach that is:
- Auto-loaded (no manual export)
- Project-scoped (different projects can have different values)
- Cross-target (all four AIs execute the same script identically)
- Secure (`.env` is gitignored, never compiled or deployed)

## Loom Considerations

- Loom should **never** compile, copy, or deploy `.env` files
- Loom could validate that skill scripts reference env vars that are documented (lint/warning, not blocking)
- Loom could generate a `.env.example` alongside compiled skills listing required vars without values
- SKILL.md should document required env vars so the AI can tell the user if they're missing:

```markdown
## Prerequisites
This skill requires the following environment variables:
- `TRAC_URL` — Trac JSON-RPC endpoint
- `TRAC_USER` — Trac username
- `TRAC_PASS` — Trac password
```

## Open Questions

- Should loom provide a `loom env` command to manage `.env` files across registered projects?
- Should skill frontmatter support a `requires-env` field that loom validates at compile/deploy time?
