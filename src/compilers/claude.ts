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
  // Supported frontmatter (March 2026): name, description, argument-hint,
  // disable-model-invocation, user-invocable, allowed-tools, model,
  // context (fork), agent, hooks
  // String substitutions: $ARGUMENTS, $ARGUMENTS[N], $N,
  // ${CLAUDE_SESSION_ID}, ${CLAUDE_SKILL_DIR}
  for (const skill of project.skills) {
    files.push({
      relativePath: `.claude/skills/${skill.name}/SKILL.md`,
      content: skill.content + "\n",
    });
  }

  // Agents → .claude/agents/<name>.md
  // Claude Code subagents live in .claude/agents/ (not skills with agent:true).
  // Supported frontmatter (March 2026): name, description, tools,
  // disallowedTools, model (sonnet|opus|haiku|inherit|full-id),
  // permissionMode (default|acceptEdits|dontAsk|bypassPermissions|plan),
  // mcpServers, hooks, maxTurns, skills, memory
  // Body becomes the subagent's system prompt.
  for (const agent of project.agents) {
    files.push({
      relativePath: `.claude/agents/${agent.name}.md`,
      content: agent.content + "\n",
    });
  }

  return files;
}
