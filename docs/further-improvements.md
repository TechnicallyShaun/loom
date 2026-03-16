# Further Improvements

> Items from Gemini and Claude Code reviews that are valuable but outside the v2 spec scope.
> These can be tackled incrementally after the v2 foundation is solid.

## Harvest Enhancements
- **`harvest --extract` (AI-assisted mode):** Spawn an agent to categorise diffs into global learning, project learning, or noise. Spec mentions this but it's a significant feature.
- **Interactive mode (`[y/n/interactive]`):** Per-change accept/reject instead of all-or-nothing per project.
- **Better diff algorithm:** Current line-set approach misses reordered lines, modified lines, and contextual changes. Consider a proper diff library.
- **Smart source mapping:** Instead of always writing to `harvested.md`, attempt to find the original source file by content overlap.

## Deploy Enhancements
- **Clean stale files:** If a skill is removed from source, the old files remain at the deploy target. Deploy should optionally clean files that no longer exist in compiled output (`--clean` flag).
- **Atomic deploys:** Write to a temp directory and swap, so a failed deploy doesn't leave partial state.

## Discover Enhancements
- **Pending harvests:** Perform a quick diff check to show whether each project has unharvested changes.

## Compile Enhancements
- **Atomic compiles:** Write to temp directory and swap with `.compiled/` to prevent partial state on failure.
- **Empty compile detection:** Skip commit if nothing changed in source since last compile.

## Cross-Platform
- **Path normalisation throughout:** Audit all path comparisons for Windows compatibility. Current fixes cover harvest but other areas may need attention.

## Compiler Improvements
- **Copilot frontmatter validation:** Validate skill frontmatter against the AgentSkills standard (agentskills.io).
- **Target-specific instruction formatting:** Different AI agents may prefer different header structures or separators.
- **Cursor / Windsurf compilers:** Add support for additional targets.

## Security
- **Git commit message safety:** Replace `JSON.stringify` with `--file` approach for commit messages to eliminate any shell injection edge case.

## Tools Integration
- **Include tool docs in compiled output:** Optionally embed referenced tool docs in skill files so the AI has them in context without separate file access.
