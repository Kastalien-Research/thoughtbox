import { describe, expect, it } from "vitest";
import { InMemoryProtocolHandler } from "../index.js";
import {
  FAIL_OBSERVED,
  PASS_OBSERVED,
  makeUlyssesTestEnv,
} from "./ulysses-test-helpers.js";

/**
 * Validator-specific Ulysses tests:
 * - validator tampering forces S=2
 * - final-validator gates complete(resolved)
 * - non-resolved terminals don't run the final validator
 */

async function newSession() {
  const env = await makeUlyssesTestEnv();
  const handler = new InMemoryProtocolHandler();
  handler.setValidatorService(env.notebookHandler.getValidatorService());
  const init = await handler.ulyssesInit("bug");
  return { handler, env, sid: init.session_id as string };
}

describe("Ulysses validator integration", () => {
  it("plan throws when ValidatorService is not configured", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await expect(
      handler.ulyssesPlan(sid, {
        primary: "a",
        recovery: "b",
        irreversible: false,
        primaryValidator: { notebookId: "x", cellId: "y" },
        recoveryValidator: { notebookId: "x", cellId: "y" },
      }),
    ).rejects.toThrow(/ValidatorService not configured/);
  });

  it("validator hash mismatch forces S=2 and records validator_tampering", async () => {
    const { handler, env, sid } = await newSession();

    await handler.ulyssesPlan(sid, {
      primary: "primary",
      recovery: "recovery",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });

    // Tamper with the cell after binding.
    await env.notebookHandler.handleUpdateCell({
      notebookId: env.decider.notebookId,
      cellId: env.decider.cellId,
      content:
        "import { pass } from './tb-validate.js'; pass('always-yes');",
    });

    // Hack: directly mutate the bound snapshot inside the active step so the
    // server thinks the snapshot changed. We simulate this by calling outcome
    // — the run-time hash will match the binding (we never re-fetch from the
    // notebook), so we instead corrupt the binding to force a mismatch path.
    // Easiest: corrupt via private state surgery for the test.
    // (In production, hash mismatch happens when state_json is rehydrated from
    // a cold session and the binding hash no longer matches the snapshot it
    // was serialised with — e.g. due to manual state_json edits.)
    const session = (handler as any).sessions[0];
    const step = (session.state_json as any).active_step;
    step.primaryValidator.snapshot.source = "// edited";
    // expectedSnapshotHash on the binding still points at the original hash.

    const result = await handler.ulyssesOutcome(sid, {
      observed: PASS_OBSERVED,
    });

    expect(result.assessment).toBe("unexpected-unfavorable");
    expect(result.S).toBe(2);
    expect(result.validatorTampering).toBe(true);
  }, 30_000);

  it("complete(resolved) is rejected when no final validator is bound", async () => {
    const { handler, sid } = await newSession();
    await expect(
      handler.ulyssesComplete(sid, "resolved", "shipped", PASS_OBSERVED),
    ).rejects.toThrow(/final validator is bound/);
  });

  it("complete(resolved) requires observed when a final validator is bound", async () => {
    const { handler, env, sid } = await newSession();
    await handler.ulyssesBindFinalValidator(sid, env.decider);
    await expect(
      handler.ulyssesComplete(sid, "resolved", "shipped"),
    ).rejects.toThrow(/'observed'/);
  });

  it("complete(resolved) succeeds when final validator passes", async () => {
    const { handler, env, sid } = await newSession();
    await handler.ulyssesBindFinalValidator(sid, env.decider);

    const result = await handler.ulyssesComplete(
      sid,
      "resolved",
      "fixed it",
      PASS_OBSERVED,
    );

    expect(result.status).toBe("resolved");
    expect((result.finalValidation as any).pass).toBe(true);
  }, 30_000);

  it("complete(resolved) is rejected when final validator fails", async () => {
    const { handler, env, sid } = await newSession();
    await handler.ulyssesBindFinalValidator(sid, env.decider);

    await expect(
      handler.ulyssesComplete(sid, "resolved", "claim fixed", FAIL_OBSERVED),
    ).rejects.toThrow(/Final validator rejected resolution/);
  }, 30_000);

  it("non-resolved terminals do not require the final validator", async () => {
    const { handler, sid } = await newSession();
    // No bindFinalValidator call.
    const r1 = await handler.ulyssesComplete(
      sid,
      "insufficient_information",
      "ran out of leads",
    );
    expect(r1.status).toBe("insufficient_information");

    // Fresh session for the second terminal
    const r2Init = await handler.ulyssesInit("bug2");
    const r2 = await handler.ulyssesComplete(
      r2Init.session_id as string,
      "environment_compromised",
      "lab caught fire",
    );
    expect(r2.status).toBe("environment_compromised");
  });

  it("bindFinalValidator emits a final_validator_bound history event", async () => {
    const { handler, env, sid } = await newSession();
    await handler.ulyssesBindFinalValidator(sid, env.decider);

    const history = (handler as any).history as Array<{
      event_type: string;
      session_id: string;
    }>;
    const events = history.filter(
      (h) => h.session_id === sid && h.event_type === "final_validator_bound",
    );
    expect(events.length).toBe(1);
  });

  it("verdict event_json carries the observed payload, snapshotHash, and verdict", async () => {
    const { handler, env, sid } = await newSession();
    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
      primaryValidator: env.decider,
      recoveryValidator: env.decider,
    });
    await handler.ulyssesOutcome(sid, { observed: PASS_OBSERVED });

    const history = (handler as any).history as Array<{
      event_type: string;
      session_id: string;
      event_json: Record<string, unknown>;
    }>;
    const ev = history.find(
      (h) => h.session_id === sid && h.event_type === "outcome",
    );
    expect(ev).toBeDefined();
    expect(ev!.event_json.derivedAssessment).toBe("expected");
    expect(ev!.event_json.observed).toEqual(PASS_OBSERVED);
    expect((ev!.event_json.validator as any).snapshotHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect((ev!.event_json.verdict as any).pass).toBe(true);
  }, 30_000);
});
