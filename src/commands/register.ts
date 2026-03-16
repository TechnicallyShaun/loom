import fs from "node:fs";
import path from "node:path";
import { loomDir } from "../utils/paths.js";
import { loadConfig, saveConfig } from "../config/loader.js";
import { ensureDir } from "../utils/sources.js";
import { gitCommit } from "../utils/git.js";
import type { TargetType } from "../types/index.js";

export async function register(args: string[]): Promise<void> {
  const [name, rawPath, ...rest] = args;
  if (!name || !rawPath) {
    console.log("Usage: loom register <name> <path> [--targets claude,copilot]");
    return;
  }

  const dir = loomDir();
  if (!fs.existsSync(path.join(dir, ".git"))) {
    console.log("Loom not initialised. Run `loom init` first.");
    return;
  }

  const projectPath = path.resolve(rawPath);
  if (!fs.existsSync(projectPath)) {
    console.log(`Path does not exist: ${projectPath}`);
    return;
  }

  // Parse targets flag
  let targets: TargetType[] = ["claude", "copilot"];
  const targetsIdx = rest.indexOf("--targets");
  if (targetsIdx !== -1 && rest[targetsIdx + 1]) {
    targets = rest[targetsIdx + 1].split(",") as TargetType[];
  }

  // Update config
  const config = loadConfig(dir);
  config.projects[name] = { path: projectPath, targets };
  saveConfig(dir, config);

  // Scaffold project directories with .gitkeep so git tracks them
  for (const sub of ["instructions", "skills", "agents", "tools"]) {
    const subDir = path.join(dir, "projects", name, sub);
    ensureDir(subDir);
    const gitkeep = path.join(subDir, ".gitkeep");
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, "", "utf-8");
    }
  }

  // Commit scaffold (config.yaml is gitignored, but project dirs aren't)
  gitCommit(dir, `register: ${name}`);

  console.log(`Registered project "${name}" at ${projectPath}`);
  console.log(`Targets: ${targets.join(", ")}`);
}
