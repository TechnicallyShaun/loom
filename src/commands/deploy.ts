import fs from "node:fs";
import path from "node:path";
import {
  loomDir,
  compiledDir,
  compiledGlobalDir,
  userLevelDir,
  timestamp,
} from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import { gitCommit, getShortHash, gitTag } from "../utils/git.js";
import { ensureDir, walkDir } from "../utils/sources.js";
import { USER_LEVEL_TARGETS } from "../types/index.js";

export async function deploy(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  const filter = args[0];
  const deployGlobal = !filter || filter === "_global";
  const deployProjects = filter !== "_global";

  const toDeploy = deployProjects
    ? filter
      ? projectNames.filter((n) => n === filter)
      : projectNames
    : [];

  if (filter && filter !== "_global" && toDeploy.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  const deployed: string[] = [];

  // --- Per-project deployment ---
  for (const name of toDeploy) {
    const entry = config.projects[name];
    const outDir = compiledDir(dir, name);

    if (!fs.existsSync(outDir)) {
      console.log(`${name}: not compiled yet — run \`loom compile ${name}\` first.`);
      continue;
    }

    const files = walkDir(outDir);
    if (files.length === 0) {
      console.log(`${name}: compiled output is empty.`);
      continue;
    }

    for (const relPath of files) {
      const src = path.join(outDir, relPath);
      const dest = path.join(entry.path, relPath);
      ensureDir(path.dirname(dest));
      fs.copyFileSync(src, dest);
    }

    deployed.push(name);
    console.log(`Deployed ${name}: ${files.length} files → ${entry.path}`);
  }

  // --- Global (user-level) deployment ---
  if (deployGlobal) {
    const globalOutDir = compiledGlobalDir(dir);
    const globalTargets = config.targets.filter((t) =>
      (USER_LEVEL_TARGETS as string[]).includes(t),
    );

    for (const target of globalTargets) {
      const targetOutDir = path.join(globalOutDir, target);
      if (!fs.existsSync(targetOutDir)) continue;

      const destDir = userLevelDir(target);
      const files = walkDir(targetOutDir);
      if (files.length === 0) continue;

      for (const relPath of files) {
        const src = path.join(targetOutDir, relPath);
        const dest = path.join(destDir, relPath);
        ensureDir(path.dirname(dest));
        fs.copyFileSync(src, dest);
      }

      deployed.push(`_global/${target}`);
      console.log(`Deployed _global/${target}: ${files.length} files → ${destDir}`);
    }
  }

  if (deployed.length > 0) {
    let hash: string;
    try {
      hash = getShortHash(dir);
    } catch {
      hash = "unknown";
    }
    const ts = timestamp();
    const logPath = path.join(dir, ".deploy-log");
    const logEntry = `${ts} | ${deployed.join(", ")} @${hash}\n`;
    fs.appendFileSync(logPath, logEntry, "utf-8");

    const commitMsg = `deploy: ${deployed.join(", ")} @${hash} (${ts})`;
    gitCommit(dir, commitMsg);

    const tagTs = ts.replace(/[: ]/g, "-");
    for (const name of deployed) {
      try {
        gitTag(dir, `deploy/${name}/${tagTs}`);
      } catch {
        // Tag already exists — skip
      }
    }
  }
}
