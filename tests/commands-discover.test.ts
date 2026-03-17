import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { discover } from "../src/commands/discover.js";
import { saveConfig } from "../src/config/loader.js";
import { setupLoomDir, makeTempDir, cleanup, writeFile } from "./helpers.js";

let loomDir: string;
let projectPath: string;
let originalEnv: string | undefined;
let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  loomDir = setupLoomDir();
  projectPath = makeTempDir();
  originalEnv = process.env.LOOM_DIR;
  process.env.LOOM_DIR = loomDir;

  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.LOOM_DIR;
  } else {
    process.env.LOOM_DIR = originalEnv;
  }
  logSpy.mockRestore();
  cleanup(loomDir);
  cleanup(projectPath);
});

describe("discover command", () => {
  it("shows registered projects", async () => {
    saveConfig(loomDir, {
      targets: ["claude", "copilot"],
      projects: {
        anvil: { path: projectPath },
      },
    });

    await discover([]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("anvil");
    expect(output).toContain("claude, copilot");
    expect(output).toContain("1 project(s) registered");
  });

  it("shows message when no projects registered", async () => {
    await discover([]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("No projects registered");
  });

  it("shows compiled status", async () => {
    saveConfig(loomDir, {
      targets: ["claude"],
      projects: {
        anvil: { path: projectPath },
      },
    });
    writeFile(path.join(loomDir, ".compiled", "anvil", "CLAUDE.md"), "test");

    await discover([]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Compiled: yes");
  });
});
