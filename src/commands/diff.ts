import fs from "node:fs";
import path from "node:path";
import { loomDir, compiledDir, compiledGlobalDir, userLevelDir } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import { walkDir } from "../utils/sources.js";
import { USER_LEVEL_TARGETS } from "../types/index.js";

function diffDir(label: string, outDir: string, destDir: string): void {
  if (!fs.existsSync(outDir)) {
    console.log(`${label}: not compiled yet.`);
    return;
  }

  const files = walkDir(outDir);
  let changeCount = 0;

  console.log(`\n${label}:`);

  for (const relPath of files) {
    const compiled = fs.readFileSync(path.join(outDir, relPath), "utf-8");
    const deployTarget = path.join(destDir, relPath);

    if (!fs.existsSync(deployTarget)) {
      console.log(`  + ${relPath} (new)`);
      changeCount++;
      continue;
    }

    const existing = fs.readFileSync(deployTarget, "utf-8");
    if (compiled !== existing) {
      console.log(`  ~ ${relPath} (modified)`);
      changeCount++;
    }
  }

  if (changeCount === 0) {
    console.log(`  (up to date)`);
  } else {
    console.log(`  ${changeCount} file(s) would change`);
  }
}

export async function diff(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  const filter = args[0];
  const checkGlobal = !filter || filter === "_global";
  const checkProjects = filter !== "_global";

  const toCheck = checkProjects
    ? filter
      ? projectNames.filter((n) => n === filter)
      : projectNames
    : [];

  if (filter && filter !== "_global" && toCheck.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  // --- Per-project diff ---
  for (const name of toCheck) {
    const entry = config.projects[name];
    diffDir(name, compiledDir(dir, name), entry.path);
  }

  // --- Global (user-level) diff ---
  if (checkGlobal) {
    const globalOutDir = compiledGlobalDir(dir);
    const globalTargets = config.targets.filter((t) =>
      (USER_LEVEL_TARGETS as string[]).includes(t),
    );

    for (const target of globalTargets) {
      const targetOutDir = path.join(globalOutDir, target);
      const destDir = userLevelDir(target);
      diffDir(`_global/${target}`, targetOutDir, destDir);
    }
  }
}
