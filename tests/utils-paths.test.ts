import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import {
  defaultLoomDir,
  loomDir,
  globalDir,
  projectDir,
  compiledDir,
  configPath,
  timestamp,
} from "../src/utils/paths.js";

describe("defaultLoomDir", () => {
  it("returns ~/.loom", () => {
    expect(defaultLoomDir()).toBe(path.join(os.homedir(), ".loom"));
  });
});

describe("loomDir", () => {
  const originalEnv = process.env.LOOM_DIR;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.LOOM_DIR;
    } else {
      process.env.LOOM_DIR = originalEnv;
    }
  });

  it("uses LOOM_DIR env var when set", () => {
    process.env.LOOM_DIR = "/tmp/custom-loom";
    expect(loomDir()).toBe("/tmp/custom-loom");
  });

  it("falls back to default when env var not set", () => {
    delete process.env.LOOM_DIR;
    expect(loomDir()).toBe(defaultLoomDir());
  });
});

describe("path helpers", () => {
  it("globalDir returns base/global", () => {
    expect(globalDir("/foo")).toBe("/foo/global");
  });

  it("projectDir returns base/projects/name", () => {
    expect(projectDir("/foo", "bar")).toBe("/foo/projects/bar");
  });

  it("compiledDir returns base/.compiled/name", () => {
    expect(compiledDir("/foo", "bar")).toBe("/foo/.compiled/bar");
  });

  it("configPath returns base/config.yaml", () => {
    expect(configPath("/foo")).toBe("/foo/config.yaml");
  });
});

describe("timestamp", () => {
  it("returns an ISO-like string without milliseconds or T", () => {
    const ts = timestamp();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
