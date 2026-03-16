import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { discover } from "../src/commands/discover.js";
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

describe("discover command", () => {
  it("shows registered projects", async () => {
    saveConfig(loomDir, {
      projects: {
        anvil: { path: projectPath, targets: ["claude", "copilot"] },
      },
    });

    // Should not throw
    await discover([]);
  });

  it("shows message when no projects registered", async () => {
    await discover([]);
  });

  it("shows compiled status", async () => {
    saveConfig(loomDir, {
      projects: {
        anvil: { path: projectPath, targets: ["claude"] },
      },
    });
    writeFile(path.join(loomDir, ".compiled", "anvil", "CLAUDE.md"), "test");

    await discover([]);
  });
});
