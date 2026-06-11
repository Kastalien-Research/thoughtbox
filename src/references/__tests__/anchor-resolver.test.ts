/**
 * AnchorResolver behavioral tests (SPEC-003)
 *
 * Verifies that resolved anchors carry the real referenced thoughts,
 * that missing thought numbers are reported instead of silently dropped,
 * and that alias configuration drives exact-match resolution.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryStorage } from "../../persistence/storage.js";
import { AnchorParser } from "../anchor-parser.js";
import { AnchorResolver } from "../anchor-resolver.js";
import type { ThoughtData } from "../../persistence/types.js";

function thought(thoughtNumber: number, text: string): ThoughtData {
  return {
    thought: text,
    thoughtNumber,
    totalThoughts: 3,
    nextThoughtNeeded: thoughtNumber < 3,
    timestamp: new Date().toISOString(),
    thoughtType: "reasoning",
  };
}

describe("AnchorResolver", () => {
  let storage: InMemoryStorage;
  let parser: AnchorParser;

  beforeEach(() => {
    storage = new InMemoryStorage();
    parser = new AnchorParser();
  });

  async function seedSession(
    title: string,
    tags: string[],
    thoughts: string[]
  ): Promise<string> {
    const session = await storage.createSession({ title, tags });
    for (let i = 0; i < thoughts.length; i++) {
      await storage.saveThought(session.id, thought(i + 1, thoughts[i]));
    }
    return session.id;
  }

  it("returns the real referenced thoughts for a tag-resolved anchor", async () => {
    const sessionId = await seedSession(
      "Phenomenology study",
      ["phenomenology"],
      ["first insight", "second insight", "third insight"]
    );

    const resolver = new AnchorResolver(storage);
    const [anchor] = parser.parse("builds on @phenomenology:S2");
    const result = await resolver.resolve(anchor);

    expect(result.status).toBe("resolved");
    expect(result.selected).toEqual({
      sessionId,
      thoughts: [{ thoughtNumber: 2, thought: "second insight" }],
      missingThoughtNumbers: [],
    });
  });

  it("reports referenced thought numbers that do not exist in the session", async () => {
    await seedSession(
      "Phenomenology study",
      ["phenomenology"],
      ["first insight", "second insight", "third insight"]
    );

    const resolver = new AnchorResolver(storage);
    const [anchor] = parser.parse("range ref @phenomenology:S2-S5");
    const result = await resolver.resolve(anchor);

    expect(result.status).toBe("resolved");
    expect(result.selected?.thoughts).toEqual([
      { thoughtNumber: 2, thought: "second insight" },
      { thoughtNumber: 3, thought: "third insight" },
    ]);
    expect(result.selected?.missingThoughtNumbers).toEqual([4, 5]);
  });

  it("resolves via alias config with confidence 1.0 and loads thoughts", async () => {
    const sessionId = await seedSession(
      "Some unrelated title",
      [],
      ["aliased thought"]
    );

    const resolver = new AnchorResolver(storage, {
      "my-alias": sessionId,
    });
    const [anchor] = parser.parse("see @my-alias:S1");
    const result = await resolver.resolve(anchor);

    expect(result.status).toBe("resolved");
    expect(result.candidates[0].matchReason).toBe("alias");
    expect(result.candidates[0].confidence).toBe(1.0);
    expect(result.selected?.thoughts).toEqual([
      { thoughtNumber: 1, thought: "aliased thought" },
    ]);
  });

  it("returns unresolved with no selected thoughts when nothing matches", async () => {
    const resolver = new AnchorResolver(storage);
    const [anchor] = parser.parse("ghost @nonexistent-keyword:S1");
    const result = await resolver.resolve(anchor);

    expect(result.status).toBe("unresolved");
    expect(result.candidates).toEqual([]);
    expect(result.selected).toBeUndefined();
  });

  it("returns ambiguous candidates without selected thoughts", async () => {
    await seedSession("caching design notes", [], ["a"]);
    await seedSession("caching follow-up", [], ["b"]);

    const resolver = new AnchorResolver(storage);
    const [anchor] = parser.parse("per @caching:S1");
    const result = await resolver.resolve(anchor);

    expect(result.status).toBe("ambiguous");
    expect(result.candidates.length).toBe(2);
    expect(result.selected).toBeUndefined();
  });
});
