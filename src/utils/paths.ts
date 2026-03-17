import fs from "node:fs";
import path from "node:path";

function isLoomRoot(dir: string): boolean {
  return (
    fs.existsSync(path.join(dir, "config.yaml")) &&
    fs.existsSync(path.join(dir, "global")) &&
    fs.existsSync(path.join(dir, "projects"))
  );
}

function findNearestLoomDir(fromDir: string): string | null {
  let current = path.resolve(fromDir);

  while (true) {
    // Support both "repo/.loom" and direct loom roots (when LOOM_DIR was set to cwd)
    const nested = path.join(current, ".loom");
    if (isLoomRoot(nested)) return nested;
    if (isLoomRoot(current)) return current;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** Default loom directory (local to current working tree) */
export function defaultLoomDir(cwd = process.cwd()): string {
  return path.join(cwd, ".loom");
}

/** Resolve loom dir — LOOM_DIR env var, then nearest local loom dir, then ./\.loom */
export function loomDir(cwd = process.cwd()): string {
  if (process.env.LOOM_DIR) return process.env.LOOM_DIR;
  return findNearestLoomDir(cwd) || defaultLoomDir(cwd);
}

/** Global source directories */
export function globalDir(base: string): string {
  return path.join(base, "global");
}

/** Project source directory */
export function projectDir(base: string, name: string): string {
  return path.join(base, "projects", name);
}

/** Compiled output directory for a project */
export function compiledDir(base: string, name: string): string {
  return path.join(base, ".compiled", name);
}

/** Config file path */
export function configPath(base: string): string {
  return path.join(base, "config.yaml");
}

/** Timestamp string for commit messages */
export function timestamp(): string {
  return new Date()
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");
}
