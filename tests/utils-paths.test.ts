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

const originalEnv = process.env.LOOM_DIR;

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.LOOM_DIR;
  } else {
    process.env.LOOM_DIR = originalEnv;
  }
});

describe("defaultLoomDir", () => {
  it("returns cwd/.loom by default", () => {
    expect(defaultLoomDir()).toBe(path.join(process.cwd(), ".loom"));
  });

  it("returns custom cwd/.loom when cwd provided", () => {
    expect(defaultLoomDir("/tmp/myproject")).toBe(path.join("/tmp/myproject", ".loom"));
  });
});

describe("loomDir", () => {
  it("uses LOOM_DIR env var when set", () => {
    process.env.LOOM_DIR = "/tmp/custom-loom";
    expect(loomDir()).toBe("/tmp/custom-loom");
  });

  it("falls back to cwd/.loom when LOOM_DIR not set", () => {
    delete process.env.LOOM_DIR;
    expect(loomDir()).toBe(path.join(process.cwd(), ".loom"));
  });
});

describe("path helpers", () => {
  it("globalDir returns base/global", () => {
    expect(globalDir("/foo")).toBe(path.join("/foo", "global"));
  });

  it("projectDir returns base/projects/name", () => {
    expect(projectDir("/foo", "bar")).toBe(path.join("/foo", "projects", "bar"));
  });

  it("compiledDir returns base/.compiled/name", () => {
    expect(compiledDir("/foo", "bar")).toBe(path.join("/foo", ".compiled", "bar"));
  });

  it("configPath returns base/config.yaml", () => {
    expect(configPath("/foo")).toBe(path.join("/foo", "config.yaml"));
  });
});

describe("timestamp", () => {
  it("returns an ISO-like string without milliseconds or T", () => {
    const ts = timestamp();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
