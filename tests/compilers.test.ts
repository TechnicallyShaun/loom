import { describe, it, expect } from "vitest";
import { compileClaude } from "../src/compilers/claude.js";
import { compileCopilot } from "../src/compilers/copilot.js";
import { compileCodex } from "../src/compilers/codex.js";
import { compileGemini } from "../src/compilers/gemini.js";
import { compileForTarget } from "../src/compilers/index.js";
import type { MergedProject } from "../src/types/index.js";

function makeProject(overrides: Partial<MergedProject> = {}): MergedProject {
  return {
    name: "test",
    targets: ["claude"],
    projectPath: "/tmp/test",
    instructions: "# Instructions\n\nDo the thing.",
    skills: [
      { name: "analyse", content: "# Analyse\n\nAnalyse everything." },
      { name: "cleansing", content: "# Cleansing\n\nClean it up." },
    ],
    agents: [{ name: "work", content: "# Work Agent\n\nOrchestrate work." }],
    ...overrides,
  };
}

describe("compileClaude", () => {
  it("produces CLAUDE.md from instructions", () => {
    const files = compileClaude(makeProject());
    const claude = files.find((f) => f.relativePath === "CLAUDE.md");
    expect(claude).toBeDefined();
    expect(claude!.content).toContain("# Instructions");
  });

  it("produces skill files under .claude/skills/", () => {
    const files = compileClaude(makeProject());
    const skill = files.find((f) => f.relativePath === ".claude/skills/analyse/SKILL.md");
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("Analyse everything");
  });

  it("produces agent files under .claude/agents/", () => {
    const files = compileClaude(makeProject());
    const agent = files.find((f) => f.relativePath === ".claude/agents/work.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("Orchestrate work");
  });

  it("preserves existing frontmatter in agent files", () => {
    const project = makeProject({
      agents: [
        {
          name: "work",
          content: "---\ndescription: Orchestrate development work\nmodel: sonnet\n---\n\nDo work.",
        },
      ],
    });
    const files = compileClaude(project);
    const agent = files.find((f) => f.relativePath === ".claude/agents/work.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("description: Orchestrate development work");
    expect(agent!.content).toContain("model: sonnet");
    expect(agent!.content).toContain("Do work.");
  });

  it("returns empty for no instructions", () => {
    const files = compileClaude(makeProject({ instructions: "" }));
    expect(files.find((f) => f.relativePath === "CLAUDE.md")).toBeUndefined();
  });
});

describe("compileCopilot", () => {
  it("produces .github/copilot-instructions.md", () => {
    const files = compileCopilot(makeProject());
    const instr = files.find((f) => f.relativePath === ".github/copilot-instructions.md");
    expect(instr).toBeDefined();
    expect(instr!.content).toContain("Instructions");
  });

  it("produces skill files under .github/skills/", () => {
    const files = compileCopilot(makeProject());
    const skill = files.find(
      (f) => f.relativePath === ".github/skills/analyse/SKILL.md",
    );
    expect(skill).toBeDefined();
  });

  it("produces agent files under .github/agents/ with .agent.md extension", () => {
    const files = compileCopilot(makeProject());
    const agent = files.find((f) => f.relativePath === ".github/agents/work.agent.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("Orchestrate work");
  });
});

describe("compileCodex", () => {
  it("produces AGENTS.md from instructions only", () => {
    const files = compileCodex(makeProject());
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("AGENTS.md");
    expect(files[0].content).toContain("Instructions");
  });

  it("ignores skills and agents", () => {
    const files = compileCodex(makeProject());
    expect(files.every((f) => !f.relativePath.includes("skills"))).toBe(true);
  });
});

describe("compileGemini", () => {
  it("produces GEMINI.md from instructions only", () => {
    const files = compileGemini(makeProject());
    expect(files).toHaveLength(1);
    expect(files[0].relativePath).toBe("GEMINI.md");
  });
});

describe("compileForTarget", () => {
  it("dispatches to the correct compiler", () => {
    const project = makeProject();
    const claude = compileForTarget("claude", project);
    expect(claude.some((f) => f.relativePath === "CLAUDE.md")).toBe(true);

    const copilot = compileForTarget("copilot", project);
    expect(copilot.some((f) => f.relativePath === ".github/copilot-instructions.md")).toBe(true);

    const codex = compileForTarget("codex", project);
    expect(codex.some((f) => f.relativePath === "AGENTS.md")).toBe(true);

    const gemini = compileForTarget("gemini", project);
    expect(gemini.some((f) => f.relativePath === "GEMINI.md")).toBe(true);
  });
});
