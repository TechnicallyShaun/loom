import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { init } from "../src/commands/init.js";
import { register } from "../src/commands/register.js";
import { compile } from "../src/commands/compile.js";
import { deploy } from "../src/commands/deploy.js";
import { diff } from "../src/commands/diff.js";
import { discover } from "../src/commands/discover.js";
import { makeTempDir, cleanup, writeFile } from "./helpers.js";

let loomHome: string;
let projectPath: string;
let originalEnv: string | undefined;

beforeEach(() => {
  loomHome = makeTempDir();
  projectPath = makeTempDir();
  originalEnv = process.env.LOOM_DIR;
  process.env.LOOM_DIR = loomHome;
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.LOOM_DIR;
  } else {
    process.env.LOOM_DIR = originalEnv;
  }
  cleanup(loomHome);
  cleanup(projectPath);
});

describe("full pipeline: init → register → compile → deploy → diff → discover", () => {
  it("works end-to-end", async () => {
    // 1. Init
    await init([]);
    expect(fs.existsSync(path.join(loomHome, ".git"))).toBe(true);
    expect(fs.existsSync(path.join(loomHome, "global", "instructions"))).toBe(true);

    // 2. Add global content
    writeFile(
      path.join(loomHome, "global", "instructions", "conventions.md"),
      "# Conventions\n\nUse conventional commits.\nAlways run tests before pushing.",
    );
    writeFile(
      path.join(loomHome, "global", "skills", "analyse", "SKILL.md"),
      "# Analyse\n\nPerform deep analysis of the codebase.",
    );
    writeFile(
      path.join(loomHome, "global", "agents", "work.md"),
      "# Work Agent\n\nRead the plan, set up env, implement, test, commit.",
    );

    // 3. Register
    await register(["anvil", projectPath, "--targets", "claude,copilot,codex,gemini"]);

    const configContent = fs.readFileSync(path.join(loomHome, "config.yaml"), "utf-8");
    expect(configContent).toContain("anvil");

    // 4. Add project-specific content
    writeFile(
      path.join(loomHome, "projects", "anvil", "instructions", "anvil-setup.md"),
      "# Anvil Setup\n\nRun IIS first, then build.",
    );
    writeFile(
      path.join(loomHome, "projects", "anvil", "skills", "setup-env", "SKILL.md"),
      "# Setup Env (Anvil)\n\n1. Reset DB\n2. Start Docker\n3. Build",
    );

    // 5. Compile
    await compile(["anvil"]);

    const compiledDir = path.join(loomHome, ".compiled", "anvil");

    // Claude outputs
    const claudeMd = fs.readFileSync(path.join(compiledDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("Conventions");
    expect(claudeMd).toContain("Anvil Setup");

    const analyseSkill = fs.readFileSync(
      path.join(compiledDir, ".claude", "skills", "analyse", "SKILL.md"),
      "utf-8",
    );
    expect(analyseSkill).toContain("deep analysis");

    const workAgent = fs.readFileSync(
      path.join(compiledDir, ".claude", "agents", "work.md"),
      "utf-8",
    );
    expect(workAgent).toContain("Work Agent");

    // Copilot outputs
    expect(fs.existsSync(path.join(compiledDir, ".github", "copilot-instructions.md"))).toBe(true);
    expect(fs.existsSync(path.join(compiledDir, ".github", "skills", "analyse", "SKILL.md"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(compiledDir, ".github", "agents", "work.agent.md"))).toBe(true);

    // Codex output
    expect(fs.existsSync(path.join(compiledDir, "AGENTS.md"))).toBe(true);

    // Gemini output
    expect(fs.existsSync(path.join(compiledDir, "GEMINI.md"))).toBe(true);

    // 6. Deploy
    await deploy(["anvil"]);

    expect(fs.existsSync(path.join(projectPath, "CLAUDE.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, ".claude", "skills", "analyse", "SKILL.md"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(projectPath, ".github", "copilot-instructions.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "GEMINI.md"))).toBe(true);

    // Verify deployed content matches compiled
    expect(fs.readFileSync(path.join(projectPath, "CLAUDE.md"), "utf-8")).toBe(claudeMd);

    // 7. Diff (should show up to date)
    await diff(["anvil"]);

    // 8. Discover
    await discover([]);

    // 9. Verify git history
    const log = execSync("git log --oneline", {
      cwd: loomHome,
      encoding: "utf-8",
    });
    expect(log).toContain("compile: anvil");
    expect(log).toContain("deploy: anvil");
  });

  it("compiles with project skill overriding global", async () => {
    await init([]);

    writeFile(
      path.join(loomHome, "global", "skills", "setup-env", "SKILL.md"),
      "Global setup-env: generic steps",
    );

    await register(["spark", projectPath]);

    writeFile(
      path.join(loomHome, "projects", "spark", "skills", "setup-env", "SKILL.md"),
      "Spark setup-env: specific steps",
    );

    await compile(["spark"]);

    const skill = fs.readFileSync(
      path.join(loomHome, ".compiled", "spark", ".claude", "skills", "setup-env", "SKILL.md"),
      "utf-8",
    );
    expect(skill).toContain("Spark setup-env");
    expect(skill).not.toContain("Global setup-env");
  });
});
