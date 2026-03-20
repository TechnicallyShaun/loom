import fs from "node:fs";
import path from "node:path";
import { loomDir, globalDir, projectDir, compiledDir, compiledGlobalDir, timestamp } from "../utils/paths.js";
import { loadConfig, validateTargets } from "../config/loader.js";
import {
  readMarkdownDir,
  readSkillsDir,
  readAgentsDir,
  mergeLayers,
  concatInstructions,
  ensureDir,
} from "../utils/sources.js";
import { gitCommit } from "../utils/git.js";
import { validateSkillRefs } from "../utils/frontmatter.js";
import { compileForTarget, compileForTargetUserLevel } from "../compilers/index.js";
import type { MergedProject, CompiledFile } from "../types/index.js";
import { USER_LEVEL_TARGETS } from "../types/index.js";

export async function compile(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  validateTargets(config);
  const projectNames = Object.keys(config.projects);

  const filter = args[0];
  const compileGlobal = !filter || filter === "_global";
  const compileProjects = filter !== "_global";

  const toCompile = compileProjects
    ? filter
      ? projectNames.filter((n) => n === filter)
      : projectNames
    : [];

  if (filter && filter !== "_global" && toCompile.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  const loomRoot = path.dirname(dir);
  const gDir = globalDir(dir);
  const globalInstructions = readMarkdownDir(path.join(gDir, "instructions"));
  const globalSkills = readSkillsDir(path.join(gDir, "skills"));
  const globalAgents = readAgentsDir(path.join(gDir, "agents"));

  const compiled: string[] = [];

  // --- Per-project compilation ---
  for (const name of toCompile) {
    const entry = config.projects[name];
    const pDir = projectDir(dir, name);

    const projInstructions = readMarkdownDir(path.join(pDir, "instructions"));
    const projSkills = readSkillsDir(path.join(pDir, "skills"));
    const projAgents = readAgentsDir(path.join(pDir, "agents"));

    const merged: MergedProject = {
      name,
      targets: config.targets,
      projectPath: entry.path,
      loomRoot,
      instructions: concatInstructions(globalInstructions, projInstructions),
      skills: mergeLayers(globalSkills, projSkills),
      agents: mergeLayers(globalAgents, projAgents),
    };

    // Validate /skill-name references
    const knownSkills = merged.skills.map((s) => s.name);
    for (const skill of merged.skills) {
      const unknown = validateSkillRefs(skill.content, knownSkills);
      for (const ref of unknown) {
        console.log(`  warn: ${name}/skills/${skill.name} references unknown skill /${ref}`);
      }
    }
    for (const agent of merged.agents) {
      const unknown = validateSkillRefs(agent.content, knownSkills);
      for (const ref of unknown) {
        console.log(`  warn: ${name}/agents/${agent.name} references unknown skill /${ref}`);
      }
    }

    const files: CompiledFile[] = [];
    for (const target of config.targets) {
      files.push(...compileForTarget(target, merged));
    }

    const outDir = compiledDir(dir, name);
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true });
    }
    for (const file of files) {
      const filePath = path.join(outDir, file.relativePath);
      ensureDir(path.dirname(filePath));
      if (Buffer.isBuffer(file.content)) {
        fs.writeFileSync(filePath, file.content);
      } else {
        fs.writeFileSync(filePath, file.content, "utf-8");
      }
    }

    compiled.push(name);
    console.log(`Compiled ${name}: ${files.length} files for [${config.targets.join(", ")}]`);
  }

  // --- Global (user-level) compilation ---
  const globalTargets = config.targets.filter((t) =>
    (USER_LEVEL_TARGETS as string[]).includes(t),
  );

  if (compileGlobal && globalTargets.length > 0) {
    const globalMerged: MergedProject = {
      name: "_global",
      targets: globalTargets,
      projectPath: "",
      loomRoot,
      instructions: concatInstructions(globalInstructions, []),
      skills: globalSkills,
      agents: globalAgents,
    };

    const globalOutDir = compiledGlobalDir(dir);
    if (fs.existsSync(globalOutDir)) {
      fs.rmSync(globalOutDir, { recursive: true });
    }

    let totalFiles = 0;
    for (const target of globalTargets) {
      const targetFiles = compileForTargetUserLevel(target, globalMerged);
      for (const file of targetFiles) {
        const filePath = path.join(globalOutDir, target, file.relativePath);
        ensureDir(path.dirname(filePath));
        if (Buffer.isBuffer(file.content)) {
          fs.writeFileSync(filePath, file.content);
        } else {
          fs.writeFileSync(filePath, file.content, "utf-8");
        }
      }
      totalFiles += targetFiles.length;
    }

    compiled.push("_global");
    console.log(`Compiled _global: ${totalFiles} files for [${globalTargets.join(", ")}]`);
  }

  if (compiled.length > 0) {
    gitCommit(dir, `compile: ${compiled.join(", ")} (${timestamp()})`);
  }
}
