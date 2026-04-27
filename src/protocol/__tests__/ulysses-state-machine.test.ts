import { describe, expect, it } from "vitest";
import { InMemoryProtocolHandler } from "../index.js";
import {
  FAIL_OBSERVED,
  PASS_OBSERVED,
  makeUlyssesTestEnv,
} from "./ulysses-test-helpers.js";

/**
 * Complete Ulysses state machine test coverage with validator-bound plans.
 *
 * States:
 *   A: S=0, active_step=null (checkpoint)
 *   B: S=1, active_step set (primary executing)
 *   C: S=2, active_step set (backup executing)
 *   D: S=2, active_step=null (reflect required)
 *
 * Outcome assessments are derived from notebook validator cells, not agent
 * self-report.
 */

async function newHandler() {
  const env = await makeUlyssesTestEnv();
  const handler = new InMemoryProtocolHandler();
  handler.setValidatorService(env.notebookHandler.getValidatorService());
  return { handler, env };
}

describe("Ulysses state machine", () => {
  // ---------------------------------------------------------------------------
  // Valid transitions
  // ---------------------------------------------------------------------------

  // A → plan → B
  it("plan transitions S=0 → S=1 with active_step set and validator bindings", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    const result = await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    expect(result.S).toBe(1);
    expect(result.primary).toBe("check logs");
    expect(result.recovery).toBe("check metrics");
    expect((result.primaryValidator as any).snapshotHash).toMatch(/^[a-f0-9]{64}$/);

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toMatchObject({
      primary: "check logs",
      recovery: "check metrics",
    });
  });

  // B → outcome(validator pass) → A
  it("validator pass at S=1 → S=0, checkpoint created", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    const result = await handler.ulyssesOutcome(sid, {
      observed: PASS_OBSERVED,
    });

    expect(result.assessment).toBe("expected");
    expect(result.S).toBe(0);
    expect(result.message).toContain("Checkpoint");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toBeNull();
  }, 30_000);

  // B → outcome(validator fail) → C
  it("validator fail at S=1 → S=2, active_step retained for backup", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    const result = await handler.ulyssesOutcome(sid, {
      observed: FAIL_OBSERVED,
    });

    expect(result.assessment).toBe("unexpected-unfavorable");
    expect(result.S).toBe(2);
    expect(result.message).toContain("recovery");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).not.toBeNull();
  }, 30_000);

  // C → outcome(validator pass) → A
  it("validator pass at S=2 (backup succeeded) → S=0, checkpoint created", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    const result = await handler.ulyssesOutcome(sid, { observed: PASS_OBSERVED });

    expect(result.assessment).toBe("expected");
    expect(result.S).toBe(0);

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toBeNull();
  }, 30_000);

  // C → outcome(validator fail) → D
  it("validator fail at S=2 (both moves rejected) → reflect required, forbidden_moves populated", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    const result = await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    expect(result.S).toBe(2);
    expect(result.message).toContain("REFLECT");
    expect(result.forbidden_moves).toContain("check logs");
    expect(result.forbidden_moves).toContain("check metrics");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toBeNull();
  }, 30_000);

  // D → reflect → A
  it("reflect at S=2 (active_step null) → S=0", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    const result = await handler.ulyssesReflect(sid, {
      hypothesis: "config is wrong",
      falsification: "changing config doesn't fix it",
    });

    expect(result.S).toBe(0);
  }, 30_000);

  // ---------------------------------------------------------------------------
  // Error transitions
  // ---------------------------------------------------------------------------

  // D → plan → error
  it("plan at S=2 (reflect required) throws REFLECT error", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    await expect(
      handler.ulyssesPlan(sid, {
        primary: "x",
        recovery: "y",
        irreversible: false,
        primaryValidator: env.decider,
        recoveryValidator: env.decider,
      }),
    ).rejects.toThrow(/REFLECT/);
  }, 30_000);

  // C → reflect → error
  it("reflect at S=2 with active_step still set throws backup-pending error", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    await expect(
      handler.ulyssesReflect(sid, {
        hypothesis: "h",
        falsification: "f",
      }),
    ).rejects.toThrow(/Backup move outcome not yet reported/);
  }, 30_000);

  // A → outcome → error
  it("outcome with no active_step throws error", async () => {
    const { handler } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await expect(
      handler.ulyssesOutcome(sid, { observed: PASS_OBSERVED }),
    ).rejects.toThrow(/No active step/);
  });

  // B → reflect → error
  it("reflect at S=1 throws S≠2 error", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    await expect(
      handler.ulyssesReflect(sid, {
        hypothesis: "h",
        falsification: "f",
      }),
    ).rejects.toThrow(/REFLECT requires S=2/);
  });

  // ---------------------------------------------------------------------------
  // Enforcement sub-states
  // ---------------------------------------------------------------------------

  // A → not blocked
  it("enforcement allows mutations at S=0 (checkpoint)", async () => {
    const { handler } = await newHandler();
    await handler.ulyssesInit("bug");

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(false);
  });

  // B → not blocked
  it("enforcement allows mutations at S=1 (primary executing)", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(false);
  });

  // C → not blocked
  it("enforcement allows mutations at S=2 with active_step (backup executing)", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(false);
  }, 30_000);

  // D → blocked
  it("enforcement blocks mutations at S=2 with no active_step (reflect required)", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(true);
    expect(result.blocked).toBe(true);
    expect(result.required_action).toBe("reflect");
  }, 30_000);

  // ---------------------------------------------------------------------------
  // Data correctness
  // ---------------------------------------------------------------------------

  it("forbidden_moves contains both primary and recovery after both fail", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    const result = await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    expect(result.forbidden_moves).toEqual(
      expect.arrayContaining(["check logs", "check metrics"]),
    );
  }, 30_000);

  it("forbidden_moves accumulate across multiple cycles", async () => {
    const { handler, env } = await newHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    // First cycle: both moves fail
    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    // Reflect → S=0
    await handler.ulyssesReflect(sid, {
      hypothesis: "h1",
      falsification: "f1",
    });

    // Second cycle: both moves fail again
    await handler.ulyssesPlan(sid, {
      primary: "check env",
      recovery: "check config",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });
    const result = await handler.ulyssesOutcome(sid, { observed: FAIL_OBSERVED });

    expect(result.forbidden_moves).toEqual(
      expect.arrayContaining([
        "check logs",
        "check metrics",
        "check env",
        "check config",
      ]),
    );
  }, 60_000);
});
