import type { TargetType, MergedProject, CompiledFile } from "../types/index.js";
import { compileClaude } from "./claude.js";
import { compileCopilot } from "./copilot.js";
import { compileCodex } from "./codex.js";
import { compileGemini } from "./gemini.js";

export function compileForTarget(target: TargetType, project: MergedProject): CompiledFile[] {
  switch (target) {
    case "claude":
      return compileClaude(project);
    case "copilot":
      return compileCopilot(project);
    case "codex":
      return compileCodex(project);
    case "gemini":
      return compileGemini(project);
  }
}

/** Compile for user-level directories (remaps paths for ~/.claude/, ~/.copilot/) */
export function compileForTargetUserLevel(
  target: TargetType,
  project: MergedProject,
): CompiledFile[] {
  switch (target) {
    case "claude":
      return compileClaude(project).map((f) => ({
        ...f,
        relativePath: stripPrefix(f.relativePath, ".claude/"),
      }));
    case "copilot":
      return compileCopilot(project).map((f) => ({
        ...f,
        relativePath: stripPrefix(f.relativePath, ".github/"),
      }));
    case "gemini":
      return compileGemini(project).map((f) => ({
        ...f,
        relativePath: stripPrefix(f.relativePath, ".gemini/"),
      }));
    case "codex":
      return compileCodex(project).map((f) => ({
        ...f,
        relativePath: stripPrefix(f.relativePath, ".codex/"),
      }));
  }
}

function stripPrefix(p: string, prefix: string): string {
  return p.startsWith(prefix) ? p.slice(prefix.length) : p;
}
