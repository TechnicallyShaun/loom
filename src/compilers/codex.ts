import type { Skill, CompiledOutput } from "../types/index.js";

export function compileCodex(skills: Skill[]): CompiledOutput {
  // TODO: Assemble skills into AGENTS.md format
  return {
    targetType: "codex",
    fileName: "AGENTS.md",
    content: "",
  };
}
