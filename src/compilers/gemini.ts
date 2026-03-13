import type { Skill, CompiledOutput } from "../types/index.js";

export function compileGemini(skills: Skill[]): CompiledOutput {
  // TODO: Assemble skills into GEMINI.md format
  return {
    targetType: "gemini",
    fileName: "GEMINI.md",
    content: "",
  };
}
