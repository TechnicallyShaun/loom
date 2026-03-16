import type { TargetType, MergedProject, CompiledFile } from "../types/index.js";
import { compileClaude } from "./claude.js";
import { compileCopilot } from "./copilot.js";
import { compileCodex } from "./codex.js";
import { compileGemini } from "./gemini.js";

export function compileForTarget(
  target: TargetType,
  project: MergedProject,
): CompiledFile[] {
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
