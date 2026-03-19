import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { diff } from "../src/commands/diff.js";
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

  saveConfig(loomDir, {
    targets: ["claude"],
    projects: {
      anvil: { path: projectPath },
    },
  });

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

describe("diff command", () => {
  it("shows new files that would be deployed", async () => {
    writeFile(path.join(loomDir, "dist", "anvil", "CLAUDE.md"), "instructions");

    await diff(["anvil"]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("CLAUDE.md");
    expect(output).toContain("new");
  });

  it("shows modified files", async () => {
    writeFile(path.join(loomDir, "dist", "anvil", "CLAUDE.md"), "new version");
    writeFile(path.join(projectPath, "CLAUDE.md"), "old version");

    await diff(["anvil"]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("CLAUDE.md");
    expect(output).toContain("modified");
  });

  it("shows up to date when nothing changed", async () => {
    writeFile(path.join(loomDir, "dist", "anvil", "CLAUDE.md"), "same");
    writeFile(path.join(projectPath, "CLAUDE.md"), "same");

    await diff(["anvil"]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("up to date");
  });

  it("handles not-yet-compiled projects", async () => {
    await diff(["anvil"]);

    const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("not compiled yet");
  });
});
