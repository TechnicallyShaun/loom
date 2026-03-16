import type { MergedProject, CompiledFile } from "../types/index.js";

export function compileCopilot(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions → .github/copilot-instructions.md
  if (project.instructions) {
    files.push({
      relativePath: ".github/copilot-instructions.md",
      content: project.instructions + "\n",
    });
  }

  // Skills → .github/copilot/skills/<name>/SKILL.md
  for (const skill of project.skills) {
    files.push({
      relativePath: `.github/copilot/skills/${skill.name}/SKILL.md`,
      content: skill.content + "\n",
    });
  }

  // Agents → .github/copilot/agents/<name>.md
  for (const agent of project.agents) {
    files.push({
      relativePath: `.github/copilot/agents/${agent.name}.md`,
      content: agent.content + "\n",
    });
  }

  return files;
}
