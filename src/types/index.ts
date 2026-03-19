export type TargetType = "claude" | "copilot" | "codex" | "gemini";

export const VALID_TARGETS: TargetType[] = ["claude", "copilot", "codex", "gemini"];
export const USER_LEVEL_TARGETS: TargetType[] = ["claude", "copilot"];

export interface ProjectEntry {
  path: string;
}

export interface LoomConfig {
  targets: TargetType[];
  projects: Record<string, ProjectEntry>;
}

export interface SourceContent {
  name: string;
  content: string;
}

export interface MergedProject {
  name: string;
  targets: TargetType[];
  projectPath: string;
  instructions: string;
  skills: SourceContent[];
  agents: SourceContent[];
}

export interface CompiledFile {
  relativePath: string;
  content: string;
}

export interface CompiledProject {
  name: string;
  targets: TargetType[];
  files: CompiledFile[];
}
