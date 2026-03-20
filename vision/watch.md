# Watch Mode

Auto-compile on source file changes. Monitor `.loom/` for modifications and re-run `loom compile` automatically.

```bash
loom watch              # Watch all projects
loom watch myproject    # Watch one project
```

Would use `fs.watch` or a lightweight watcher. Useful during active authoring sessions.
