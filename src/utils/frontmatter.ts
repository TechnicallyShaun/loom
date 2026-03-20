import { parse, stringify } from "yaml";

export interface ParsedFrontmatter {
  frontmatter: Record<string, unknown>;
  body: string;
}

/** Parse YAML frontmatter from a markdown string */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)---(?:\r?\n([\s\S]*))?$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const yaml = match[1];
  const body = (match[2] ?? "").trim();
  const frontmatter = (parse(yaml) as Record<string, unknown>) ?? {};
  return { frontmatter, body };
}

/** Reassemble frontmatter and body into a markdown string */
export function serializeFrontmatter(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const keys = Object.keys(frontmatter);
  if (keys.length === 0) return body;
  const yaml = stringify(frontmatter, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n${body}`;
}

/** Serialize a flat record to TOML format (supports strings, numbers, booleans, arrays of strings) */
export function serializeToml(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value == null) continue;
    if (typeof value === "string") {
      lines.push(`${key} = "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    } else if (typeof value === "number" || typeof value === "boolean") {
      lines.push(`${key} = ${value}`);
    } else if (Array.isArray(value)) {
      const items = value.map((v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
      lines.push(`${key} = [${items.join(", ")}]`);
    }
  }
  return lines.join("\n");
}

/** Convert hyphen-case to camelCase */
function toCamelCase(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export interface SubstitutionContext {
  /** Replacement for {skill} — native var or path */
  skill: string;
  /** Replacement for {project} — path or "." */
  project: string;
  /** Replacement for {loom} — workspace root */
  loom: string;
  /** Replacement for {args} */
  args: (text: string) => string;
  /** Replacement for {arg:name} — receives the arg name, returns target syntax */
  namedArg: (name: string, index: number) => string;
}

/**
 * Apply loom substitution variables to skill/instruction content.
 * Replaces {skill}, {project}, {loom}, {args}, {arg:name} with target-specific values.
 */
export function applySubstitutions(content: string, ctx: SubstitutionContext): string {
  let result = content;

  // Path substitutions
  result = result.replace(/\{skill\}/g, ctx.skill);
  result = result.replace(/\{project\}/g, ctx.project);
  result = result.replace(/\{loom\}/g, ctx.loom);

  // Collect named args in order of first appearance for positional mapping
  const argNames: string[] = [];
  const argPattern = /\{arg:([a-zA-Z0-9_-]+)\}/g;
  let match;
  while ((match = argPattern.exec(result)) !== null) {
    if (!argNames.includes(match[1])) {
      argNames.push(match[1]);
    }
  }

  // Replace {args}
  result = result.replace(/\{args\}/g, (_m) => ctx.args(_m));

  // Replace {arg:name} with target-specific syntax
  result = result.replace(/\{arg:([a-zA-Z0-9_-]+)\}/g, (_m, name: string) => {
    const index = argNames.indexOf(name);
    return ctx.namedArg(name, index);
  });

  // Strip {project}/ prefix that resolved to "./" → just remove the "./"
  result = result.replace(/\.\//g, (m) => {
    // Only strip "./" when it came from {project} resolution
    return m;
  });

  return result;
}

/** Build argument-hint from {arg:*} usage in content */
export function deriveArgumentHint(content: string): string | undefined {
  const args: string[] = [];
  const allArgs = /\{args\}/g.test(content);
  if (allArgs) return undefined; // {args} = freeform, no hint derivable

  const pattern = /\{arg:([a-zA-Z0-9_-]+)\}/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    if (!args.includes(match[1])) {
      args.push(match[1]);
    }
  }
  if (args.length === 0) return undefined;
  return args.map((a) => `<${a}>`).join(" ");
}

/** Create substitution context for Claude Code */
export function claudeSubstitutions(skillName: string, projectPath: string, loomRoot: string): SubstitutionContext {
  return {
    skill: "${CLAUDE_SKILL_DIR}",
    project: projectPath || ".",
    loom: loomRoot,
    args: () => "$ARGUMENTS",
    namedArg: (_name, index) => `$${index}`,
  };
}

/** Create substitution context for Copilot CLI */
export function copilotSubstitutions(skillName: string, projectPath: string, loomRoot: string): SubstitutionContext {
  return {
    skill: `.github/skills/${skillName}`,
    project: ".",
    loom: loomRoot,
    args: () => "${input:input:Provide the input}",
    namedArg: (name) => `\${input:${toCamelCase(name)}:Enter ${name}}`,
  };
}

/** Create substitution context for Gemini CLI */
export function geminiSubstitutions(skillName: string, projectPath: string, loomRoot: string): SubstitutionContext {
  return {
    skill: `.gemini/skills/${skillName}`,
    project: ".",
    loom: loomRoot,
    args: () => "$ARGUMENTS",
    namedArg: (_name, index) => `$${index}`,
  };
}

/** Create substitution context for Codex CLI */
export function codexSubstitutions(skillName: string, projectPath: string, loomRoot: string): SubstitutionContext {
  return {
    skill: `.codex/skills/${skillName}`,
    project: ".",
    loom: loomRoot,
    args: () => "$ARGUMENTS",
    namedArg: (_name, index) => `$${index + 1}`,
  };
}

/** Expand loom-neutral tool names through a target mapping */
export function mapToolNames(
  tools: string[],
  mapping: Record<string, string[]>,
): string[] {
  const result: string[] = [];
  for (const tool of tools) {
    const mapped = mapping[tool];
    if (mapped) {
      result.push(...mapped);
    } else {
      // Unknown tool names pass through (forward-compatible)
      result.push(tool);
    }
  }
  return result;
}
