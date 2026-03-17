import type { MergedProject, CompiledFile } from "../types/index.js";

export function compileCopilot(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions → .github/copilot-instructions.md
  // Also supports: .github/instructions/*.instructions.md (with applyTo globs)
  // and AGENTS.md (multi-agent compatible, recognised by multiple AI agents).
  // Priority: personal > repository > organisation.
  if (project.instructions) {
    files.push({
      relativePath: ".github/copilot-instructions.md",
      content: project.instructions + "\n",
    });
  }

  // Skills → .github/skills/<name>/SKILL.md
  // Copilot March 2026: Skills use the AgentSkills open standard (agentskills.io).
  // Recognised directories: .github/skills/, .claude/skills/, .agents/skills/
  // Personal skills: ~/.copilot/skills/
  // Frontmatter: name, description, argument-hint
  // Skills are progressively loaded: name+description for discovery,
  // full instructions when matched, resources only when referenced.
  for (const skill of project.skills) {
    files.push({
      relativePath: `.github/skills/${skill.name}/SKILL.md`,
      content: skill.content + "\n",
    });
  }

  // Agents → .github/agents/<name>.agent.md
  // Copilot March 2026: Custom agents (formerly "custom chat modes").
  // Define specialist persona, instructions, allowed tools, and handoffs.
  // Handoffs chain agents into guided workflows (Plan > Implement > Review).
  // Can run as subagents, background agents, and cloud agents.
  for (const agent of project.agents) {
    files.push({
      relativePath: `.github/agents/${agent.name}.agent.md`,
      content: agent.content + "\n",
    });
  }

  return files;
}
