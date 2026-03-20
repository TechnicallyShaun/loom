import type { MergedProject, CompiledFile } from "../types/index.js";
import { serializeFrontmatter, mapToolNames } from "../utils/frontmatter.js";
import { GEMINI_TOOL_MAP } from "./tool-mappings.js";

function mapSkillFrontmatter(fm: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  // Gemini skills don't support argument-hint, user-invocable, disable-model-invocation, or tools
  return out;
}

function mapAgentFrontmatter(fm: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  if (Array.isArray(fm.tools)) out.tools = mapToolNames(fm.tools, GEMINI_TOOL_MAP);
  if (fm.model != null) out.model = fm.model;
  // skills: dropped — Gemini auto-discovers skills
  // disallowed-tools: dropped — no Gemini equivalent
  return out;
}

export function compileGemini(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions → GEMINI.md
  if (project.instructions) {
    files.push({
      relativePath: "GEMINI.md",
      content: project.instructions + "\n",
    });
  }

  // Skills → .gemini/skills/<name>/SKILL.md + assets
  for (const skill of project.skills) {
    const fm = mapSkillFrontmatter(skill.frontmatter ?? {});
    files.push({
      relativePath: `.gemini/skills/${skill.name}/SKILL.md`,
      content: serializeFrontmatter(fm, skill.content) + "\n",
    });
    for (const asset of skill.assets ?? []) {
      files.push({
        relativePath: `.gemini/skills/${skill.name}/${asset.relativePath}`,
        content: asset.content,
      });
    }
  }

  // Agents → .gemini/agents/<name>.md
  for (const agent of project.agents) {
    const fm = mapAgentFrontmatter(agent.frontmatter ?? {});
    files.push({
      relativePath: `.gemini/agents/${agent.name}.md`,
      content: serializeFrontmatter(fm, agent.content) + "\n",
    });
  }

  return files;
}
