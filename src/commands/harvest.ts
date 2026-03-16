import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { loomDir, compiledDir, timestamp } from "../utils/paths.js";
import { loadConfig } from "../config/loader.js";
import { gitCommit } from "../utils/git.js";

interface Change {
  location: string;
  file: string;
  additions: string[];
}

export async function harvest(args: string[]): Promise<void> {
  const dir = loomDir();
  const config = loadConfig(dir);
  const projectNames = Object.keys(config.projects);

  if (projectNames.length === 0) {
    console.log("No projects registered.");
    return;
  }

  const filter = args[0];
  const toHarvest = filter ? projectNames.filter((n) => n === filter) : projectNames;

  if (filter && toHarvest.length === 0) {
    console.log(`Unknown project: ${filter}`);
    return;
  }

  let totalChanges = 0;

  for (const name of toHarvest) {
    const entry = config.projects[name];
    const outDir = compiledDir(dir, name);

    if (!fs.existsSync(outDir)) {
      console.log(`${name}: not compiled yet — skipping.`);
      continue;
    }

    // Find all locations to scan: project path + worktree siblings
    const locations = findLocations(entry.path, name);
    const changes: Change[] = [];

    for (const location of locations) {
      const locationChanges = diffLocation(location, outDir);
      changes.push(...locationChanges);
    }

    if (changes.length === 0) {
      console.log(`${name}: no changes found.`);
      continue;
    }

    // Display changes
    console.log(`\n${name}: found ${changes.length} changed file(s):\n`);
    for (const change of changes) {
      console.log(`  ${change.location}/${change.file}:`);
      for (const line of change.additions) {
        console.log(`    + ${line}`);
      }
      console.log();
    }

    // Prompt for approval
    const answer = await ask("Accept changes? [y/n] ");
    if (answer.toLowerCase() === "y") {
      // Copy changed files back to loom source
      for (const change of changes) {
        const sourcePath = path.join(change.location, change.file);
        applyChange(dir, name, change.file, sourcePath);
      }
      totalChanges += changes.length;
      console.log(`Merged ${changes.length} change(s) for ${name}.`);
    } else {
      console.log(`Skipped changes for ${name}.`);
    }
  }

  if (totalChanges > 0) {
    gitCommit(dir, `harvest: ${toHarvest.join(", ")} +${totalChanges} changes (${timestamp()})`);
  }
}

/** Find project path + any worktree sibling directories */
function findLocations(projectPath: string, _name: string): string[] {
  const locations = [projectPath];
  const parent = path.dirname(projectPath);
  const worktreesDir = path.join(parent, `${path.basename(projectPath)}.worktrees`);

  if (fs.existsSync(worktreesDir)) {
    try {
      const entries = fs.readdirSync(worktreesDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          locations.push(path.join(worktreesDir, entry.name));
        }
      }
    } catch {
      // Ignore permission errors
    }
  }

  return locations;
}

/** Diff deployed files in a location against compiled output */
function diffLocation(location: string, compiledOutDir: string): Change[] {
  const changes: Change[] = [];
  const filesToCheck = ["CLAUDE.md", ".github/copilot-instructions.md", "AGENTS.md", "GEMINI.md"];

  // Also check for skill and agent files
  for (const skillDir of [".claude/skills", ".github/copilot/skills"]) {
    const fullDir = path.join(location, skillDir);
    if (fs.existsSync(fullDir)) {
      walkFiles(fullDir).forEach((f) => {
        filesToCheck.push(path.join(skillDir, f));
      });
    }
  }
  for (const agentDir of [".github/copilot/agents"]) {
    const fullDir = path.join(location, agentDir);
    if (fs.existsSync(fullDir)) {
      walkFiles(fullDir).forEach((f) => {
        filesToCheck.push(path.join(agentDir, f));
      });
    }
  }

  for (const file of filesToCheck) {
    const deployedPath = path.join(location, file);
    const compiledPath = path.join(compiledOutDir, file);

    if (!fs.existsSync(deployedPath)) continue;

    const deployedContent = fs.readFileSync(deployedPath, "utf-8");
    const compiledContent = fs.existsSync(compiledPath)
      ? fs.readFileSync(compiledPath, "utf-8")
      : "";

    if (deployedContent !== compiledContent) {
      // Simple line-level diff: find added lines
      const deployedLines = deployedContent.split("\n");
      const compiledLines = new Set(compiledContent.split("\n"));
      const additions = deployedLines.filter((l) => l.trim() && !compiledLines.has(l));

      if (additions.length > 0) {
        changes.push({ location, file, additions });
      }
    }
  }

  return changes;
}

/** Apply a harvested change back to loom source */
function applyChange(
  loomDir: string,
  projectName: string,
  relFile: string,
  sourcePath: string,
): void {
  // Map deployed file back to loom source location
  // Instructions files (CLAUDE.md, etc) → projects/<name>/instructions/harvested.md
  // Skills → projects/<name>/skills/<name>/SKILL.md
  const content = fs.readFileSync(sourcePath, "utf-8");

  if (
    relFile === "CLAUDE.md" ||
    relFile === ".github/copilot-instructions.md" ||
    relFile === "AGENTS.md" ||
    relFile === "GEMINI.md"
  ) {
    // Write as a harvested instruction file
    const dest = path.join(loomDir, "projects", projectName, "instructions", "harvested.md");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content, "utf-8");
  } else if (relFile.includes("/skills/")) {
    // Extract skill name and write to project skills
    const match = relFile.match(/skills\/([^/]+)/);
    if (match) {
      const skillName = match[1];
      const dest = path.join(loomDir, "projects", projectName, "skills", skillName, "SKILL.md");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content, "utf-8");
    }
  }
}

function walkFiles(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
