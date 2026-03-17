import type { MergedProject, CompiledFile } from "../types/index.js";

export function compileGemini(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions only → GEMINI.md
  if (project.instructions) {
    files.push({
      relativePath: "GEMINI.md",
      content: project.instructions + "\n",
    });
  }

  return files;
}
