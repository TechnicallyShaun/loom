import fs from "node:fs";
import path from "node:path";
import { stringify } from "yaml";
import { loomDir } from "../utils/paths.js";
import { gitInit, gitCommit } from "../utils/git.js";
import { ensureDir } from "../utils/sources.js";
import type { LoomConfig } from "../types/index.js";

export async function init(_args: string[]): Promise<void> {
  const dir = loomDir();

  if (fs.existsSync(path.join(dir, ".git"))) {
    console.log(`Loom already initialised at ${dir}`);
    return;
  }

  // Create directory structure
  ensureDir(dir);
  for (const sub of [
    "global/instructions",
    "global/skills",
    "global/agents",
    "projects",
  ]) {
    const subDir = path.join(dir, sub);
    ensureDir(subDir);
    // Git doesn't track empty directories — add .gitkeep
    const gitkeep = path.join(subDir, ".gitkeep");
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, "", "utf-8");
    }
  }

  // Create config with default targets
  const config: LoomConfig = { targets: ["claude", "copilot", "codex", "gemini"], projects: {} };
  fs.writeFileSync(path.join(dir, "config.yaml"), stringify(config), "utf-8");

  // Create .gitignore — config.yaml contains real paths (not committed to public repo)
  // .compiled/ is NOT gitignored — it's versioned for rollback/audit
  fs.writeFileSync(path.join(dir, ".gitignore"), "config.yaml\n", "utf-8");

  // Git init + initial commit
  gitInit(dir);
  gitCommit(dir, "loom init");

  console.log(`Loom initialised at ${dir}`);
}
