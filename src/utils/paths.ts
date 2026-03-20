import path from "node:path";
import os from "node:os";
import type { TargetType } from "../types/index.js";

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
  return path.join(base, "dist", name);
}

/** Compiled output directory for global (user-level) content */
export function compiledGlobalDir(base: string): string {
  return path.join(base, "dist", "_global");
}

/** User-level deploy directory for a target */
export function userLevelDir(target: TargetType, home = os.homedir()): string {
  switch (target) {
    case "claude":
      return path.join(home, ".claude");
    case "copilot":
      return path.join(home, ".copilot");
    case "gemini":
      return path.join(home, ".gemini");
    case "codex":
      return path.join(home, ".codex");
  }
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
