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
    loomRoot: "/tmp",
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

  it("copies skill assets to compiled output", () => {
    const project = makeProject({
      skills: [
        {
          name: "cleanse",
          content: "# Cleanse",
          assets: [
            { relativePath: "trac.ts", content: Buffer.from("console.log('hi')") },
            { relativePath: "scripts/validate.sh", content: Buffer.from("#!/bin/bash") },
          ],
        },
      ],
    });
    const files = compileClaude(project);
    const ts = files.find((f) => f.relativePath === ".claude/skills/cleanse/trac.ts");
    expect(ts).toBeDefined();
    expect(Buffer.isBuffer(ts!.content)).toBe(true);
    const sh = files.find((f) => f.relativePath === ".claude/skills/cleanse/scripts/validate.sh");
    expect(sh).toBeDefined();
  });

  it("substitutes {skill} to ${CLAUDE_SKILL_DIR}", () => {
    const project = makeProject({
      skills: [{ name: "cleanse", content: "Run `npx tsx {skill}/trac.ts`" }],
    });
    const files = compileClaude(project);
    const skill = files.find((f) => f.relativePath === ".claude/skills/cleanse/SKILL.md");
    expect(skill!.content).toContain("${CLAUDE_SKILL_DIR}/trac.ts");
    expect(skill!.content).not.toContain("{skill}");
  });

  it("substitutes {args} to $ARGUMENTS and {arg:name} to positional", () => {
    const project = makeProject({
      skills: [{ name: "fetch", content: "Get {arg:ticket-id} in {arg:component}" }],
    });
    const files = compileClaude(project);
    const skill = files.find((f) => f.relativePath === ".claude/skills/fetch/SKILL.md");
    expect(skill!.content).toContain("$0");
    expect(skill!.content).toContain("$1");
  });

  it("auto-derives argument-hint from {arg:*} usage", () => {
    const project = makeProject({
      skills: [{ name: "fetch", content: "Get {arg:ticket-id}" }],
    });
    const files = compileClaude(project);
    const skill = files.find((f) => f.relativePath === ".claude/skills/fetch/SKILL.md");
    expect(skill!.content).toContain("argument-hint: <ticket-id>");
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

  it("copies skill assets to compiled output", () => {
    const project = makeProject({
      skills: [
        {
          name: "cleanse",
          content: "# Cleanse",
          assets: [{ relativePath: "trac.ts", content: Buffer.from("api code") }],
        },
      ],
    });
    const files = compileCopilot(project);
    const ts = files.find((f) => f.relativePath === ".github/skills/cleanse/trac.ts");
    expect(ts).toBeDefined();
    expect(Buffer.isBuffer(ts!.content)).toBe(true);
  });

  it("substitutes {skill} to relative path", () => {
    const project = makeProject({
      skills: [{ name: "cleanse", content: "Run `npx tsx {skill}/trac.ts`" }],
    });
    const files = compileCopilot(project);
    const skill = files.find((f) => f.relativePath === ".github/skills/cleanse/SKILL.md");
    expect(skill!.content).toContain(".github/skills/cleanse/trac.ts");
    expect(skill!.content).not.toContain("{skill}");
  });

  it("substitutes {arg:name} to Copilot input syntax", () => {
    const project = makeProject({
      skills: [{ name: "fetch", content: "Get {arg:ticket-id}" }],
    });
    const files = compileCopilot(project);
    const skill = files.find((f) => f.relativePath === ".github/skills/fetch/SKILL.md");
    expect(skill!.content).toContain("${input:ticketId:Enter ticket-id}");
  });
});

