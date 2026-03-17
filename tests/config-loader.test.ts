import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { loadConfig, saveConfig } from "../src/config/loader.js";
import { makeTempDir, cleanup } from "./helpers.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTempDir();
});

afterEach(() => {
  cleanup(tmpDir);
});

describe("loadConfig", () => {
  it("returns empty projects when config file does not exist", () => {
    const config = loadConfig(tmpDir);
    expect(config).toEqual({ targets: [], projects: {} });
  });

  it("parses a valid config.yaml", () => {
    fs.writeFileSync(
      path.join(tmpDir, "config.yaml"),
      `targets:
  - claude
  - copilot
projects:
  anvil:
    path: /home/user/anvil
`,
      "utf-8",
    );

    const config = loadConfig(tmpDir);
    expect(config.projects.anvil).toBeDefined();
    expect(config.projects.anvil.path).toBe("/home/user/anvil");
    expect(config.targets).toEqual(["claude", "copilot"]);
  });

  it("handles empty config file gracefully", () => {
    fs.writeFileSync(path.join(tmpDir, "config.yaml"), "", "utf-8");
    const config = loadConfig(tmpDir);
    expect(config).toEqual({ targets: [], projects: {} });
  });
});

describe("saveConfig", () => {
  it("writes config to config.yaml", () => {
    saveConfig(tmpDir, {
      targets: ["claude"],
      projects: {
        spark: {
          path: "/home/user/spark",
        },
      },
    });

    const content = fs.readFileSync(path.join(tmpDir, "config.yaml"), "utf-8");
    expect(content).toContain("spark");
    expect(content).toContain("/home/user/spark");

    // Verify round-trip
    const loaded = loadConfig(tmpDir);
    expect(loaded.projects.spark.path).toBe("/home/user/spark");
    expect(loaded.targets).toEqual(["claude"]);
  });
});
