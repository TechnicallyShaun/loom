import type { LoomConfig } from "../types/index.js";

export async function loadConfig(configPath: string): Promise<LoomConfig> {
  // TODO: Read and parse .loom/config.yaml
  throw new Error(`Config loading not yet implemented: ${configPath}`);
}
