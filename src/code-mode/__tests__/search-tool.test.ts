import { describe, it, expect } from "vitest";
import { SearchTool } from "../search-tool.js";
import { buildSearchCatalog } from "../search-index.js";

const catalog = buildSearchCatalog();
const tool = new SearchTool(catalog);

describe("thoughtbox_search", () => {
  it("lists all module names", async () => {
    const result = await tool.handle({
      code: "async () => Object.keys(catalog.operations)",
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBeUndefined();
    expect(output.result).toContain("session");
    expect(output.result).toContain("thought");
    expect(output.result).toContain("knowledge");
    expect(output.result).toContain("notebook");
    expect(output.result).toContain("theseus");
    expect(output.result).toContain("ulysses");
    expect(output.result).toContain("observability");
  });

  it("filters operations by module", async () => {
    const result = await tool.handle({
      code: `async () => Object.keys(catalog.operations.session)`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result).toContain("session_list");
    expect(output.result).toContain("session_get");
  });

  it("searches prompts by name", async () => {
    const result = await tool.handle({
      code: `async () => catalog.prompts.filter(p => p.name.includes('spec'))`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result.length).toBeGreaterThanOrEqual(3);
    expect(output.result.some((p: { name: string }) => p.name === "spec-designer")).toBe(true);
  });

  it("searches resources by URI pattern", async () => {
    const result = await tool.handle({
      code: `async () => catalog.resources.filter(r => r.uri.includes('tests'))`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result.length).toBeGreaterThanOrEqual(2);
  });

  it("returns resource templates", async () => {
    const result = await tool.handle({
      code: `async () => catalog.resourceTemplates.map(t => t.uriTemplate)`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.result.length).toBeGreaterThan(0);
    expect(output.result.some((t: string) => t.includes("{sessionId}"))).toBe(true);
  });

  it("returns durationMs in response envelope", async () => {
    const result = await tool.handle({
      code: `async () => 42`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.durationMs).toBeTypeOf("number");
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captures console.log in logs", async () => {
    const result = await tool.handle({
      code: `async () => { console.log("hello"); return "done"; }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.logs).toContain("hello");
    expect(output.result).toBe("done");
  });

  it("returns error for invalid code", async () => {
    const result = await tool.handle({
      code: `async () => { throw new Error("search failed"); }`,
    });
    const output = JSON.parse(result.content[0].text);
    expect(output.error).toBe("search failed");
    expect(output.result).toBeNull();
  });

  it("catalog top-level is frozen (writes silently fail)", async () => {
    const result = await tool.handle({
      code: `async () => { catalog.newProp = "bad"; return catalog.newProp; }`,
    });
    const output = JSON.parse(result.content[0].text);
    // Object.freeze in sloppy mode: assignment silently fails, property not added
    // undefined serializes to null in JSON
    expect(output.result).toBeNull();
  });
});
