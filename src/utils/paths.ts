import path from "node:path";

/** Default loom directory (local to current working directory) */
export function defaultLoomDir(cwd = process.cwd()): string {
  return path.join(cwd, ".loom");
}

/** Resolve loom dir — LOOM_DIR env var or ./.loom */
export function loomDir(cwd = process.cwd()): string {
  return process.env.LOOM_DIR || defaultLoomDir(cwd);
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
