import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { diff } from "../src/commands/diff.js";
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

describe("diff command", () => {
  it("shows new files that would be deployed", async () => {
    writeFile(path.join(loomDir, ".compiled", "anvil", "CLAUDE.md"), "instructions");

    // Should not throw — just logs output
    await diff(["anvil"]);
  });

  it("shows modified files", async () => {
    writeFile(path.join(loomDir, ".compiled", "anvil", "CLAUDE.md"), "new version");
    writeFile(path.join(projectPath, "CLAUDE.md"), "old version");

    await diff(["anvil"]);
  });

  it("shows up to date when nothing changed", async () => {
    writeFile(path.join(loomDir, ".compiled", "anvil", "CLAUDE.md"), "same");
    writeFile(path.join(projectPath, "CLAUDE.md"), "same");

    await diff(["anvil"]);
  });

  it("handles not-yet-compiled projects", async () => {
    await diff(["anvil"]); // Should not throw
  });
});
