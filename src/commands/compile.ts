import fs from "node:fs";
import path from "node:path";
import { loomDir, globalDir, projectDir, compiledDir, timestamp } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import {
  readMarkdownDir,
  readSkillsDir,
  readAgentsDir,
  mergeLayers,
  concatInstructions,
  ensureDir,
} from "../utils/sources.js";
import { gitCommit } from "../utils/git.js";
import { compileForTarget } from "../compilers/index.js";
import type { MergedProject, CompiledFile } from "../types/index.js";

export async function compile(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  if (projectNames.length === 0) {
    console.log("No projects registered. Run `loom register <name> <path>` first.");
    return;
  }

  // If a specific project is given, only compile that one
  const filter = args[0];
  const toCompile = filter
    ? projectNames.filter((n) => n === filter)
    : projectNames;

  if (filter && toCompile.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  const gDir = globalDir(dir);
  const globalInstructions = readMarkdownDir(path.join(gDir, "instructions"));
  const globalSkills = readSkillsDir(path.join(gDir, "skills"));
  const globalAgents = readAgentsDir(path.join(gDir, "agents"));

  const compiled: string[] = [];

  for (const name of toCompile) {
    const entry = config.projects[name];
    const pDir = projectDir(dir, name);

    const projInstructions = readMarkdownDir(path.join(pDir, "instructions"));
    const projSkills = readSkillsDir(path.join(pDir, "skills"));
    const projAgents = readAgentsDir(path.join(pDir, "agents"));

    const merged: MergedProject = {
      name,
      targets: entry.targets,
      projectPath: entry.path,
      instructions: concatInstructions(globalInstructions, projInstructions),
      skills: mergeLayers(globalSkills, projSkills),
      agents: mergeLayers(globalAgents, projAgents),
    };

    // Compile for each target
    const files: CompiledFile[] = [];
    for (const target of entry.targets) {
      files.push(...compileForTarget(target, merged));
    }

    // Write compiled output
    const outDir = compiledDir(dir, name);
    // Clean previous output
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true });
    }
    for (const file of files) {
      const filePath = path.join(outDir, file.relativePath);
      ensureDir(path.dirname(filePath));
      fs.writeFileSync(filePath, file.content, "utf-8");
    }

    compiled.push(name);
    console.log(`Compiled ${name}: ${files.length} files for [${entry.targets.join(", ")}]`);
  }

  gitCommit(dir, `compile: ${compiled.join(", ")} (${timestamp()})`);
}
