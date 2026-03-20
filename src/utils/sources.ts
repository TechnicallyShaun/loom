import fs from "node:fs";
import path from "node:path";
import type { SourceContent } from "../types/index.js";
import { parseFrontmatter } from "./frontmatter.js";

/** Read all .md files from a directory, sorted by name */
export function readMarkdownDir(dir: string): SourceContent[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files.map((f) => ({
    name: path.basename(f, ".md"),
    content: fs.readFileSync(path.join(dir, f), "utf-8").trim(),
  }));
}

/** Read skills — each skill is a folder with SKILL.md inside */
export function readSkillsDir(dir: string): SourceContent[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const skills: SourceContent[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(dir, entry.name, "SKILL.md");
      if (fs.existsSync(skillFile)) {
        const raw = fs.readFileSync(skillFile, "utf-8").trim();
        const { frontmatter, body } = parseFrontmatter(raw);
        skills.push({ name: entry.name, content: body, frontmatter });
      }
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/** Read agents — each agent is a .md file (with frontmatter parsing) */
export function readAgentsDir(dir: string): SourceContent[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8").trim();
    const { frontmatter, body } = parseFrontmatter(raw);
    return { name: path.basename(f, ".md"), content: body, frontmatter };
  });
}

/** Merge two layers: project overrides global for items with the same name */
export function mergeLayers(global: SourceContent[], project: SourceContent[]): SourceContent[] {
  const projectNames = new Set(project.map((p) => p.name));
  const fromGlobal = global.filter((g) => !projectNames.has(g.name));
  return [...fromGlobal, ...project].sort((a, b) => a.name.localeCompare(b.name));
}

/** Demote all markdown headings by one level (# → ##, ## → ###, etc.) */
export function demoteHeadings(content: string): string {
  return content.replace(/^(#{1,5})\s/gm, "$1# ");
}

/** Derive a section title from a filename (strip numeric prefix, convert hyphens) */
function sectionTitle(name: string): string {
  return name
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Concatenate instructions: global first, then project, with heading demotion */
export function concatInstructions(global: SourceContent[], project: SourceContent[]): string {
  const all = [...global, ...project];
  if (all.length === 0) return "";

  const sections = all.map((s) => {
    const demoted = demoteHeadings(s.content);
    // If content already starts with a heading (now demoted to ##+), use it as-is
    if (/^##/.test(demoted)) return demoted;
    // Otherwise derive a section title from the filename
    return `## ${sectionTitle(s.name)}\n\n${demoted}`;
  });

  return `# Instructions\n\n${sections.join("\n\n---\n\n")}`;
}

/** Recursively create directory */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/** Recursively walk a directory, returning relative file paths */
export function walkDir(dir: string, prefix = ""): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(path.join(dir, entry.name), rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}
