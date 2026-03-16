import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { saveConfig } from "../src/config/loader.js";
import { findLocations, diffLocation } from "../src/commands/harvest.js";
import { setupLoomDir, makeTempDir, cleanup, writeFile } from "./helpers.js";

let loomDir: string;
let projectPath: string;
let originalEnv: string | undefined;

beforeEach(() => {
  loomDir = setupLoomDir();
  projectPath = makeTempDir();
  originalEnv = process.env.LOOM_DIR;
  process.env.LOOM_DIR = loomDir;

  saveConfig(loomDir, {
    projects: {
      anvil: { path: projectPath, targets: ["claude"] },
    },
  });
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

describe("findLocations", () => {
  it("returns project path when no worktrees exist", () => {
    const locations = findLocations(projectPath, "anvil");
    expect(locations).toEqual([projectPath]);
  });

  it("finds worktree siblings", () => {
    const parentDir = path.dirname(projectPath);
    const baseName = path.basename(projectPath);
    const worktreesDir = path.join(parentDir, `${baseName}.worktrees`);
    fs.mkdirSync(path.join(worktreesDir, "GOS-123456"), { recursive: true });
    fs.mkdirSync(path.join(worktreesDir, "GOS-789012"), { recursive: true });

    const locations = findLocations(projectPath, "anvil");
    expect(locations).toHaveLength(3);
    expect(locations[0]).toBe(projectPath);
    expect(locations).toContainEqual(path.join(worktreesDir, "GOS-123456"));
    expect(locations).toContainEqual(path.join(worktreesDir, "GOS-789012"));

    cleanup(worktreesDir);
  });

  it("ignores files in worktrees dir (only directories)", () => {
    const parentDir = path.dirname(projectPath);
    const baseName = path.basename(projectPath);
    const worktreesDir = path.join(parentDir, `${baseName}.worktrees`);
    fs.mkdirSync(worktreesDir, { recursive: true });
    fs.writeFileSync(path.join(worktreesDir, "some-file.txt"), "not a worktree");

    const locations = findLocations(projectPath, "anvil");
    expect(locations).toEqual([projectPath]);

    cleanup(worktreesDir);
  });
});

describe("diffLocation", () => {
  let compiledDir: string;

  beforeEach(() => {
    compiledDir = makeTempDir();
  });

  afterEach(() => {
    cleanup(compiledDir);
  });

  it("detects new lines added to CLAUDE.md", () => {
    writeFile(path.join(compiledDir, "CLAUDE.md"), "# Instructions\n\nOriginal content.");
    writeFile(
      path.join(projectPath, "CLAUDE.md"),
      "# Instructions\n\nOriginal content.\nNew learning from development.",
    );

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(1);
    expect(changes[0].file).toBe("CLAUDE.md");
    expect(changes[0].additions).toContain("New learning from development.");
  });

  it("returns empty when files are identical", () => {
    const content = "# Instructions\n\nSame content.";
    writeFile(path.join(compiledDir, "CLAUDE.md"), content);
    writeFile(path.join(projectPath, "CLAUDE.md"), content);

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(0);
  });

  it("returns empty when no deployed files exist", () => {
    writeFile(path.join(compiledDir, "CLAUDE.md"), "compiled content");
    // No CLAUDE.md in projectPath

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(0);
  });

  it("detects changes in skill files", () => {
    writeFile(
      path.join(compiledDir, ".claude", "skills", "analyse", "SKILL.md"),
      "# Analyse\n\nOriginal.",
    );
    writeFile(
      path.join(projectPath, ".claude", "skills", "analyse", "SKILL.md"),
      "# Analyse\n\nOriginal.\nNew tip: always check cross-project impact.",
    );

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(1);
    expect(changes[0].file).toContain("analyse");
    expect(changes[0].additions).toContain("New tip: always check cross-project impact.");
  });

  it("detects changes in agent files", () => {
    writeFile(path.join(compiledDir, ".claude", "agents", "work.md"), "# Work Agent\n\nDo work.");
    writeFile(
      path.join(projectPath, ".claude", "agents", "work.md"),
      "# Work Agent\n\nDo work.\nAlways run tests before committing.",
    );

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(1);
    expect(changes[0].additions).toContain("Always run tests before committing.");
  });

  it("detects changes in copilot instruction files", () => {
    writeFile(
      path.join(compiledDir, ".github", "copilot-instructions.md"),
      "# Copilot Instructions",
    );
    writeFile(
      path.join(projectPath, ".github", "copilot-instructions.md"),
      "# Copilot Instructions\nNew copilot-specific rule.",
    );

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(1);
    expect(changes[0].file).toBe(".github/copilot-instructions.md");
  });

  it("handles completely new file not in compiled output", () => {
    // A file exists in the deployed location but not in compiled output
    // This means the compiled output never produced it — it was added manually
    writeFile(path.join(projectPath, "CLAUDE.md"), "Manually created content");

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(1);
    expect(changes[0].additions.length).toBeGreaterThan(0);
  });

  it("detects changes across multiple files simultaneously", () => {
    writeFile(path.join(compiledDir, "CLAUDE.md"), "original");
    writeFile(path.join(compiledDir, "AGENTS.md"), "original");
    writeFile(path.join(projectPath, "CLAUDE.md"), "original\nnew claude line");
    writeFile(path.join(projectPath, "AGENTS.md"), "original\nnew agents line");

    const changes = diffLocation(projectPath, compiledDir);
    expect(changes).toHaveLength(2);
  });
});

describe("harvest worktree scenarios", () => {
  it("detects changes in a worktree that differ from compiled output", () => {
    // Simulate: loom compiled and deployed CLAUDE.md, then user created a worktree
    // and modified CLAUDE.md in the worktree
    const parentDir = path.dirname(projectPath);
    const baseName = path.basename(projectPath);
    const worktreesDir = path.join(parentDir, `${baseName}.worktrees`);
    const worktreePath = path.join(worktreesDir, "GOS-123456");

    // Compiled output (the source of truth for diffing)
    const compiledDir = path.join(loomDir, ".compiled", "anvil");
    writeFile(path.join(compiledDir, "CLAUDE.md"), "# Instructions\n\nOriginal from loom.");

    // Main checkout (unchanged — it's a stale deploy target)
    writeFile(path.join(projectPath, "CLAUDE.md"), "# Instructions\n\nOriginal from loom.");

    // Worktree (modified by developer during work)
    writeFile(
      path.join(worktreePath, "CLAUDE.md"),
      "# Instructions\n\nOriginal from loom.\nLearned: always validate DTOs after mapping.",
    );

    // Find all locations
    const locations = findLocations(projectPath, "anvil");
    expect(locations).toHaveLength(2);

    // Diff each location
    const mainChanges = diffLocation(projectPath, compiledDir);
    expect(mainChanges).toHaveLength(0); // main checkout unchanged

    const worktreeChanges = diffLocation(worktreePath, compiledDir);
    expect(worktreeChanges).toHaveLength(1);
    expect(worktreeChanges[0].additions).toContain("Learned: always validate DTOs after mapping.");

    cleanup(worktreesDir);
  });

  it("detects changes in multiple worktrees independently", () => {
    const parentDir = path.dirname(projectPath);
    const baseName = path.basename(projectPath);
    const worktreesDir = path.join(parentDir, `${baseName}.worktrees`);
    const wt1 = path.join(worktreesDir, "GOS-111");
    const wt2 = path.join(worktreesDir, "GOS-222");

    const compiledDir = path.join(loomDir, ".compiled", "anvil");
    writeFile(path.join(compiledDir, "CLAUDE.md"), "original");

    writeFile(path.join(wt1, "CLAUDE.md"), "original\nlearning from ticket 111");
    writeFile(path.join(wt2, "CLAUDE.md"), "original\nlearning from ticket 222");

    const changes1 = diffLocation(wt1, compiledDir);
    const changes2 = diffLocation(wt2, compiledDir);

    expect(changes1).toHaveLength(1);
    expect(changes1[0].additions).toContain("learning from ticket 111");
    expect(changes2).toHaveLength(1);
    expect(changes2[0].additions).toContain("learning from ticket 222");

    cleanup(worktreesDir);
  });
});
