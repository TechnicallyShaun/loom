export type TargetType = "claude" | "copilot" | "codex" | "gemini";

export const VALID_TARGETS: TargetType[] = ["claude", "copilot", "codex", "gemini"];
export const USER_LEVEL_TARGETS: TargetType[] = ["claude", "copilot", "gemini", "codex"];

export interface ProjectEntry {
  path: string;
}

export interface LoomConfig {
  targets: TargetType[];
  projects: Record<string, ProjectEntry>;
}

export interface AssetFile {
  /** Path relative to the skill directory (e.g. "trac.ts" or "scripts/validate.sh") */
  relativePath: string;
  content: Buffer;
}

export interface SourceContent {
  name: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  /** Supporting files alongside SKILL.md (scripts, references, etc.) */
  assets?: AssetFile[];
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
  content: string | Buffer;
}

export interface CompiledProject {
  name: string;
  targets: TargetType[];
  files: CompiledFile[];
}
