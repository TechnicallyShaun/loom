import fs from "node:fs";
import path from "node:path";
import { loomDir, compiledDir, timestamp } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import { gitCommit, getShortHash } from "../utils/git.js";
import { ensureDir } from "../utils/sources.js";

export async function deploy(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  if (projectNames.length === 0) {
    console.log("No projects registered.");
    return;
  }

  const filter = args[0];
  const toDeploy = filter ? projectNames.filter((n) => n === filter) : projectNames;

  if (filter && toDeploy.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  const deployed: string[] = [];

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

  if (deployed.length > 0) {
    let hash: string;
    try {
      hash = getShortHash(dir);
    } catch {
      hash = "unknown";
    }
    const ts = timestamp();
    // Write a deploy log entry so git always has something to commit
    const logPath = path.join(dir, ".deploy-log");
    const logEntry = `${ts} | ${deployed.join(", ")} @${hash}\n`;
    fs.appendFileSync(logPath, logEntry, "utf-8");

    gitCommit(dir, `deploy: ${deployed.join(", ")} @${hash} (${ts})`);
  }
}

function walkDir(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}
