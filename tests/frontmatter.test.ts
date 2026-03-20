import { describe, it, expect } from "vitest";
import { parseFrontmatter, serializeFrontmatter, serializeToml, mapToolNames } from "../src/utils/frontmatter.js";
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
