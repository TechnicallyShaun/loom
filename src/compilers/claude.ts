import type { MergedProject, CompiledFile } from "../types/index.js";

export function compileClaude(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions → CLAUDE.md
  if (project.instructions) {
    files.push({
      relativePath: "CLAUDE.md",
      content: project.instructions + "\n",
    });
  }

  // Skills → .claude/skills/<name>/SKILL.md
  for (const skill of project.skills) {
    files.push({
      relativePath: `.claude/skills/${skill.name}/SKILL.md`,
      content: skill.content + "\n",
    });
  }

  // Agents → .claude/skills/<name>/SKILL.md with agent:true frontmatter
  for (const agent of project.agents) {
    const content = agent.content.startsWith("---")
      ? injectFrontmatter(agent.content, "agent: true")
      : `---\nagent: true\n---\n\n${agent.content}\n`;
    files.push({
      relativePath: `.claude/skills/${agent.name}/SKILL.md`,
      content,
    });
  }

  return files;
}

function injectFrontmatter(content: string, injection: string): string {
  // Insert agent: true into existing frontmatter
  const endIdx = content.indexOf("---", 3);
  if (endIdx === -1) return content;
  const front = content.slice(0, endIdx).trim();
  const body = content.slice(endIdx + 3);
  return `${front}\n${injection}\n---${body}`;
}
