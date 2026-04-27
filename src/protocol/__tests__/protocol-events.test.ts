import { describe, expect, it, vi } from "vitest";
import { InMemoryProtocolHandler } from "../in-memory-handler.js";
import type { ThoughtboxEvent } from "../../events/types.js";
import {
  FAIL_OBSERVED,
  makeUlyssesTestEnv,
} from "./ulysses-test-helpers.js";

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
    const env = await makeUlyssesTestEnv();
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setValidatorService(env.notebookHandler.getValidatorService());
    handler.setProject("test-ws");

    const initResult = await handler.ulyssesInit("bug", []);
    const sessionId = initResult.session_id as string;

    await handler.ulyssesPlan(sessionId, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    onEvent.mockClear();

    await handler.ulyssesOutcome(sessionId, {
      observed: FAIL_OBSERVED,
      details: "logs were empty",
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ulysses_outcome",
        data: expect.objectContaining({
          assessment: "unexpected-unfavorable",
          S: expect.any(Number),
        }),
      }),
    );
  }, 30_000);

  it("emits ulysses_reflect when S=2 and reflect called", async () => {
    const env = await makeUlyssesTestEnv();
    const onEvent = vi.fn();
    const handler = new InMemoryProtocolHandler(onEvent);
    handler.setValidatorService(env.notebookHandler.getValidatorService());
    handler.setProject("test-ws");

    const initResult = await handler.ulyssesInit("bug", []);
    const sessionId = initResult.session_id as string;

    // Drive S to 2: plan → S=1, primary fails → S=2, backup fails → S=2 reflect required
    await handler.ulyssesPlan(sessionId, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sessionId, { observed: FAIL_OBSERVED, details: "x" });
    await handler.ulyssesOutcome(sessionId, { observed: FAIL_OBSERVED, details: "y" });

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
