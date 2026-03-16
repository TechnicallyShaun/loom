import type { MergedProject, CompiledFile } from "../types/index.js";

export function compileCodex(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions only → AGENTS.md
  if (project.instructions) {
    files.push({
      relativePath: "AGENTS.md",
      content: project.instructions + "\n",
    });
  }

  return files;
}
