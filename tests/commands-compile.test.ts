import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { compile } from "../src/commands/compile.js";
import { saveConfig } from "../src/config/loader.js";
import { setupLoomDir, makeTempDir, cleanup, writeFile } from "./helpers.js";

let loomDir: string;
let projectPath: string;
let originalEnv: string | undefined;

beforeEach(() => {
  loomDir = setupLoomDir();
  projectPath = makeTempDir();
  originalEnv = process.env.LOOM_DIR;
  process.env.LOOM_DIR = loomDir;

  // Register a project
  saveConfig(loomDir, {
    targets: ["claude", "copilot"],
    projects: {
      anvil: { path: projectPath },
    },
  });

  // Create project structure
  fs.mkdirSync(path.join(loomDir, "projects", "anvil", "instructions"), { recursive: true });
  fs.mkdirSync(path.join(loomDir, "projects", "anvil", "skills"), { recursive: true });
  fs.mkdirSync(path.join(loomDir, "projects", "anvil", "agents"), { recursive: true });
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.LOOM_DIR;
  } else {
    process.env.LOOM_DIR = originalEnv;
  }
  cleanup(loomDir);
  cleanup(projectPath);
});

describe("compile command", () => {
  it("compiles project instructions to CLAUDE.md", async () => {
    writeFile(
      path.join(loomDir, "projects", "anvil", "instructions", "conventions.md"),
      "# Conventions\n\nUse conventional commits.",
    );

    await compile(["anvil"]);

    const claudeMd = path.join(loomDir, "dist", "anvil", "CLAUDE.md");
    expect(fs.existsSync(claudeMd)).toBe(true);
    expect(fs.readFileSync(claudeMd, "utf-8")).toContain("Conventions");
  });

  it("global instructions do not appear in project output", async () => {
    writeFile(
      path.join(loomDir, "global", "instructions", "conventions.md"),
      "# Global Conventions",
    );
    writeFile(
      path.join(loomDir, "projects", "anvil", "instructions", "anvil-specifics.md"),
      "# Anvil Specifics",
    );

    await compile(["anvil"]);

    const claudeMd = fs.readFileSync(
      path.join(loomDir, "dist", "anvil", "CLAUDE.md"),
      "utf-8",
    );
    expect(claudeMd).not.toContain("Global Conventions");
    expect(claudeMd).toContain("Anvil Specifics");
  });

  it("compiles project skills to .claude/skills/ and .github/skills/", async () => {
    writeFile(
      path.join(loomDir, "projects", "anvil", "skills", "analyse", "SKILL.md"),
      "# Analyse\n\nDo analysis.",
    );

    await compile(["anvil"]);

    expect(
      fs.existsSync(
        path.join(loomDir, "dist", "anvil", ".claude", "skills", "analyse", "SKILL.md"),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(loomDir, "dist", "anvil", ".github", "skills", "analyse", "SKILL.md"),
      ),
    ).toBe(true);
  });

  it("global skills do not appear in project output", async () => {
    writeFile(
      path.join(loomDir, "global", "skills", "shared-skill", "SKILL.md"),
      "Global shared skill",
    );

    await compile(["anvil"]);

    expect(
      fs.existsSync(
        path.join(loomDir, "dist", "anvil", ".claude", "skills", "shared-skill", "SKILL.md"),
      ),
    ).toBe(false);
  });

  it("compiles project agents with frontmatter for Claude", async () => {
    writeFile(
      path.join(loomDir, "projects", "anvil", "agents", "work.md"),
      "# Work Agent\n\nDo work.",
    );

    await compile(["anvil"]);

    const agent = fs.readFileSync(
      path.join(loomDir, "dist", "anvil", ".claude", "agents", "work.md"),
      "utf-8",
    );
    expect(agent).toContain("Work Agent");
  });

  it("reports error for unknown project", async () => {
    await compile(["nonexistent"]); // Should not throw
  });

  it("compiles all projects when no filter given", async () => {
    // Add a second project
    const project2 = makeTempDir();
    saveConfig(loomDir, {
      targets: ["claude"],
      projects: {
        anvil: { path: projectPath },
        spark: { path: project2 },
      },
    });
    fs.mkdirSync(path.join(loomDir, "projects", "spark", "instructions"), { recursive: true });
    writeFile(
      path.join(loomDir, "projects", "anvil", "instructions", "conv.md"),
      "Anvil conventions",
    );
    writeFile(
      path.join(loomDir, "projects", "spark", "instructions", "conv.md"),
      "Spark conventions",
    );

    await compile([]);

    expect(fs.existsSync(path.join(loomDir, "dist", "anvil", "CLAUDE.md"))).toBe(true);
    expect(fs.existsSync(path.join(loomDir, "dist", "spark", "CLAUDE.md"))).toBe(true);

    cleanup(project2);
  });
});
