import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { init } from "../src/commands/init.js";
import { makeTempDir, cleanup } from "./helpers.js";

let tmpDir: string;
let originalEnv: string | undefined;

beforeEach(() => {
  tmpDir = makeTempDir();
  originalEnv = process.env.LOOM_DIR;
  process.env.LOOM_DIR = tmpDir;
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.LOOM_DIR;
  } else {
    process.env.LOOM_DIR = originalEnv;
  }
  cleanup(tmpDir);
});

describe("init command", () => {
  it("creates the full directory structure", async () => {
    await init([]);

    expect(fs.existsSync(path.join(tmpDir, ".git"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "global", "instructions"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "global", "skills"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "global", "agents"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "projects"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "config.yaml"))).toBe(true);
  });

  it("tracks config.yaml in git (no .gitignore excluding it)", async () => {
    await init([]);
    const gitignorePath = path.join(tmpDir, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, "utf-8");
      expect(gitignore).not.toContain("config.yaml");
    }
  });

  it("is idempotent — does not reinitialise", async () => {
    await init([]);
    // Second call should detect existing .git and bail
    await init([]);
    // Should not throw
  });
});
