export type TargetType = "claude" | "copilot" | "codex" | "gemini";

export interface ProjectEntry {
  path: string;
  targets: TargetType[];
}

export interface LoomConfig {
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
