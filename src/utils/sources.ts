import fs from "node:fs";
import path from "node:path";
import type { SourceContent } from "../types/index.js";

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
        skills.push({
          name: entry.name,
          content: fs.readFileSync(skillFile, "utf-8").trim(),
        });
      }
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/** Read agents — each agent is a .md file */
export function readAgentsDir(dir: string): SourceContent[] {
  return readMarkdownDir(dir);
}

/** Merge two layers: project overrides global for items with the same name */
export function mergeLayers(global: SourceContent[], project: SourceContent[]): SourceContent[] {
  const projectNames = new Set(project.map((p) => p.name));
  const fromGlobal = global.filter((g) => !projectNames.has(g.name));
  return [...fromGlobal, ...project].sort((a, b) => a.name.localeCompare(b.name));
}

/** Concatenate instructions: global first, then project */
export function concatInstructions(global: SourceContent[], project: SourceContent[]): string {
  const all = [...global, ...project];
  return all.map((s) => s.content).join("\n\n---\n\n");
}

/** Recursively create directory */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
