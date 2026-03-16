import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import {
  readMarkdownDir,
  readSkillsDir,
  readAgentsDir,
  mergeLayers,
  concatInstructions,
  ensureDir,
} from "../src/utils/sources.js";
import { makeTempDir, cleanup, writeFile } from "./helpers.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTempDir();
});

afterEach(() => {
  cleanup(tmpDir);
});

describe("readMarkdownDir", () => {
  it("returns empty array for non-existent directory", () => {
    expect(readMarkdownDir(path.join(tmpDir, "nope"))).toEqual([]);
  });

  it("reads and sorts .md files", () => {
    writeFile(path.join(tmpDir, "b.md"), "bravo");
    writeFile(path.join(tmpDir, "a.md"), "alpha");
    writeFile(path.join(tmpDir, "c.txt"), "ignored");

    const result = readMarkdownDir(tmpDir);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "a", content: "alpha" });
    expect(result[1]).toEqual({ name: "b", content: "bravo" });
  });

  it("trims whitespace from content", () => {
    writeFile(path.join(tmpDir, "x.md"), "  hello  \n\n");
    const result = readMarkdownDir(tmpDir);
    expect(result[0].content).toBe("hello");
  });
});

describe("readSkillsDir", () => {
  it("returns empty array for non-existent directory", () => {
    expect(readSkillsDir(path.join(tmpDir, "nope"))).toEqual([]);
  });

  it("reads SKILL.md from subdirectories", () => {
    writeFile(path.join(tmpDir, "analyse", "SKILL.md"), "analyse skill");
    writeFile(path.join(tmpDir, "cleansing", "SKILL.md"), "cleansing skill");
    // A directory without SKILL.md should be skipped
    ensureDir(path.join(tmpDir, "empty-dir"));

    const result = readSkillsDir(tmpDir);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "analyse", content: "analyse skill" });
    expect(result[1]).toEqual({ name: "cleansing", content: "cleansing skill" });
  });
});

describe("readAgentsDir", () => {
  it("reads .md files as agents", () => {
    writeFile(path.join(tmpDir, "work.md"), "work agent");
    const result = readAgentsDir(tmpDir);
    expect(result).toEqual([{ name: "work", content: "work agent" }]);
  });
});

describe("mergeLayers", () => {
  it("returns global items when no project items", () => {
    const global = [{ name: "a", content: "global-a" }];
    const result = mergeLayers(global, []);
    expect(result).toEqual([{ name: "a", content: "global-a" }]);
  });

  it("project overrides global for same name", () => {
    const global = [
      { name: "a", content: "global-a" },
      { name: "b", content: "global-b" },
    ];
    const project = [{ name: "a", content: "project-a" }];
    const result = mergeLayers(global, project);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.name === "a")?.content).toBe("project-a");
    expect(result.find((r) => r.name === "b")?.content).toBe("global-b");
  });

  it("includes project-only items", () => {
    const global = [{ name: "a", content: "global-a" }];
    const project = [{ name: "z", content: "project-z" }];
    const result = mergeLayers(global, project);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["a", "z"]);
  });
});

describe("concatInstructions", () => {
  it("concatenates global then project with separator", () => {
    const global = [{ name: "a", content: "global stuff" }];
    const project = [{ name: "b", content: "project stuff" }];
    const result = concatInstructions(global, project);
    expect(result).toBe("global stuff\n\n---\n\nproject stuff");
  });

  it("handles empty arrays", () => {
    expect(concatInstructions([], [])).toBe("");
  });

  it("handles global-only", () => {
    const global = [{ name: "a", content: "only global" }];
    expect(concatInstructions(global, [])).toBe("only global");
  });
});

describe("ensureDir", () => {
  it("creates nested directories", () => {
    const deep = path.join(tmpDir, "a", "b", "c");
    ensureDir(deep);
    expect(() => ensureDir(deep)).not.toThrow(); // idempotent
  });
});
