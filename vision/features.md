# Future Features

Features that are not yet implemented but are planned or under consideration.

## Watch mode

Auto-compile on source file changes. Monitor `.loom/` for modifications and re-run `loom compile` automatically.

```bash
loom watch              # Watch all projects
loom watch myproject    # Watch one project
```

Would use `fs.watch` or a lightweight watcher. Useful during active authoring sessions.

## Harvest from user-level directories

Currently harvest only scans per-project deployed locations. Extend to also scan user-level directories (`~/.claude/`, `~/.copilot/`) and merge changes back to `global/` source.

## Rules support

Claude Code supports `.claude/rules/` — path-scoped instruction files that only load when the AI reads matching files. Loom could compile a new `rules` content type into this format. See `vision/rules.md` for design.
