/** Loom-neutral tool name → Claude Code tool names */
export const CLAUDE_TOOL_MAP: Record<string, string[]> = {
  read: ["Read"],
  edit: ["Write", "Edit"],
  execute: ["Bash"],
  search: ["Grep", "Glob"],
  agent: ["Agent"],
  web: ["WebSearch", "WebFetch"],
};

/** Loom-neutral tool name → Copilot tool names */
export const COPILOT_TOOL_MAP: Record<string, string[]> = {
  read: ["read"],
  edit: ["edit"],
  execute: ["execute"],
  search: ["search"],
  agent: ["agent"],
  web: ["web"],
};

/** Loom-neutral tool name → Gemini CLI tool names (supports wildcards) */
export const GEMINI_TOOL_MAP: Record<string, string[]> = {
  read: ["read"],
  edit: ["edit"],
  execute: ["execute"],
  search: ["search"],
  agent: ["agent"],
  web: ["web"],
};

/** Loom-neutral tool name → Codex CLI tool names */
export const CODEX_TOOL_MAP: Record<string, string[]> = {
  read: ["read"],
  edit: ["edit"],
  execute: ["execute"],
  search: ["search"],
  agent: ["agent"],
  web: ["web"],
};
