# Loom v2 Build Checklist

> Branch: `dai/v2-architecture`

## Phase 1: Foundation ✅
- [x] CLI commands implemented (init, register, compile, deploy, harvest, diff, discover)
- [x] Compilers (Claude, Copilot, Codex, Gemini)
- [x] Config loading + YAML
- [x] Build clean (tsc), ESLint + Prettier configured

## Phase 2: Research & Verify Compiler Output ✅
- [x] Claude Code: .claude/skills/ + .claude/agents/ (March 2026 format)
- [x] Copilot: .github/skills/ + .github/agents/*.agent.md (March 2026 format)

## Phase 3: Quality Review ✅
- [x] Modular, clean interfaces, extensible compiler pattern
- [x] Extracted shared walkDir, removed duplicates

## Phase 4: Test Completeness ✅
- [x] 109 tests passing — commands, compilers, config, edge cases, harvest worktree scenarios, integration
- [x] harvest --yes flag for non-interactive mode
- [x] applyChange tested (instructions, skills, agents, Windows paths)
- [x] diff and discover tests assert on output content

## Phase 5: CI/CD ✅
- [x] GitHub Actions green (lint, format, build, test)
- [x] release.yml ready for tag-triggered npm publish

## Phase 6: Polish ✅
- [x] README updated, help text complete
- [x] Windows path handling validated on laptop node

## Phase 7: Second Opinions ✅
- [x] Gemini review: found 5 issues (compiled gitignore, git tags, agent harvest, gitkeep, pending harvests)
- [x] Claude Code review: found 6 issues (compiled gitignore, git tags, agent harvest, Windows paths, test gaps, commit message)
- [x] All critical issues fixed (6 fixes committed)
- [x] Further improvements documented in docs/further-improvements.md

## Done ✅
- [x] All phases complete
- [ ] Disable the loom-v2-build-bump cron job
