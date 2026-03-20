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

  it("maps agent frontmatter to Claude fields", () => {
    const project = makeProject({
      agents: [
        {
          name: "work",
          content: "Do work.",
          frontmatter: {
            name: "work",
            description: "Orchestrate development work",
            skills: ["analyse", "test-plan"],
            tools: ["read", "edit", "execute"],
            model: "sonnet",
          },
        },
      ],
    });
    const files = compileClaude(project);
    const agent = files.find((f) => f.relativePath === ".claude/agents/work.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("description: Orchestrate development work");
    expect(agent!.content).toContain("model: sonnet");
    expect(agent!.content).toContain("skills:");
    expect(agent!.content).toContain("- analyse");
    // Tools should be mapped to Claude names
    expect(agent!.content).toContain("Read");
    expect(agent!.content).toContain("Write");
    expect(agent!.content).toContain("Edit");
    expect(agent!.content).toContain("Bash");
    expect(agent!.content).toContain("Do work.");
  });

  it("maps skill frontmatter tools to allowed-tools", () => {
    const project = makeProject({
      skills: [
        {
          name: "analyse",
          content: "# Analyse\n\nDo analysis.",
          frontmatter: {
            name: "analyse",
            description: "Analyse a ticket",
            tools: ["read", "search"],
          },
        },
      ],
    });
    const files = compileClaude(project);
    const skill = files.find((f) => f.relativePath === ".claude/skills/analyse/SKILL.md");
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("allowed-tools:");
    expect(skill!.content).toContain("Read");
    expect(skill!.content).toContain("Grep");
    expect(skill!.content).toContain("Glob");
    // Should NOT contain loom-neutral "tools:" key
    expect(skill!.content).not.toMatch(/^tools:/m);
  });

  it("maps disallowed-tools to disallowedTools", () => {
    const project = makeProject({
      agents: [
        {
          name: "safe",
          content: "Safe agent.",
          frontmatter: {
            name: "safe",
            description: "No web access",
            "disallowed-tools": ["web"],
          },
        },
      ],
    });
    const files = compileClaude(project);
    const agent = files.find((f) => f.relativePath === ".claude/agents/safe.md");
    expect(agent!.content).toContain("disallowedTools:");
    expect(agent!.content).toContain("WebSearch");
    expect(agent!.content).toContain("WebFetch");
  });

  it("handles skills and agents without frontmatter", () => {
    const project = makeProject({
      skills: [{ name: "simple", content: "# Simple\n\nNo frontmatter." }],
      agents: [{ name: "basic", content: "# Basic\n\nNo frontmatter." }],
    });
    const files = compileClaude(project);
    const skill = files.find((f) => f.relativePath === ".claude/skills/simple/SKILL.md");
    expect(skill!.content).toBe("# Simple\n\nNo frontmatter.\n");
    const agent = files.find((f) => f.relativePath === ".claude/agents/basic.md");
    expect(agent!.content).toBe("# Basic\n\nNo frontmatter.\n");
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
    const skill = files.find((f) => f.relativePath === ".github/skills/analyse/SKILL.md");
    expect(skill).toBeDefined();
  });

  it("produces agent files under .github/agents/ with .agent.md extension", () => {
    const files = compileCopilot(makeProject());
    const agent = files.find((f) => f.relativePath === ".github/agents/work.agent.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("Orchestrate work");
  });

  it("drops skills, model, and disallowed-tools from agent frontmatter", () => {
    const project = makeProject({
      agents: [
        {
          name: "work",
          content: "Do work.",
          frontmatter: {
            name: "work",
            description: "Orchestrate development work",
            skills: ["analyse"],
            tools: ["read", "edit"],
            "disallowed-tools": ["web"],
            model: "sonnet",
          },
        },
      ],
    });
    const files = compileCopilot(project);
    const agent = files.find((f) => f.relativePath === ".github/agents/work.agent.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("name: work");
    expect(agent!.content).toContain("description: Orchestrate development work");
    // Tools should be mapped to Copilot names
    expect(agent!.content).toContain("read");
    expect(agent!.content).toContain("edit");
    // These should NOT be present
    expect(agent!.content).not.toContain("skills:");
    expect(agent!.content).not.toContain("disallowedTools:");
    expect(agent!.content).not.toContain("disallowed-tools:");
    expect(agent!.content).not.toContain("model:");
  });

  it("drops tools from skill frontmatter", () => {
    const project = makeProject({
      skills: [
        {
          name: "analyse",
          content: "# Analyse\n\nDo analysis.",
          frontmatter: {
            name: "analyse",
            description: "Analyse a ticket",
            tools: ["read", "search"],
          },
        },
      ],
    });
    const files = compileCopilot(project);
    const skill = files.find((f) => f.relativePath === ".github/skills/analyse/SKILL.md");
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("name: analyse");
    expect(skill!.content).toContain("description: Analyse a ticket");
    expect(skill!.content).not.toContain("tools:");
    expect(skill!.content).not.toContain("allowed-tools:");
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
