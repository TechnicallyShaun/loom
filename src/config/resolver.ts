import type { LoomConfig } from "../types/index.js";

export async function resolveConfig(): Promise<LoomConfig> {
  // TODO: Walk up from cwd to find .loom/, merge with global ~/.loom/
  throw new Error("Config resolution not yet implemented");
}
