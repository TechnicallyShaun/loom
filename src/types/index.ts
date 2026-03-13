export interface LoomConfig {
  targets: TargetConfig[];
  projects: ProjectConfig[];
  skills: string[]; // glob patterns for skill discovery
}

export interface TargetConfig {
  name: string;
  type: TargetType;
  globalPath?: string;
  repoPath?: string;
  enabled: boolean;
}

export type TargetType = "claude" | "copilot" | "codex" | "gemini" | "cursor";

export interface ProjectConfig {
  path: string;
  targets: string[]; // target names enabled for this project
}

export interface Skill {
  name: string;
  filePath: string;
  content: string;
}

export interface CompiledOutput {
  targetType: TargetType;
  fileName: string;
  content: string;
}
