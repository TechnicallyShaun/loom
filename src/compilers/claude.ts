import type { Skill, CompiledOutput } from "../types/index.js";

export function compileClaude(skills: Skill[]): CompiledOutput {
  // TODO: Assemble skills into CLAUDE.md format
  return {
    targetType: "claude",
    fileName: "CLAUDE.md",
    content: "",
  };
}
