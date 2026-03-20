import { describe, it, expect } from "vitest";
import {
  parseFrontmatter,
  serializeFrontmatter,
  serializeToml,
  mapToolNames,
  applySubstitutions,
  claudeSubstitutions,
  copilotSubstitutions,
  codexSubstitutions,
  deriveArgumentHint,
} from "../src/utils/frontmatter.js";
import { CLAUDE_TOOL_MAP, COPILOT_TOOL_MAP } from "../src/compilers/tool-mappings.js";

describe("parseFrontmatter", () => {
  it("parses valid frontmatter", () => {
    const raw = "---\nname: test\ndescription: A test\n---\n\n# Body\n\nContent here.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({ name: "test", description: "A test" });
    expect(body).toBe("# Body\n\nContent here.");
  });

  it("returns empty frontmatter when none present", () => {
    const raw = "# Just a body\n\nNo frontmatter.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({});
    expect(body).toBe(raw);
  });

  it("handles frontmatter with arrays", () => {
    const raw = "---\ntools:\n  - read\n  - edit\nskills:\n  - analyse\n---\n\nBody.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.tools).toEqual(["read", "edit"]);
    expect(frontmatter.skills).toEqual(["analyse"]);
    expect(body).toBe("Body.");
  });

  it("handles empty frontmatter block", () => {
    const raw = "---\n---\n\nBody only.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({});
    expect(body).toBe("Body only.");
  });

  it("does not confuse --- in body with frontmatter", () => {
    const raw = "---\nname: test\n---\n\nSome text\n\n---\n\nMore text.";
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter).toEqual({ name: "test" });
    expect(body).toContain("---");
    expect(body).toContain("More text.");
  });
});

describe("serializeFrontmatter", () => {
  it("produces frontmatter + body", () => {
    const result = serializeFrontmatter({ name: "test" }, "# Body");
    expect(result).toContain("---");
    expect(result).toContain("name: test");
    expect(result).toContain("# Body");
  });

  it("returns just body when frontmatter is empty", () => {
    const result = serializeFrontmatter({}, "# Body");
    expect(result).toBe("# Body");
  });

  it("round-trips with parseFrontmatter", () => {
    const fm = { name: "test", description: "A thing", tools: ["read", "edit"] };
    const body = "# Content\n\nSome text.";
    const serialized = serializeFrontmatter(fm, body);
    const { frontmatter, body: parsedBody } = parseFrontmatter(serialized);
    expect(frontmatter).toEqual(fm);
    expect(parsedBody).toBe(body);
  });
});

describe("mapToolNames", () => {
  it("maps known tools for Claude", () => {
    const result = mapToolNames(["read", "edit", "search"], CLAUDE_TOOL_MAP);
    expect(result).toEqual(["Read", "Write", "Edit", "Grep", "Glob"]);
  });

  it("maps known tools for Copilot", () => {
    const result = mapToolNames(["read", "edit", "search"], COPILOT_TOOL_MAP);
    expect(result).toEqual(["read", "edit", "search"]);
  });

  it("passes through unknown tool names", () => {
    const result = mapToolNames(["read", "custom-tool"], CLAUDE_TOOL_MAP);
    expect(result).toEqual(["Read", "custom-tool"]);
  });

  it("handles empty array", () => {
    const result = mapToolNames([], CLAUDE_TOOL_MAP);
    expect(result).toEqual([]);
  });

  it("expands all Claude mappings", () => {
    const all = mapToolNames(["read", "edit", "execute", "search", "agent", "web"], CLAUDE_TOOL_MAP);
    expect(all).toEqual(["Read", "Write", "Edit", "Bash", "Grep", "Glob", "Agent", "WebSearch", "WebFetch"]);
  });
});

describe("serializeToml", () => {
  it("serializes strings", () => {
    const result = serializeToml({ name: "work", description: "Do things" });
    expect(result).toBe('name = "work"\ndescription = "Do things"');
  });

  it("serializes numbers and booleans", () => {
    const result = serializeToml({ max_turns: 30, enabled: true });
    expect(result).toBe("max_turns = 30\nenabled = true");
  });

  it("serializes arrays of strings", () => {
    const result = serializeToml({ tools: ["read", "edit"] });
    expect(result).toBe('tools = ["read", "edit"]');
  });

  it("escapes quotes and backslashes", () => {
    const result = serializeToml({ msg: 'say "hello"' });
    expect(result).toBe('msg = "say \\"hello\\""');
  });

  it("skips null values", () => {
    const result = serializeToml({ name: "test", missing: null });
    expect(result).toBe('name = "test"');
  });
});

describe("applySubstitutions", () => {
  it("replaces {skill}, {project}, {loom} for Claude", () => {
    const ctx = claudeSubstitutions("cleanse", "/app", "/workspace");
    const result = applySubstitutions("Run {skill}/trac.ts in {project}/src from {loom}", ctx);
    expect(result).toBe("Run ${CLAUDE_SKILL_DIR}/trac.ts in /app/src from /workspace");
  });

  it("replaces {skill} with relative path for Copilot", () => {
    const ctx = copilotSubstitutions("cleanse", "/app", "/workspace");
    const result = applySubstitutions("Run {skill}/trac.ts", ctx);
    expect(result).toBe("Run .github/skills/cleanse/trac.ts");
  });

  it("replaces {args} for Claude", () => {
    const ctx = claudeSubstitutions("fetch", "/app", "/workspace");
    const result = applySubstitutions("Get {args}", ctx);
    expect(result).toBe("Get $ARGUMENTS");
  });

  it("replaces {arg:name} positionally for Claude", () => {
    const ctx = claudeSubstitutions("fetch", "/app", "/workspace");
    const result = applySubstitutions("Get {arg:ticket} in {arg:area}", ctx);
    expect(result).toBe("Get $0 in $1");
  });

  it("replaces {arg:name} with input syntax for Copilot", () => {
    const ctx = copilotSubstitutions("fetch", "/app", "/workspace");
    const result = applySubstitutions("Get {arg:ticket-id}", ctx);
    expect(result).toBe("Get ${input:ticketId:Enter ticket-id}");
  });

  it("uses $1-based indexing for Codex", () => {
    const ctx = codexSubstitutions("fetch", "/app", "/workspace");
    const result = applySubstitutions("Get {arg:ticket} in {arg:area}", ctx);
    expect(result).toBe("Get $1 in $2");
  });

  it("reuses same index for repeated {arg:name}", () => {
    const ctx = claudeSubstitutions("fetch", "/app", "/workspace");
    const result = applySubstitutions("{arg:ticket} then {arg:ticket} again", ctx);
    expect(result).toBe("$0 then $0 again");
  });

  it("passes through unknown {placeholders}", () => {
    const ctx = claudeSubstitutions("test", "/app", "/workspace");
    const result = applySubstitutions("Keep {other} unchanged", ctx);
    expect(result).toBe("Keep {other} unchanged");
  });
});

describe("deriveArgumentHint", () => {
  it("derives hint from {arg:*} usage", () => {
    expect(deriveArgumentHint("Get {arg:ticket-id} in {arg:component}")).toBe(
      "<ticket-id> <component>",
    );
  });

  it("returns undefined for {args}", () => {
    expect(deriveArgumentHint("Get {args}")).toBeUndefined();
  });

  it("returns undefined when no args", () => {
    expect(deriveArgumentHint("No arguments here")).toBeUndefined();
  });

  it("deduplicates repeated arg names", () => {
    expect(deriveArgumentHint("{arg:id} then {arg:id}")).toBe("<id>");
  });
});
