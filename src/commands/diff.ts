import fs from "node:fs";
import path from "node:path";
import { loomDir, compiledDir } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import { walkDir } from "../utils/sources.js";

export async function diff(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  if (projectNames.length === 0) {
    console.log("No projects registered.");
    return;
  }

  const filter = args[0];
  const toCheck = filter ? projectNames.filter((n) => n === filter) : projectNames;

  if (filter && toCheck.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  for (const name of toCheck) {
    const entry = config.projects[name];
    const outDir = compiledDir(dir, name);

    if (!fs.existsSync(outDir)) {
      console.log(`${name}: not compiled yet.`);
      continue;
    }

    const files = walkDir(outDir);
    let changeCount = 0;

    console.log(`\n${name}:`);

    for (const relPath of files) {
      const compiled = fs.readFileSync(path.join(outDir, relPath), "utf-8");
      const deployTarget = path.join(entry.path, relPath);

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
}
