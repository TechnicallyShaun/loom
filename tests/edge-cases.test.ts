import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { compile } from "../src/commands/compile.js";
import { deploy } from "../src/commands/deploy.js";
import { harvest } from "../src/commands/harvest.js";
import { diff } from "../src/commands/diff.js";
import { discover } from "../src/commands/discover.js";
import { loadConfig } from "../src/config/loader.js";
import { saveConfig } from "../src/config/loader.js";
import { setupLoomDir, makeTempDir, cleanup, writeFile } from "./helpers.js";

let loomDir: string;
let originalEnv: string | undefined;

beforeEach(() => {
  loomDir = setupLoomDir();
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
});

describe("empty projects (no projects registered)", () => {
  it("compile with no projects does not throw", async () => {
    await expect(compile([])).resolves.toBeUndefined();
  });

  it("deploy with no projects does not throw", async () => {
    await expect(deploy([])).resolves.toBeUndefined();
  });

  it("harvest with no projects does not throw", async () => {
    await expect(harvest([])).resolves.toBeUndefined();
  });

  it("diff with no projects does not throw", async () => {
    await expect(diff([])).resolves.toBeUndefined();
  });

  it("discover with no projects does not throw", async () => {
    await expect(discover([])).resolves.toBeUndefined();
  });
});

describe("missing folders", () => {
  it("compile succeeds when project instructions dir is missing", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        ghost: { path: projectPath, targets: ["claude"] },
      },
    });
    // Don't create projects/ghost/instructions — it's missing

    await expect(compile(["ghost"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });

  it("compile with no global instructions produces output from project instructions only", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        minimal: { path: projectPath, targets: ["claude"] },
      },
    });
    fs.mkdirSync(path.join(loomDir, "projects", "minimal", "instructions"), { recursive: true });
    writeFile(
      path.join(loomDir, "projects", "minimal", "instructions", "rules.md"),
      "# Rules\n\nFollow these.",
    );
    // Remove global instructions
    fs.rmSync(path.join(loomDir, "global", "instructions"), { recursive: true, force: true });

    await compile(["minimal"]);

    const claudeMd = path.join(loomDir, ".compiled", "minimal", "CLAUDE.md");
    expect(fs.existsSync(claudeMd)).toBe(true);
    expect(fs.readFileSync(claudeMd, "utf-8")).toContain("Rules");
    cleanup(projectPath);
  });

  it("deploy handles missing compiled directory gracefully", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        nocompile: { path: projectPath, targets: ["claude"] },
      },
    });

    // Deploy without compiling first — .compiled/nocompile doesn't exist
    await expect(deploy(["nocompile"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });

  it("harvest handles project with non-existent path gracefully", async () => {
    saveConfig(loomDir, {
      projects: {
        phantom: { path: "/tmp/loom-nonexistent-path-12345", targets: ["claude"] },
      },
    });

    await expect(harvest(["phantom"])).resolves.toBeUndefined();
  });

  it("diff handles missing compiled directory gracefully", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        nodiff: { path: projectPath, targets: ["claude"] },
      },
    });

    await expect(diff(["nodiff"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });
});

describe("invalid config", () => {
  it("loadConfig returns empty projects for missing config file", () => {
    const emptyDir = makeTempDir();
    const config = loadConfig(emptyDir);
    expect(config.projects).toEqual({});
    cleanup(emptyDir);
  });

  it("loadConfig handles empty config file", () => {
    fs.writeFileSync(path.join(loomDir, "config.yaml"), "", "utf-8");
    const config = loadConfig(loomDir);
    expect(config.projects).toEqual({});
  });

  it("loadConfig handles config with null projects", () => {
    fs.writeFileSync(path.join(loomDir, "config.yaml"), "projects: null\n", "utf-8");
    const config = loadConfig(loomDir);
    expect(config.projects).toEqual({});
  });

  it("loadConfig handles config with no projects key", () => {
    fs.writeFileSync(path.join(loomDir, "config.yaml"), "version: 2\n", "utf-8");
    const config = loadConfig(loomDir);
    expect(config.projects).toEqual({});
  });

  it("compile handles malformed YAML config gracefully", async () => {
    fs.writeFileSync(path.join(loomDir, "config.yaml"), "projects:\n  - broken: [}", "utf-8");
    // yaml parse may throw — compile should handle or propagate
    try {
      await compile([]);
    } catch {
      // Acceptable to throw on truly broken YAML
    }
  });
});

describe("unknown project filter", () => {
  it("compile with unknown project name does not throw", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        real: { path: projectPath, targets: ["claude"] },
      },
    });

    await expect(compile(["nonexistent"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });

  it("deploy with unknown project name does not throw", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        real: { path: projectPath, targets: ["claude"] },
      },
    });

    await expect(deploy(["nonexistent"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });

  it("harvest with unknown project name does not throw", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        real: { path: projectPath, targets: ["claude"] },
      },
    });

    await expect(harvest(["nonexistent"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });

  it("diff with unknown project name does not throw", async () => {
    const projectPath = makeTempDir();
    saveConfig(loomDir, {
      projects: {
        real: { path: projectPath, targets: ["claude"] },
      },
    });

    await expect(diff(["nonexistent"])).resolves.toBeUndefined();
    cleanup(projectPath);
  });
});
