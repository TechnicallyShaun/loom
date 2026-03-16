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

## Phase 2: Research & Verify Compiler Output ✅
- [x] Research CURRENT Claude Code skill format (March 2026)
- [x] Research CURRENT GitHub Copilot CLI skill/agent format (March 2026)
- [x] Verify compile output matches real native format for both targets

## Phase 3: Quality Review ✅
- [x] Review all source files for modularity
- [x] Ensure compiler interface is extensible
- [x] Check separation of concerns
- [x] Refactor: extracted shared walkDir, removed 3 duplicates, fixed harvest scan paths

## Phase 4: Test Completeness ✅
- [x] Verify all commands handle optional [project] arg (no arg = all projects)
- [x] Add edge case tests: empty projects, missing folders, invalid config (19 new tests)
- [x] Harvest diff engine tests with worktree scenarios (13 tests)
- [x] Integration test: full init→register→compile→deploy→diff→discover round-trip (existing)
- [x] 100 tests total, all passing

## Phase 5: CI/CD ✅
- [x] Push branch to GitHub
- [x] Verify GitHub Actions pass (lint, format, build, test) — green after @types/node + git config fixes
- [x] Fix CI failures (2 fixed: @types/node, git user config)
- [x] Verify release.yml structure is correct

## Phase 6: Polish ✅
- [x] Update README.md to match v2 architecture
- [x] Ensure `loom --help` output is clear and complete
- [x] Run on Windows via laptop node (path handling validation) — fixed 4 path separator tests + timeout issue, 100/100 green

## Phase 7: Second Opinions
- [ ] Give source + checklist to Gemini for review — completeness check against v2-architecture.md
- [ ] Give source + checklist to Copilot for review — completeness check
- [ ] Implement any clearly missing items that meet spec
- [ ] Create `further-improvements` branch for nice-to-haves that don't fit spec

## Done
- [ ] All above checked — post completion message to #lab tagging <@1408863612675690518>
- [ ] Disable the loom-v2-build-bump cron job (ID: 2308dc3b-4b8c-4a87-9c32-57bbbd23e409)
