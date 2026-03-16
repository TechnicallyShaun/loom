import path from "node:path";
import os from "node:os";

/** Default loom home directory */
export function defaultLoomDir(): string {
  return path.join(os.homedir(), ".loom");
}

/** Resolve loom dir — uses LOOM_DIR env var or defaults to ~/.loom */
export function loomDir(): string {
  return process.env.LOOM_DIR || defaultLoomDir();
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
