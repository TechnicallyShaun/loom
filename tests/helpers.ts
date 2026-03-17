import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

/** Create a temp directory for testing and return its path */
export function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "loom-test-"));
}

/** Set up a fake loom directory with git init */
export function setupLoomDir(): string {
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, "global", "instructions"), { recursive: true });
  fs.mkdirSync(path.join(dir, "global", "skills"), { recursive: true });
  fs.mkdirSync(path.join(dir, "global", "agents"), { recursive: true });
  fs.mkdirSync(path.join(dir, "projects"), { recursive: true });
  fs.writeFileSync(path.join(dir, "config.yaml"), "targets:\n  - claude\n  - copilot\n  - codex\n  - gemini\nprojects: {}\n", "utf-8");
  fs.writeFileSync(path.join(dir, ".gitignore"), "config.yaml\n.compiled/\n", "utf-8");
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync("git add -A", { cwd: dir, stdio: "pipe" });
  execSync('git commit -m "init"', { cwd: dir, stdio: "pipe" });
  return dir;
}

/** Set up a fake project target directory */
export function setupProjectDir(): string {
  const dir = makeTempDir();
  return dir;
}

/** Clean up a temp directory */
export function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Write content to a path, creating parent dirs */
export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}
