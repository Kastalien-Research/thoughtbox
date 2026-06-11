/**
 * End-to-end alias resolution through session export (SPEC-003 D3/REQ-006).
 *
 * Writes a project-level aliases.json file, then exports a session whose
 * thought references the alias and verifies the cross-reference resolves
 * to the aliased session with the real referenced thoughts.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { FileSystemStorage } from "../../persistence/filesystem-storage.js";
import { ThoughtHandler } from "../../thought-handler.js";
import { SessionHandlers } from "../handlers.js";
import type { ThoughtData } from "../../persistence/types.js";

const PROJECT = "alias-test-project";

function thought(thoughtNumber: number, text: string): ThoughtData {
  return {
    thought: text,
    thoughtNumber,
    totalThoughts: 1,
    nextThoughtNeeded: false,
    timestamp: new Date().toISOString(),
    thoughtType: "reasoning",
  };
}

describe("session export with project-level aliases", () => {
  let basePath: string;
  let storage: FileSystemStorage;

  beforeEach(async () => {
    basePath = await fs.mkdtemp(path.join(os.tmpdir(), "tb-aliases-"));
    storage = new FileSystemStorage({ basePath });
    await storage.initialize();
    await storage.setProject(PROJECT);
  });

  afterEach(async () => {
    await fs.rm(basePath, { recursive: true, force: true });
  });

  function aliasesPath(): string {
    return path.join(basePath, "projects", PROJECT, "aliases.json");
  }

  it("loadAliases returns undefined when no aliases file exists", async () => {
    expect(await storage.loadAliases()).toBeUndefined();
  });

  it("loadAliases returns the alias map from aliases.json", async () => {
    await fs.writeFile(
      aliasesPath(),
      JSON.stringify({ "my-alias": "some-session-id" })
    );
    expect(await storage.loadAliases()).toEqual({
      "my-alias": "some-session-id",
    });
  });

  it("loadAliases fails fast on malformed JSON", async () => {
    await fs.writeFile(aliasesPath(), "{not json");
    await expect(storage.loadAliases()).rejects.toThrow(
      /Malformed aliases file/
    );
  });

  it("loadAliases fails fast on non-string alias values", async () => {
    await fs.writeFile(aliasesPath(), JSON.stringify({ "my-alias": 42 }));
    await expect(storage.loadAliases()).rejects.toThrow(
      /alias "my-alias" maps to a number/
    );
  });

  it("resolves anchors via aliases.json during JSON export", async () => {
    const target = await storage.createSession({ title: "Target session" });
    await storage.saveThought(target.id, thought(1, "the referenced insight"));

    const source = await storage.createSession({ title: "Source session" });
    await storage.saveThought(
      source.id,
      thought(1, "this builds on @my-alias:S1 directly")
    );

    await fs.writeFile(
      aliasesPath(),
      JSON.stringify({ "my-alias": target.id })
    );

    const handlers = new SessionHandlers({
      storage,
      thoughtHandler: new ThoughtHandler(true, storage),
    });

    const result = await handlers.handleExport({
      sessionId: source.id,
      format: "json",
    });

    const exported = JSON.parse(result.content);
    expect(exported.crossReferences.anchorsFound).toBe(1);
    expect(exported.crossReferences.resolved).toBe(1);

    const [detail] = exported.crossReferences.details;
    const [resolvedAnchor] = detail.anchors;
    expect(resolvedAnchor.status).toBe("resolved");
    expect(resolvedAnchor.candidates[0].matchReason).toBe("alias");
    expect(resolvedAnchor.selected).toEqual({
      sessionId: target.id,
      thoughts: [{ thoughtNumber: 1, thought: "the referenced insight" }],
      missingThoughtNumbers: [],
    });
  });
});
