import fs from "node:fs";
import { parse, stringify } from "yaml";
import type { LoomConfig, TargetType } from "../types/index.js";
import { VALID_TARGETS } from "../types/index.js";
import { configPath } from "../utils/paths.js";

export function loadConfig(loomDir: string): LoomConfig {
  const cp = configPath(loomDir);
  if (!fs.existsSync(cp)) {
    return { targets: [], projects: {} };
  }
  const raw = fs.readFileSync(cp, "utf-8");
  const parsed = parse(raw);
  return {
    targets: parsed?.targets ?? [],
    projects: parsed?.projects ?? {},
  };
}

export function saveConfig(loomDir: string, config: LoomConfig): void {
  const cp = configPath(loomDir);
  fs.writeFileSync(cp, stringify(config), "utf-8");
}

/** Validate that targets exist and are recognised. Throws with a helpful message if not. */
export function validateTargets(config: LoomConfig): void {
  if (!config.targets || config.targets.length === 0) {
    throw new Error(
      `No targets defined in config.yaml.\n\n` +
        `Add a targets list to your config.yaml:\n\n` +
        `  targets:\n` +
        VALID_TARGETS.map((t) => `    - ${t}`).join("\n") +
        `\n\n` +
        `Then run compile again.`,
    );
  }

  const invalid = config.targets.filter((t: string) => !VALID_TARGETS.includes(t as TargetType));
  if (invalid.length > 0) {
    throw new Error(
      `Unknown target(s): ${invalid.join(", ")}\n` + `Valid targets: ${VALID_TARGETS.join(", ")}`,
    );
  }
}
