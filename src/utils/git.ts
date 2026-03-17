import { execSync } from "node:child_process";

export function gitCommit(loomDir: string, message: string): void {
  execSync("git add -A", { cwd: loomDir, stdio: "pipe" });
  // Check if there's anything to commit
  try {
    execSync("git diff --cached --quiet", { cwd: loomDir, stdio: "pipe" });
    // No changes staged — skip commit
    return;
  } catch {
    // Changes exist — commit them
  }
  execSync(`git commit -m ${JSON.stringify(message)}`, {
    cwd: loomDir,
    stdio: "pipe",
  });
}

export function gitInit(dir: string): void {
  execSync("git init", { cwd: dir, stdio: "pipe" });
}

export function getShortHash(loomDir: string): string {
  return execSync("git rev-parse --short HEAD", {
    cwd: loomDir,
    encoding: "utf-8",
  }).trim();
}

export function gitTag(loomDir: string, tagName: string): void {
  execSync(`git tag ${JSON.stringify(tagName)}`, {
    cwd: loomDir,
    stdio: "pipe",
  });
}
