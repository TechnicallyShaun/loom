import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { deploy } from "../src/commands/deploy.js";
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
    targets: ["claude", "copilot"],
    projects: {
      anvil: { path: projectPath },
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

describe("deploy command", () => {
  it("copies compiled output to project path", async () => {
    // Create compiled output
    writeFile(path.join(loomDir, "dist", "anvil", "CLAUDE.md"), "# Instructions\n");
    writeFile(
      path.join(loomDir, "dist", "anvil", ".claude", "skills", "analyse", "SKILL.md"),
      "# Analyse\n",
    );
    writeFile(
      path.join(loomDir, "dist", "anvil", ".github", "copilot-instructions.md"),
      "# Instructions\n",
    );

    await deploy(["anvil"]);

    expect(fs.existsSync(path.join(projectPath, "CLAUDE.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, ".claude", "skills", "analyse", "SKILL.md"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(projectPath, ".github", "copilot-instructions.md"))).toBe(true);
  });

  it("creates deploy log entry", async () => {
    writeFile(path.join(loomDir, "dist", "anvil", "CLAUDE.md"), "test");

    await deploy(["anvil"]);

    const logPath = path.join(loomDir, ".deploy-log");
    expect(fs.existsSync(logPath)).toBe(true);
    const log = fs.readFileSync(logPath, "utf-8");
    expect(log).toContain("anvil");
  });

  it("skips projects that are not compiled", async () => {
    await deploy(["anvil"]); // Should not throw, just print message
  });
});
