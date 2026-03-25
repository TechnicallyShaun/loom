import type { MergedProject, CompiledFile } from "../types/index.js";
import {
  serializeFrontmatter,
  mapToolNames,
  applySubstitutions,
  copilotSubstitutions,
  deriveArgumentHint,
} from "../utils/frontmatter.js";
import { COPILOT_TOOL_MAP } from "./tool-mappings.js";

function mapSkillFrontmatter(
  fm: Record<string, unknown>,
  content: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  if (fm["argument-hint"] != null) {
    out["argument-hint"] = fm["argument-hint"];
  } else {
    const hint = deriveArgumentHint(content);
    if (hint) out["argument-hint"] = hint;
  }
  if (fm["user-invocable"] != null) out["user-invocable"] = fm["user-invocable"];
  if (fm["disable-model-invocation"] != null)
    out["disable-model-invocation"] = fm["disable-model-invocation"];
  // tools: dropped — Copilot has no tool restrictions on skills
  return out;
}

function mapAgentFrontmatter(fm: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (fm.name != null) out.name = fm.name;
  if (fm.description != null) out.description = fm.description;
  // skills: dropped — Copilot auto-discovers skills by description
  if (Array.isArray(fm.tools)) out.tools = mapToolNames(fm.tools, COPILOT_TOOL_MAP);
  // disallowed-tools: dropped — no Copilot equivalent
  // model: dropped — different model ecosystem
  return out;
}

export function compileCopilot(project: MergedProject): CompiledFile[] {
  const files: CompiledFile[] = [];

  // Instructions → .github/copilot-instructions.md
  if (project.instructions) {
    const ctx = copilotSubstitutions("", project.projectPath, project.loomRoot);
    files.push({
      relativePath: ".github/copilot-instructions.md",
      content: applySubstitutions(project.instructions, ctx) + "\n",
    });
  }

  // Skills → .github/skills/<name>/SKILL.md + assets
  for (const skill of project.skills) {
    const ctx = copilotSubstitutions(skill.name, project.projectPath, project.loomRoot);
    const body = applySubstitutions(skill.content, ctx);
    const fm = mapSkillFrontmatter(skill.frontmatter ?? {}, skill.content);
    files.push({
      relativePath: `.github/skills/${skill.name}/SKILL.md`,
      content: serializeFrontmatter(fm, body) + "\n",
    });
    for (const asset of skill.assets ?? []) {
      files.push({
        relativePath: `.github/skills/${skill.name}/${asset.relativePath}`,
        content: asset.content,
      });
    }
  }

  // Agents → .github/agents/<name>.agent.md
  for (const agent of project.agents) {
    const ctx = copilotSubstitutions("", project.projectPath, project.loomRoot);
    const body = applySubstitutions(agent.content, ctx);
    const fm = mapAgentFrontmatter(agent.frontmatter ?? {});
    files.push({
      relativePath: `.github/agents/${agent.name}.agent.md`,
      content: serializeFrontmatter(fm, body) + "\n",
    });
  }

  return files;
}
