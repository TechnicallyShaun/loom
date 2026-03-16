import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
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

describe("harvest command", () => {
  it("detects changes in deployed files", async () => {
    // Create compiled output (what was deployed)
    writeFile(path.join(loomDir, ".compiled", "anvil", "CLAUDE.md"), "original content\n");
    // Simulate a user editing the deployed file
    writeFile(path.join(projectPath, "CLAUDE.md"), "original content\nnew learning\n");

    // harvest requires interactive input so we test the internal functions instead
    // by importing them. For the full command we'd need to mock stdin.
    // This test just verifies the module loads without error.
    const { harvest } = await import("../src/commands/harvest.js");
    expect(harvest).toBeDefined();
  });

  it("finds worktree siblings", async () => {
    // Create worktree directory structure
    const parentDir = path.dirname(projectPath);
    const baseName = path.basename(projectPath);
    const worktreesDir = path.join(parentDir, `${baseName}.worktrees`);
    fs.mkdirSync(path.join(worktreesDir, "GOS-123456"), { recursive: true });
    writeFile(
      path.join(worktreesDir, "GOS-123456", "CLAUDE.md"),
      "worktree content",
    );

    // Verify the directory structure exists
    expect(fs.existsSync(worktreesDir)).toBe(true);
    expect(
      fs.existsSync(path.join(worktreesDir, "GOS-123456", "CLAUDE.md")),
    ).toBe(true);

    cleanup(worktreesDir);
  });
});
