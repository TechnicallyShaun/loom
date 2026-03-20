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
