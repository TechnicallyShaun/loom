import fs from "node:fs";
import { parse, stringify } from "yaml";
import type { LoomConfig } from "../types/index.js";
import { configPath } from "../utils/paths.js";

export function loadConfig(loomDir: string): LoomConfig {
  const cp = configPath(loomDir);
  if (!fs.existsSync(cp)) {
    return { projects: {} };
  }
  const raw = fs.readFileSync(cp, "utf-8");
  const parsed = parse(raw);
  return { projects: parsed?.projects ?? {} };
}

export function saveConfig(loomDir: string, config: LoomConfig): void {
  const cp = configPath(loomDir);
  fs.writeFileSync(cp, stringify(config), "utf-8");
}
