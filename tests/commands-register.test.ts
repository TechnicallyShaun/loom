import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { register } from "../src/commands/register.js";
import { loadConfig } from "../src/config/loader.js";
import { setupLoomDir, makeTempDir, cleanup } from "./helpers.js";

let loomDir: string;
let projectPath: string;
let originalEnv: string | undefined;

beforeEach(() => {
  loomDir = setupLoomDir();
  projectPath = makeTempDir(); // Fake project directory
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

describe("register command", () => {
  it("adds project to config.yaml", async () => {
    await register(["anvil", projectPath]);

    const config = loadConfig(loomDir);
    expect(config.projects.anvil).toBeDefined();
    expect(config.projects.anvil.path).toBe(projectPath);
  });

  it("scaffolds project directories", async () => {
    await register(["anvil", projectPath]);

    expect(fs.existsSync(path.join(loomDir, "projects", "anvil", "instructions"))).toBe(true);
    expect(fs.existsSync(path.join(loomDir, "projects", "anvil", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(loomDir, "projects", "anvil", "agents"))).toBe(true);
  });

  it("uses config-level targets", async () => {
    await register(["anvil", projectPath]);

    const config = loadConfig(loomDir);
    // targets come from config level, not per-project
    expect(config.targets).toBeDefined();
    expect(config.projects.anvil.path).toBe(projectPath);
  });

  it("rejects non-existent paths", async () => {
    await register(["anvil", "/nonexistent/path/that/does/not/exist"]);

    const config = loadConfig(loomDir);
    expect(config.projects.anvil).toBeUndefined();
  });

  it("shows usage when args missing", async () => {
    // Should not throw
    await register([]);
  });
});
