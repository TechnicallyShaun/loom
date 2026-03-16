import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { loomDir, compiledDir } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";

export async function discover(_args: string[]): Promise<void> {
  const dir = loomDir();

  if (!fs.existsSync(path.join(dir, ".git"))) {
    console.log("Loom not initialised. Run `loom init` first.");
    return;
  }

  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  if (projectNames.length === 0) {
    console.log("No projects registered. Run `loom register <name> <path>` to add one.");
    return;
  }

  console.log(`Loom home: ${dir}\n`);
  console.log(`${projectNames.length} project(s) registered:\n`);

  for (const name of projectNames) {
    const entry = config.projects[name];
    const outDir = compiledDir(dir, name);
    const compiled = fs.existsSync(outDir);

    console.log(`  ${name}`);
    console.log(`    Path:    ${entry.path}`);
    console.log(`    Targets: ${entry.targets.join(", ")}`);
    console.log(`    Compiled: ${compiled ? "yes" : "no"}`);

    // Last compile/deploy from git log
    try {
      const lastCompile = execSync(`git log --oneline --grep="compile: ${name}" -1`, {
        cwd: dir,
        encoding: "utf-8",
      }).trim();
      if (lastCompile) console.log(`    Last compile: ${lastCompile}`);
    } catch {
      // ignore
    }

    try {
      const lastDeploy = execSync(`git log --oneline --grep="deploy: ${name}" -1`, {
        cwd: dir,
        encoding: "utf-8",
      }).trim();
      if (lastDeploy) console.log(`    Last deploy: ${lastDeploy}`);
    } catch {
      // ignore
    }

    console.log();
  }
}
