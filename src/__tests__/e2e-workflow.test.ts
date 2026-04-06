/**
 * End-to-end workflow tests.
 *
 * These test actual features through the actual tool layer.
 * No mocks. No shape checks. If the feature doesn't work, the test fails.
 *
 * Tests marked `it.fails` document KNOWN BUGS. When the bug is fixed,
 * the test will unexpectedly pass — remove `it.fails` at that point.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ThoughtHandler } from "../thought-handler.js";
import { InMemoryStorage } from "../persistence/storage.js";
import { InMemoryProtocolHandler } from "../protocol/in-memory-handler.js";
import { UlyssesTool } from "../protocol/ulysses-tool.js";
import { TheseusTool } from "../protocol/theseus-tool.js";

function parseToolResult(raw: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(raw.content[0].text);
}

// =============================================================================
// Thought session lifecycle
// =============================================================================

describe("Thought session lifecycle", () => {
  let storage: InMemoryStorage;
  let handler: ThoughtHandler;

  beforeEach(() => {
    storage = new InMemoryStorage();
    handler = new ThoughtHandler(true, storage);
  });

  it("first thought creates a session", async () => {
    const result = parseToolResult(await handler.processThought({
      thought: "first thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
    }));

    expect(handler.getCurrentSessionId()).not.toBeNull();
    expect(result.thoughtNumber).toBe(1);
  });

  it("auto-numbering assigns sequential numbers when thoughtNumber omitted", async () => {
    await handler.processThought({
      thought: "one",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
    });
    const r2 = parseToolResult(await handler.processThought({
      thought: "two",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
    }));
    const r3 = parseToolResult(await handler.processThought({
      thought: "three",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
    }));

    expect(r2.thoughtNumber).toBe(2);
    expect(r3.thoughtNumber).toBe(3);
  });

  it("closing a session sets sessionClosed and nulls currentSessionId", async () => {
    await handler.processThought({
      thought: "only thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: false,
    });

    expect(handler.getCurrentSessionId()).toBeNull();
  });

  // BUG: new sessionTitle nulls currentSessionId and then mcpSessionId
  // causes it to resume the same session. Should start a new run instead.
  it.fails("new sessionTitle on active session starts new run, not new session", async () => {
    await handler.processThought({
      thought: "run 1 thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      sessionTitle: "Run One",
    });
    const sessionId = handler.getCurrentSessionId();

    await handler.processThought({
      thought: "run 2 thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      sessionTitle: "Run Two",
    });

    // Same session, not a new one
    expect(handler.getCurrentSessionId()).toBe(sessionId);
  });

  // BUG: no collision guard — duplicate thoughtNumber crashes with unique constraint
  // on Supabase (InMemoryStorage may not enforce the constraint)
  it.fails("thought number collision is auto-resolved on same session", async () => {
    await handler.processThought({
      thought: "thought 1",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 5,
    });

    const r2 = parseToolResult(await handler.processThought({
      thought: "also thought 1 — should become 2",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 5,
    }));

    expect(r2.thoughtNumber).toBe(2);
  });
});

// =============================================================================
// Branching
// =============================================================================

describe("Branching", () => {
  let storage: InMemoryStorage;
  let handler: ThoughtHandler;

  beforeEach(() => {
    storage = new InMemoryStorage();
    handler = new ThoughtHandler(true, storage);
  });

  it("branch thoughts with explicit numbers don't crash", async () => {
    await handler.processThought({
      thought: "main thought 1",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 10,
    });

    const branch1 = parseToolResult(await handler.processThought({
      thought: "branch thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      branchFromThought: 1,
      branchId: "alt-a",
      thoughtNumber: 2,
      totalThoughts: 10,
    }));

    expect(branch1.thoughtNumber).toBe(2);
  });

  // BUG: auto-numbering for branch thoughts uses main chain max,
  // which may collide with existing branch thought numbers
  it("second branch thought with auto-numbering doesn't crash", async () => {
    await handler.processThought({
      thought: "main 1",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 10,
    });

    await handler.processThought({
      thought: "branch 1",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      branchFromThought: 1,
      branchId: "alt",
      thoughtNumber: 2,
      totalThoughts: 10,
    });

    const r = parseToolResult(await handler.processThought({
      thought: "branch 2",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      branchFromThought: 1,
      branchId: "alt",
    }));

    expect(r.thoughtNumber).toBeGreaterThan(0);
  });

  it("multiple parallel branches from same thought", async () => {
    await handler.processThought({
      thought: "decision point",
      thoughtType: "decision_frame",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 10,
      confidence: "medium",
      options: [{ label: "A", selected: false }, { label: "B", selected: false }],
    });

    await handler.processThought({
      thought: "explore A",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      branchFromThought: 1,
      branchId: "option-a",
      thoughtNumber: 2,
      totalThoughts: 10,
    });

    await handler.processThought({
      thought: "explore B",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      branchFromThought: 1,
      branchId: "option-b",
      thoughtNumber: 2,
      totalThoughts: 10,
    });

    const sessionId = handler.getCurrentSessionId()!;
    const branches = await storage.getBranchIds(sessionId);
    expect(branches).toContain("option-a");
    expect(branches).toContain("option-b");
  });
});

// =============================================================================
// Structured thought types persist through round-trip
// =============================================================================

describe("Structured thought types persist through round-trip", () => {
  let storage: InMemoryStorage;
  let handler: ThoughtHandler;

  beforeEach(() => {
    storage = new InMemoryStorage();
    handler = new ThoughtHandler(true, storage);
  });

  it("decision_frame fields survive persistence", async () => {
    await handler.processThought({
      thought: "choosing between X and Y",
      thoughtType: "decision_frame",
      nextThoughtNeeded: true,
      confidence: "high",
      options: [
        { label: "X", selected: true, reason: "better" },
        { label: "Y", selected: false },
      ],
    });

    const sessionId = handler.getCurrentSessionId()!;
    const thoughts = await storage.getThoughts(sessionId);
    expect(thoughts[0].thoughtType).toBe("decision_frame");
    expect(thoughts[0].confidence).toBe("high");
    expect(thoughts[0].options).toHaveLength(2);
    expect(thoughts[0].options![0].selected).toBe(true);
  });

  it("assumption_update fields survive persistence", async () => {
    await handler.processThought({
      thought: "assumption changed",
      thoughtType: "assumption_update",
      nextThoughtNeeded: true,
      assumptionChange: {
        text: "X is true",
        oldStatus: "believed",
        newStatus: "refuted",
        trigger: "evidence Y",
        downstream: [1, 3],
      },
    });

    const sessionId = handler.getCurrentSessionId()!;
    const thoughts = await storage.getThoughts(sessionId);
    expect(thoughts[0].assumptionChange?.newStatus).toBe("refuted");
    expect(thoughts[0].assumptionChange?.downstream).toEqual([1, 3]);
  });

  it("belief_snapshot fields survive persistence", async () => {
    await handler.processThought({
      thought: "snapshot",
      thoughtType: "belief_snapshot",
      nextThoughtNeeded: true,
      beliefs: {
        entities: [{ name: "server", state: "healthy" }],
        constraints: ["read-only"],
        risks: ["timeout"],
      },
    });

    const sessionId = handler.getCurrentSessionId()!;
    const thoughts = await storage.getThoughts(sessionId);
    expect(thoughts[0].beliefs?.entities).toHaveLength(1);
    expect(thoughts[0].beliefs?.risks).toContain("timeout");
  });

  it("action_report fields survive persistence", async () => {
    await handler.processThought({
      thought: "action taken",
      thoughtType: "action_report",
      nextThoughtNeeded: true,
      actionResult: {
        success: true,
        reversible: "partial",
        tool: "Bash",
        target: "deploy script",
        sideEffects: ["container restarted"],
      },
    });

    const sessionId = handler.getCurrentSessionId()!;
    const thoughts = await storage.getThoughts(sessionId);
    expect(thoughts[0].actionResult?.reversible).toBe("partial");
    expect(thoughts[0].actionResult?.sideEffects).toContain("container restarted");
  });
});

// =============================================================================
// Embedded resources in thought responses
// =============================================================================

describe("Embedded resources in thought responses", () => {
  let storage: InMemoryStorage;
  let handler: ThoughtHandler;

  beforeEach(() => {
    storage = new InMemoryStorage();
    handler = new ThoughtHandler(true, storage);
  });

  // BUG: non-verbose mode (default) skips all embedded resources.
  // The guide embedding at thought 1 / final thought / includeGuide
  // only runs in the verbose code path.
  it.fails("thought 1 includes embedded resource", async () => {
    const raw = await handler.processThought({
      thought: "first thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 5,
    });

    expect(raw.content.length).toBeGreaterThan(1);
    const resourceItems = raw.content.filter(
      (c: any) => c.type === "resource" || c.type === "resource_link"
    );
    expect(resourceItems.length).toBeGreaterThan(0);
  });

  // BUG: same as above — includeGuide is only checked in verbose path
  it.fails("includeGuide=true includes embedded resource", async () => {
    await handler.processThought({
      thought: "first",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
    });

    const raw = await handler.processThought({
      thought: "need guide",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      includeGuide: true,
    });

    const resourceItems = raw.content.filter(
      (c: any) => c.type === "resource"
    );
    expect(resourceItems.length).toBeGreaterThan(0);
  });

  it("mid-session thought without includeGuide has no embedded resource", async () => {
    await handler.processThought({
      thought: "first",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 1,
      totalThoughts: 10,
    });

    const raw = await handler.processThought({
      thought: "middle thought",
      thoughtType: "reasoning",
      nextThoughtNeeded: true,
      thoughtNumber: 5,
      totalThoughts: 10,
    });

    expect(raw.content.length).toBe(1);
  });
});

// =============================================================================
// Ulysses protocol e2e through tool layer
// =============================================================================

describe("Ulysses protocol e2e through tool layer", () => {
  let thoughtHandler: ThoughtHandler;
  let tool: UlyssesTool;

  beforeEach(() => {
    const protocolHandler = new InMemoryProtocolHandler();
    thoughtHandler = new ThoughtHandler(true);
    tool = new UlyssesTool(protocolHandler, thoughtHandler);
  });

  async function call(input: Record<string, unknown>) {
    const raw = await tool.handle(input as any);
    return JSON.parse(raw.content[0].text);
  }

  it("full S=2 → reflect → resume cycle", async () => {
    await call({ operation: "init", problem: "test" });

    await call({ operation: "plan", primary: "a1", recovery: "r1" });
    const s1 = await call({ operation: "outcome", assessment: "unexpected-unfavorable", severity: 1 });
    expect(s1.S).toBe(1);

    await call({ operation: "plan", primary: "a2", recovery: "r2" });
    const s2 = await call({ operation: "outcome", assessment: "unexpected-unfavorable", severity: 1 });
    expect(s2.S).toBe(2);

    await expect(
      call({ operation: "plan", primary: "blocked", recovery: "n/a" })
    ).rejects.toThrow(/REFLECT/);

    const r = await call({
      operation: "reflect",
      hypothesis: "root cause",
      falsification: "disproof criteria",
    });
    expect(r.S).toBe(0);

    const p3 = await call({ operation: "plan", primary: "a3", recovery: "r3" });
    expect(p3.S).toBe(1);
  });

  // BUG: bridge silently returns when no session exists.
  // bridgeThought checks getCurrentSessionId() → null → return.
  // Protocol thoughts are invisible in session timeline.
  it.fails("bridge creates session when none exists", async () => {
    expect(thoughtHandler.getCurrentSessionId()).toBeNull();

    await call({ operation: "init", problem: "test bridge" });

    expect(thoughtHandler.getCurrentSessionId()).not.toBeNull();
  });

  it("expected outcome resets S to 0", async () => {
    await call({ operation: "init", problem: "test" });
    await call({ operation: "plan", primary: "a", recovery: "r" });
    const surprise = await call({ operation: "outcome", assessment: "unexpected-unfavorable", severity: 1 });
    expect(surprise.S).toBe(1);

    await call({ operation: "plan", primary: "a2", recovery: "r2" });
    const expected = await call({ operation: "outcome", assessment: "expected" });
    expect(expected.S).toBe(0);
  });
});

// =============================================================================
// Theseus protocol e2e through tool layer
// =============================================================================

describe("Theseus protocol e2e through tool layer", () => {
  let thoughtHandler: ThoughtHandler;
  let tool: TheseusTool;

  beforeEach(() => {
    const protocolHandler = new InMemoryProtocolHandler();
    thoughtHandler = new ThoughtHandler(true);
    tool = new TheseusTool(protocolHandler, thoughtHandler);
  });

  async function call(input: Record<string, unknown>) {
    const raw = await tool.handle(input as any);
    return JSON.parse(raw.content[0].text);
  }

  // BUG: same as Ulysses — bridge silently returns when no session exists
  it.fails("bridge creates session when none exists", async () => {
    expect(thoughtHandler.getCurrentSessionId()).toBeNull();

    await call({
      operation: "init",
      scope: ["src/foo.ts"],
      description: "test",
    });

    expect(thoughtHandler.getCurrentSessionId()).not.toBeNull();
  });

  it("B counter increments on test failure, resets on pass", async () => {
    await call({ operation: "init", scope: ["src/foo.ts"] });

    const fail = await call({ operation: "outcome", testsPassed: false });
    expect(fail.B).toBe(1);

    const pass = await call({ operation: "outcome", testsPassed: true });
    expect(pass.B).toBe(0);
  });

  it("visa expands scope", async () => {
    await call({ operation: "init", scope: ["src/foo.ts"] });

    const visa = await call({
      operation: "visa",
      filePath: "src/bar.ts",
      justification: "need it",
    });
    expect(visa.visa_granted).toBe(true);

    const status = await call({ operation: "status" });
    expect(status.scope.map((s: any) => s.file_path)).toContain("src/bar.ts");
  });
});
