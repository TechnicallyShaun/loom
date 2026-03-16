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
    "global/tools",
    "projects",
  ]) {
    ensureDir(path.join(dir, sub));
  }

  // Create empty config
  const config: LoomConfig = { projects: {} };
  fs.writeFileSync(path.join(dir, "config.yaml"), stringify(config), "utf-8");

  // Create .gitignore — config.yaml contains real paths
  fs.writeFileSync(
    path.join(dir, ".gitignore"),
    "config.yaml\n.compiled/\n",
    "utf-8",
  );

  // Git init + initial commit
  gitInit(dir);
  gitCommit(dir, "loom init");

  console.log(`Loom initialised at ${dir}`);
}
