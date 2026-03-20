import type { MergedProject, CompiledFile } from "../types/index.js";
import { serializeFrontmatter, serializeToml, mapToolNames } from "../utils/frontmatter.js";
import { CODEX_TOOL_MAP } from "./tool-mappings.js";

function mapSkillFrontmatter(fm: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  // Codex skills support name + description only in frontmatter
  return out;
}

function mapAgentToml(fm: Record<string, unknown>, body: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  if (fm.model != null) out.model = fm.model;
  if (Array.isArray(fm.tools)) out.tools = mapToolNames(fm.tools, CODEX_TOOL_MAP);
  // Body becomes developer_instructions
  out.developer_instructions = body;
  // skills: dropped — Codex has no skill references in agents
  // disallowed-tools: dropped — no Codex equivalent
  return out;
}

export function compileCodex(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions → AGENTS.md
  if (project.instructions) {
    files.push({
      relativePath: "AGENTS.md",
      content: project.instructions + "\n",
    });
  }

  // Skills → .codex/skills/<name>/SKILL.md + assets
  for (const skill of project.skills) {
    const fm = mapSkillFrontmatter(skill.frontmatter ?? {});
    files.push({
      relativePath: `.codex/skills/${skill.name}/SKILL.md`,
      content: serializeFrontmatter(fm, skill.content) + "\n",
    });
    for (const asset of skill.assets ?? []) {
      files.push({
        relativePath: `.codex/skills/${skill.name}/${asset.relativePath}`,
        content: asset.content,
      });
    }
  }

  // Agents → .codex/agents/<name>.toml
  for (const agent of project.agents) {
    const toml = mapAgentToml(agent.frontmatter ?? {}, agent.content);
    files.push({
      relativePath: `.codex/agents/${agent.name}.toml`,
      content: serializeToml(toml) + "\n",
    });
  }

  return files;
}
