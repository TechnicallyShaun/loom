import type { Skill, CompiledOutput } from "../types/index.js";

export function compileCopilot(skills: Skill[]): CompiledOutput {
  // TODO: Assemble skills into copilot-instructions.md format
  return {
    targetType: "copilot",
    fileName: "copilot-instructions.md",
    content: "",
  };
}
