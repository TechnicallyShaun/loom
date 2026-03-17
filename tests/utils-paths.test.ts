import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
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

const originalCwd = process.cwd();
const originalEnv = process.env.LOOM_DIR;

function mkTmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

afterEach(() => {
  process.chdir(originalCwd);
  if (originalEnv === undefined) {
    delete process.env.LOOM_DIR;
  } else {
    process.env.LOOM_DIR = originalEnv;
  }
});

describe("defaultLoomDir", () => {
  it("returns cwd/.loom", () => {
    const tmp = mkTmp("loom-paths-default-");
    expect(defaultLoomDir(tmp)).toBe(path.join(tmp, ".loom"));
  });
});

describe("loomDir", () => {
  it("uses LOOM_DIR env var when set", () => {
    process.env.LOOM_DIR = "/tmp/custom-loom";
    expect(loomDir()).toBe("/tmp/custom-loom");
  });

  it("uses nearest existing .loom directory", () => {
    delete process.env.LOOM_DIR;
    const tmp = mkTmp("loom-paths-nearest-");
    const loom = path.join(tmp, ".loom");

    fs.mkdirSync(path.join(loom, "global"), { recursive: true });
    fs.mkdirSync(path.join(loom, "projects"), { recursive: true });
    fs.writeFileSync(path.join(loom, "config.yaml"), "projects: {}\n", "utf-8");

    const child = path.join(tmp, "a", "b");
    fs.mkdirSync(child, { recursive: true });
    process.chdir(child);

    expect(loomDir()).toBe(loom);
  });

  it("falls back to cwd/.loom when no local loom dir exists", () => {
    delete process.env.LOOM_DIR;
    const tmp = mkTmp("loom-paths-fallback-");
    process.chdir(tmp);
    expect(loomDir()).toBe(path.join(tmp, ".loom"));
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
    expect(compiledDir("/foo", "bar")).toBe(
      path.join("/foo", ".compiled", "bar"),
    );
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
