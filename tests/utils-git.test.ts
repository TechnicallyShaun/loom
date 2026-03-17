import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { gitInit, gitCommit, getShortHash } from "../src/utils/git.js";
import { makeTempDir, cleanup } from "./helpers.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTempDir();
});

afterEach(() => {
  cleanup(tmpDir);
});

describe("gitInit", () => {
  it("initialises a git repository", () => {
    gitInit(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, ".git"))).toBe(true);
  });
});

describe("gitCommit", () => {
  it("creates a commit when there are staged changes", () => {
    gitInit(tmpDir);
    fs.writeFileSync(path.join(tmpDir, "test.txt"), "hello", "utf-8");
    gitCommit(tmpDir, "test commit");

    const log = execSync("git log --oneline", { cwd: tmpDir, encoding: "utf-8" });
    expect(log).toContain("test commit");
  });

  it("skips commit when nothing to commit", () => {
    gitInit(tmpDir);
    fs.writeFileSync(path.join(tmpDir, "test.txt"), "hello", "utf-8");
    gitCommit(tmpDir, "first");
    // Second commit with no changes should not throw
    gitCommit(tmpDir, "second");

    const log = execSync("git log --oneline", { cwd: tmpDir, encoding: "utf-8" });
    expect(log.trim().split("\n")).toHaveLength(1);
  });
});

describe("getShortHash", () => {
  it("returns a short git hash", () => {
    gitInit(tmpDir);
    fs.writeFileSync(path.join(tmpDir, "test.txt"), "hello", "utf-8");
    gitCommit(tmpDir, "initial");

    const hash = getShortHash(tmpDir);
    expect(hash).toMatch(/^[0-9a-f]{7,}$/);
  });
});
