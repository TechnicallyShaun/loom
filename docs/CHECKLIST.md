# Loom v2 Build Checklist

> Cron job bumps every 15 mins. Work through items in order. Check off when done.
> Branch: `dai/v2-architecture`

## Phase 1: Foundation ✅
- [x] CLI commands implemented (init, register, compile, deploy, harvest, diff, discover)
- [x] Compilers (Claude, Copilot, Codex, Gemini)
- [x] Config loading + YAML
- [x] 70 tests passing
- [x] Build clean (tsc)
- [x] ESLint + Prettier configured

## Phase 2: Research & Verify Compiler Output
- [x] Research CURRENT Claude Code skill format (March 2026) — `.claude/skills/`, SKILL.md frontmatter options, agent:true, context:fork, allowed-tools. Update claude compiler if needed.
- [x] Research CURRENT GitHub Copilot CLI skill/agent format (March 2026) — skills at `.github/skills/`, agents at `.github/agents/*.agent.md`. Updated compiler + tests.
- [x] Verify compile output matches real native format for both targets

## Phase 3: Quality Review
- [ ] Review all source files for modularity — small single-purpose functions, clean interfaces
- [ ] Ensure compiler interface is extensible (easy to add Cursor, Windsurf, etc.)
- [ ] Check separation of concerns: file I/O, git ops, config, compilation in distinct modules
- [ ] Refactor anything monolithic or hard to follow

## Phase 4: Test Completeness
- [ ] Verify all commands handle optional [project] arg (no arg = all projects)
- [ ] Add edge case tests: empty projects, missing folders, invalid config
- [ ] Harvest diff engine tests with worktree scenarios
- [ ] Integration test: full init→register→compile→deploy→harvest round-trip

## Phase 5: CI/CD
- [ ] Push branch to GitHub
- [ ] Verify GitHub Actions pass (lint, format, build, test)
- [ ] Fix any CI failures
- [ ] Verify release.yml structure is correct

## Phase 6: Polish
- [ ] Update README.md to match v2 architecture
- [ ] Ensure `loom --help` output is clear and complete
- [ ] Run on Windows via laptop node (path handling validation)

## Phase 7: Second Opinions
- [ ] Give source + checklist to Gemini for review — completeness check against v2-architecture.md
- [ ] Give source + checklist to Copilot for review — completeness check
- [ ] Implement any clearly missing items that meet spec
- [ ] Create `further-improvements` branch for nice-to-haves that don't fit spec

## Done
- [ ] All above checked — post completion message to #lab tagging <@1408863612675690518>
- [ ] Disable the loom-v2-build-bump cron job (ID: 2308dc3b-4b8c-4a87-9c32-57bbbd23e409)
