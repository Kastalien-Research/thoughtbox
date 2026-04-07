import { describe, expect, it, vi } from "vitest";
import { InMemoryProtocolHandler } from "../in-memory-handler.js";
import type { ThoughtboxEvent } from "../../events/types.js";

describe("protocol event emission", () => {
  it("emits ulysses_init on session creation", async () => {
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setProject("test-ws");

    await handler.ulyssesInit("test problem", ["no side effects"]);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "protocol",
        type: "ulysses_init",
        workspaceId: "test-ws",
        data: expect.objectContaining({ problem: "test problem" }),
      }),
    );
  });

  it("emits ulysses_outcome with S value on surprise", async () => {
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setProject("test-ws");

    const initResult = await handler.ulyssesInit("bug", []);
    const sessionId = initResult.session_id as string;

    await handler.ulyssesPlan(sessionId, {
      primary: "check logs",
      recovery: "check metrics",
    });

    onEvent.mockClear();

    await handler.ulyssesOutcome(sessionId, {
      assessment: "unexpected",
      details: "logs were empty",
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ulysses_outcome",
        data: expect.objectContaining({
          assessment: "unexpected",
          S: expect.any(Number),
        }),
      }),
    );
  });

  it("emits ulysses_reflect when S=2 and reflect called", async () => {
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setProject("test-ws");

    const initResult = await handler.ulyssesInit("bug", []);
    const sessionId = initResult.session_id as string;

    // Drive S to 2 with two surprises
    await handler.ulyssesPlan(sessionId, { primary: "a", recovery: "b" });
    await handler.ulyssesOutcome(sessionId, { assessment: "unexpected", details: "x" });
    await handler.ulyssesPlan(sessionId, { primary: "c", recovery: "d" });
    await handler.ulyssesOutcome(sessionId, { assessment: "unexpected", details: "y" });

    onEvent.mockClear();

    await handler.ulyssesReflect(sessionId, {
      hypothesis: "the config is wrong",
      falsification: "if changing config doesn't fix it, hypothesis is false",
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ulysses_reflect",
        data: expect.objectContaining({
          hypothesis: "the config is wrong",
        }),
      }),
    );
  });

  it("emits theseus_init on session creation", async () => {
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setProject("test-ws");

    await handler.theseusInit(
      [{ file_path: "src/foo.ts" }],
      "refactor foo",
    );

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "protocol",
        type: "theseus_init",
        data: expect.objectContaining({
          description: "refactor foo",
        }),
      }),
    );
  });

  it("emits theseus_visa on scope expansion", async () => {
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setProject("test-ws");

    const initResult = await handler.theseusInit(
      [{ file_path: "src/foo.ts" }],
      "refactor",
    );
    const sessionId = initResult.session_id as string;

    onEvent.mockClear();

    await handler.theseusVisa(sessionId, {
      filePath: "src/bar.ts",
      justification: "needed for the refactor",
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "theseus_visa",
        data: expect.objectContaining({
          filePath: "src/bar.ts",
          justification: "needed for the refactor",
        }),
      }),
    );
  });

  it("does not emit when no callback provided", async () => {
    const handler = new InMemoryProtocolHandler();
    handler.setProject("test-ws");

    // Should not throw
    await handler.ulyssesInit("test", []);
  });
});
