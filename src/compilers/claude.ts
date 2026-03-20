import type { MergedProject, CompiledFile } from "../types/index.js";
import { serializeFrontmatter, mapToolNames } from "../utils/frontmatter.js";
import { CLAUDE_TOOL_MAP } from "./tool-mappings.js";

function mapSkillFrontmatter(fm: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  if (fm["argument-hint"] != null) out["argument-hint"] = fm["argument-hint"];
  if (fm["user-invocable"] != null) out["user-invocable"] = fm["user-invocable"];
  if (fm["disable-model-invocation"] != null)
    out["disable-model-invocation"] = fm["disable-model-invocation"];
  if (Array.isArray(fm.tools)) out["allowed-tools"] = mapToolNames(fm.tools, CLAUDE_TOOL_MAP);
  return out;
}

function mapAgentFrontmatter(fm: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  if (fm.skills != null) out.skills = fm.skills;
  if (Array.isArray(fm.tools)) out.tools = mapToolNames(fm.tools, CLAUDE_TOOL_MAP);
  if (Array.isArray(fm["disallowed-tools"]))
    out.disallowedTools = mapToolNames(fm["disallowed-tools"], CLAUDE_TOOL_MAP);
  if (fm.model != null) out.model = fm.model;
  return out;
}

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
    const fm = mapSkillFrontmatter(skill.frontmatter ?? {});
    files.push({
      relativePath: `.claude/skills/${skill.name}/SKILL.md`,
      content: serializeFrontmatter(fm, skill.content) + "\n",
    });
  }

  // Agents → .claude/agents/<name>.md
  for (const agent of project.agents) {
    const fm = mapAgentFrontmatter(agent.frontmatter ?? {});
    files.push({
      relativePath: `.claude/agents/${agent.name}.md`,
      content: serializeFrontmatter(fm, agent.content) + "\n",
    });
  }

  return files;
}