describe("compileCodex", () => {
  it("produces AGENTS.md from instructions", () => {
    const files = compileCodex(makeProject());
    const agents = files.find((f) => f.relativePath === "AGENTS.md");
    expect(agents).toBeDefined();
    expect(agents!.content).toContain("Instructions");
  });

  it("produces skill files under .codex/skills/", () => {
    const files = compileCodex(makeProject());
    const skill = files.find((f) => f.relativePath === ".codex/skills/analyse/SKILL.md");
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("Analyse everything");
  });

  it("produces agent files as TOML under .codex/agents/", () => {
    const project = makeProject({
      agents: [
        {
          name: "work",
          content: "Do work.",
          frontmatter: {
            name: "work",
            description: "Orchestrate development work",
            model: "o3",
          },
        },
      ],
    });
    const files = compileCodex(project);
    const agent = files.find((f) => f.relativePath === ".codex/agents/work.toml");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain('name = "work"');
    expect(agent!.content).toContain('description = "Orchestrate development work"');
    expect(agent!.content).toContain('model = "o3"');
    expect(agent!.content).toContain('developer_instructions = "Do work."');
  });

  it("drops skills and disallowed-tools from agent TOML", () => {
    const project = makeProject({
      agents: [
        {
          name: "safe",
          content: "Safe agent.",
          frontmatter: {
            name: "safe",
            description: "No web",
            skills: ["analyse"],
            "disallowed-tools": ["web"],
          },
        },
      ],
    });
    const files = compileCodex(project);
    const agent = files.find((f) => f.relativePath === ".codex/agents/safe.toml");
    expect(agent!.content).not.toContain("skills");
    expect(agent!.content).not.toContain("disallowed");
  });

  it("copies skill assets", () => {
    const project = makeProject({
      skills: [
        {
          name: "cleanse",
          content: "# Cleanse",
          assets: [{ relativePath: "trac.ts", content: Buffer.from("code") }],
        },
      ],
    });
    const files = compileCodex(project);
    expect(files.find((f) => f.relativePath === ".codex/skills/cleanse/trac.ts")).toBeDefined();
  });
});

describe("compileGemini", () => {
  it("produces GEMINI.md from instructions", () => {
    const files = compileGemini(makeProject());
    const gemini = files.find((f) => f.relativePath === "GEMINI.md");
    expect(gemini).toBeDefined();
  });

  it("produces skill files under .gemini/skills/", () => {
    const files = compileGemini(makeProject());
    const skill = files.find((f) => f.relativePath === ".gemini/skills/analyse/SKILL.md");
    expect(skill).toBeDefined();
    expect(skill!.content).toContain("Analyse everything");
  });

  it("produces agent files under .gemini/agents/", () => {
    const files = compileGemini(makeProject());
    const agent = files.find((f) => f.relativePath === ".gemini/agents/work.md");
    expect(agent).toBeDefined();
    expect(agent!.content).toContain("Orchestrate work");
  });

  it("maps agent frontmatter, drops skills and disallowed-tools", () => {
    const project = makeProject({
      agents: [
        {
          name: "work",
          content: "Do work.",
          frontmatter: {
            name: "work",
            description: "Orchestrate",
            tools: ["read", "edit"],
            model: "gemini-3-pro",
            skills: ["analyse"],
            "disallowed-tools": ["web"],
          },
        },
      ],
    });
    const files = compileGemini(project);
    const agent = files.find((f) => f.relativePath === ".gemini/agents/work.md");
    expect(agent!.content).toContain("model: gemini-3-pro");
    expect(agent!.content).toContain("tools:");
    expect(agent!.content).not.toContain("skills:");
    expect(agent!.content).not.toContain("disallowed");
  });

  it("copies skill assets", () => {
    const project = makeProject({
      skills: [
        {
          name: "cleanse",
          content: "# Cleanse",
          assets: [{ relativePath: "trac.ts", content: Buffer.from("code") }],
        },
      ],
    });
    const files = compileGemini(project);
    expect(files.find((f) => f.relativePath === ".gemini/skills/cleanse/trac.ts")).toBeDefined();
  });
});

describe("compileForTarget", () => {
  it("dispatches to the correct compiler", () => {
    const project = makeProject();
    const claude = compileForTarget("claude", project);
    expect(claude.some((f) => f.relativePath === "CLAUDE.md")).toBe(true);
    expect(claude.some((f) => f.relativePath.startsWith(".claude/skills/"))).toBe(true);
    expect(claude.some((f) => f.relativePath.startsWith(".claude/agents/"))).toBe(true);

    const copilot = compileForTarget("copilot", project);
    expect(copilot.some((f) => f.relativePath === ".github/copilot-instructions.md")).toBe(true);
    expect(copilot.some((f) => f.relativePath.startsWith(".github/skills/"))).toBe(true);
    expect(copilot.some((f) => f.relativePath.startsWith(".github/agents/"))).toBe(true);

    const codex = compileForTarget("codex", project);
    expect(codex.some((f) => f.relativePath === "AGENTS.md")).toBe(true);
    expect(codex.some((f) => f.relativePath.startsWith(".codex/skills/"))).toBe(true);
    expect(codex.some((f) => f.relativePath.endsWith(".toml"))).toBe(true);

    const gemini = compileForTarget("gemini", project);
    expect(gemini.some((f) => f.relativePath === "GEMINI.md")).toBe(true);
    expect(gemini.some((f) => f.relativePath.startsWith(".gemini/skills/"))).toBe(true);
    expect(gemini.some((f) => f.relativePath.startsWith(".gemini/agents/"))).toBe(true);
  });
});
