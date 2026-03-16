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
    expect(config).toEqual({ projects: {} });
  });

  it("parses a valid config.yaml", () => {
    fs.writeFileSync(
      path.join(tmpDir, "config.yaml"),
      `projects:
  anvil:
    path: /home/user/anvil
    targets:
      - claude
      - copilot
`,
      "utf-8",
    );

    const config = loadConfig(tmpDir);
    expect(config.projects.anvil).toBeDefined();
    expect(config.projects.anvil.path).toBe("/home/user/anvil");
    expect(config.projects.anvil.targets).toEqual(["claude", "copilot"]);
  });

  it("handles empty config file gracefully", () => {
    fs.writeFileSync(path.join(tmpDir, "config.yaml"), "", "utf-8");
    const config = loadConfig(tmpDir);
    expect(config).toEqual({ projects: {} });
  });
});

describe("saveConfig", () => {
  it("writes config to config.yaml", () => {
    saveConfig(tmpDir, {
      projects: {
        spark: {
          path: "/home/user/spark",
          targets: ["claude"],
        },
      },
    });

    const content = fs.readFileSync(path.join(tmpDir, "config.yaml"), "utf-8");
    expect(content).toContain("spark");
    expect(content).toContain("/home/user/spark");

    // Verify round-trip
    const loaded = loadConfig(tmpDir);
    expect(loaded.projects.spark.path).toBe("/home/user/spark");
    expect(loaded.projects.spark.targets).toEqual(["claude"]);
  });
});
