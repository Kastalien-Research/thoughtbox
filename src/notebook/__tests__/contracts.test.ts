import { describe, expect, it } from "vitest";
import {
  checkJsonSchemaSubset,
  compileOutcomeContract,
  ContractCompileError,
  ContractHashMismatchError,
  evaluateExpectation,
  expectationRecordFromValidation,
  resolveJsonPointer,
  skippedValidatorRecord,
  verifyAttachedContract,
  type ExpectationEvaluationContext,
  type OutcomeExpectation,
} from "../contracts.js";

function contract(expectations: unknown[]): unknown {
  return { schemaVersion: "outcome-contract.v0", expectations };
}

const completedContext = (
  overrides: Partial<ExpectationEvaluationContext> = {},
): ExpectationEvaluationContext => ({
  cellId: "cell_1",
  cellStatus: "completed",
  exitCode: 0,
  ...overrides,
});

describe("outcome contract compile path", () => {
  it("compiles a valid contract with a canonical sha256 hash", () => {
    const attached = compileOutcomeContract(
      contract([{ source: { kind: "exitCode" }, op: "eq", value: 0 }]),
    );
    expect(attached.contractHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(attached.contract.expectations).toHaveLength(1);
  });

  it("hashes are key-order independent (canonicalization)", () => {
    const a = compileOutcomeContract({
      schemaVersion: "outcome-contract.v0",
      expectations: [{ source: { kind: "exitCode" }, op: "eq", value: 0 }],
    });
    const b = compileOutcomeContract({
      expectations: [{ value: 0, op: "eq", source: { kind: "exitCode" } }],
      schemaVersion: "outcome-contract.v0",
    });
    expect(a.contractHash).toBe(b.contractHash);
  });

  it("rejects empty expectation lists", () => {
    expect(() => compileOutcomeContract(contract([]))).toThrow(ContractCompileError);
  });

  it("rejects ordered ops with non-numeric values", () => {
    expect(() =>
      compileOutcomeContract(
        contract([{ source: { kind: "exitCode" }, op: "lt", value: "ten" }]),
      ),
    ).toThrow(/numeric value/);
  });

  it("rejects matches with an invalid regex", () => {
    expect(() =>
      compileOutcomeContract(
        contract([{ source: { kind: "output", pointer: "/x" }, op: "matches", value: "(" }]),
      ),
    ).toThrow(/not a valid regex/);
  });

  it("rejects schema op with a non-subset value", () => {
    expect(() =>
      compileOutcomeContract(
        contract([{ source: { kind: "output", pointer: "" }, op: "schema", value: { type: "integer" } }]),
      ),
    ).toThrow(/JSON Schema subset/);
  });

  it("rejects unknown source kinds and malformed pointers", () => {
    expect(() =>
      compileOutcomeContract(contract([{ source: { kind: "stdout" }, op: "eq", value: 1 }])),
    ).toThrow(ContractCompileError);
    expect(() =>
      compileOutcomeContract(
        contract([{ source: { kind: "output", pointer: "x/y" }, op: "eq", value: 1 }]),
      ),
    ).toThrow(/JSON pointer/);
  });

  it("detects post-attach tampering via hash re-verification", () => {
    const attached = compileOutcomeContract(
      contract([{ source: { kind: "exitCode" }, op: "eq", value: 0 }]),
    );
    expect(() => verifyAttachedContract("cell_1", attached)).not.toThrow();

    const tampered = structuredClone(attached);
    (tampered.contract.expectations[0] as { value: unknown }).value = 1;
    expect(() => verifyAttachedContract("cell_1", tampered)).toThrow(
      ContractHashMismatchError,
    );
  });
});

describe("RFC 6901 JSON pointer resolution", () => {
  const doc = {
    metrics: { count: 3, "a/b": "slash", "m~n": "tilde" },
    items: [{ ok: true }, { ok: false }],
  };

  it('resolves "" to the whole document', () => {
    expect(resolveJsonPointer(doc, "")).toEqual({ found: true, value: doc });
  });

  it("resolves nested properties and array indices", () => {
    expect(resolveJsonPointer(doc, "/metrics/count")).toEqual({ found: true, value: 3 });
    expect(resolveJsonPointer(doc, "/items/1/ok")).toEqual({ found: true, value: false });
  });

  it("unescapes ~1 and ~0 tokens", () => {
    expect(resolveJsonPointer(doc, "/metrics/a~1b")).toEqual({ found: true, value: "slash" });
    expect(resolveJsonPointer(doc, "/metrics/m~0n")).toEqual({ found: true, value: "tilde" });
  });

  it("reports missing properties, bad indices, and non-container descent", () => {
    expect(resolveJsonPointer(doc, "/metrics/missing").found).toBe(false);
    expect(resolveJsonPointer(doc, "/items/9").found).toBe(false);
    expect(resolveJsonPointer(doc, "/items/01").found).toBe(false);
    expect(resolveJsonPointer(doc, "/metrics/count/deeper").found).toBe(false);
  });
});

describe("tier-1 expectation evaluation (pass/fail/error/skipped)", () => {
  const exitZero: OutcomeExpectation = { source: { kind: "exitCode" }, op: "eq", value: 0 };

  it("passes when the extracted actual satisfies the op", () => {
    const record = evaluateExpectation(exitZero, completedContext());
    expect(record).toMatchObject({ result: "pass", tier: 1, actual: 0 });
  });

  it("fails when evaluated false — and fail is not error", () => {
    const record = evaluateExpectation(exitZero, completedContext({ exitCode: 2 }));
    expect(record.result).toBe("fail");
    expect(record.error).toBeUndefined();
    expect(record.actual).toBe(2);
  });

  it("errors when the exit code is unavailable", () => {
    const record = evaluateExpectation(exitZero, completedContext({ exitCode: null }));
    expect(record.result).toBe("error");
    expect(record.error).toContain("exit code unavailable");
  });

  it("skips when the cell was never reached — skipped is not pass", () => {
    const record = evaluateExpectation(
      exitZero,
      completedContext({ cellStatus: "skipped", exitCode: null }),
    );
    expect(record.result).toBe("skipped");
  });

  it("extracts structured output via JSON pointer", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "output", pointer: "/metrics/count" },
      op: "gte",
      value: 3,
    };
    const record = evaluateExpectation(
      expectation,
      completedContext({ structuredOutputRaw: '{"metrics":{"count":3}}' }),
    );
    expect(record).toMatchObject({ result: "pass", actual: 3 });
  });

  it("errors on a missing pointer (never fail, never pass)", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "output", pointer: "/metrics/missing" },
      op: "eq",
      value: 1,
    };
    const record = evaluateExpectation(
      expectation,
      completedContext({ structuredOutputRaw: '{"metrics":{}}' }),
    );
    expect(record.result).toBe("error");
    expect(record.error).toContain("not found");
  });

  it("errors when the cell wrote no structured output", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "output", pointer: "/x" },
      op: "eq",
      value: 1,
    };
    const record = evaluateExpectation(expectation, completedContext());
    expect(record.result).toBe("error");
    expect(record.error).toContain("TB_OUTPUT_PATH");
  });

  it("errors when structured output is not valid JSON", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "output", pointer: "" },
      op: "eq",
      value: 1,
    };
    const record = evaluateExpectation(
      expectation,
      completedContext({ structuredOutputRaw: "not json" }),
    );
    expect(record.result).toBe("error");
  });

  it("errors on output expectations when the cell failed pre-assertion", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "output", pointer: "/x" },
      op: "eq",
      value: 1,
    };
    const record = evaluateExpectation(
      expectation,
      completedContext({
        cellStatus: "failed",
        exitCode: 1,
        structuredOutputRaw: '{"x":1}',
      }),
    );
    expect(record.result).toBe("error");
  });

  it("still evaluates exitCode expectations on failed cells", () => {
    const expectation: OutcomeExpectation = { source: { kind: "exitCode" }, op: "eq", value: 2 };
    const record = evaluateExpectation(
      expectation,
      completedContext({ cellStatus: "failed", exitCode: 2 }),
    );
    expect(record.result).toBe("pass");
  });

  it("supports ne, matches, and schema ops; type mismatches are errors", () => {
    const raw = '{"status":"green","count":7}';
    const ne = evaluateExpectation(
      { source: { kind: "output", pointer: "/status" }, op: "ne", value: "red" },
      completedContext({ structuredOutputRaw: raw }),
    );
    expect(ne.result).toBe("pass");

    const matches = evaluateExpectation(
      { source: { kind: "output", pointer: "/status" }, op: "matches", value: "^gr" },
      completedContext({ structuredOutputRaw: raw }),
    );
    expect(matches.result).toBe("pass");

    const matchesNonString = evaluateExpectation(
      { source: { kind: "output", pointer: "/count" }, op: "matches", value: "^7$" },
      completedContext({ structuredOutputRaw: raw }),
    );
    expect(matchesNonString.result).toBe("error");

    const ltNonNumber = evaluateExpectation(
      { source: { kind: "output", pointer: "/status" }, op: "lt", value: 5 },
      completedContext({ structuredOutputRaw: raw }),
    );
    expect(ltNonNumber.result).toBe("error");

    const schemaPass = evaluateExpectation(
      {
        source: { kind: "output", pointer: "" },
        op: "schema",
        value: { type: "object", required: ["status"], properties: { count: { type: "number" } } },
      },
      completedContext({ structuredOutputRaw: raw }),
    );
    expect(schemaPass.result).toBe("pass");

    const schemaFail = evaluateExpectation(
      { source: { kind: "output", pointer: "" }, op: "schema", value: { type: "object", required: ["missing"] } },
      completedContext({ structuredOutputRaw: raw }),
    );
    expect(schemaFail.result).toBe("fail");
  });

  it("extracts from run artifacts by name", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "artifact", name: "inputs.json", pointer: "/dataset" },
      op: "eq",
      value: "demo",
    };
    const record = evaluateExpectation(
      expectation,
      completedContext({
        readArtifact: (name) => (name === "inputs.json" ? '{"dataset":"demo"}' : undefined),
      }),
    );
    expect(record).toMatchObject({ result: "pass", actual: "demo" });

    const missing = evaluateExpectation(
      { source: { kind: "artifact", name: "nope.json" }, op: "eq", value: 1 },
      completedContext({ readArtifact: () => undefined }),
    );
    expect(missing.result).toBe("error");
    expect(missing.error).toContain("not found");
  });

  it("claim-status expectations error with a clear message until the resolver is wired", () => {
    const expectation: OutcomeExpectation = {
      source: { kind: "claimStatus", claimId: "claim_42" },
      op: "eq",
      value: "supported",
    };
    const unwired = evaluateExpectation(expectation, completedContext());
    expect(unwired.result).toBe("error");
    expect(unwired.error).toBe("claim resolver not wired");

    const wired = evaluateExpectation(
      expectation,
      completedContext({ claimResolver: { resolve: () => "supported" } }),
    );
    expect(wired.result).toBe("pass");
  });
});

describe("JSON Schema subset checker", () => {
  it("checks types, required, nested properties, items, and additionalProperties", () => {
    expect(checkJsonSchemaSubset({ a: 1 }, { type: "object" })).toBeNull();
    expect(checkJsonSchemaSubset([], { type: "object" })).toContain("expected type object");
    expect(checkJsonSchemaSubset(null, { type: "null" })).toBeNull();
    expect(
      checkJsonSchemaSubset({ a: { b: "x" } }, { properties: { a: { properties: { b: { type: "number" } } } } }),
    ).toContain("properties.a");
    expect(checkJsonSchemaSubset([1, "two"], { items: { type: "number" } })).toContain("items[1]");
    expect(
      checkJsonSchemaSubset({ a: 1, b: 2 }, { properties: { a: {} }, additionalProperties: false }),
    ).toContain('additional property "b"');
  });
});

describe("tier-2 validator verdict mapping", () => {
  const base = { validatorCellId: "val_1", targetCellId: "step_1" };

  it("maps a passing validator verdict to a tier-2 pass record", () => {
    const record = expectationRecordFromValidation({
      ...base,
      result: { pass: true, reason: "count is 3", hashMatched: true, exitCode: 0 },
    });
    expect(record).toMatchObject({ tier: 2, result: "pass", cellId: "val_1" });
  });

  it("maps a verdict-written fail to fail, not error", () => {
    const record = expectationRecordFromValidation({
      ...base,
      result: { pass: false, reason: "count != 3", evidence: { count: 5 }, hashMatched: true, exitCode: 0 },
    });
    expect(record.result).toBe("fail");
    expect(record.error).toBeUndefined();
  });

  it("maps machinery failures (crash, timeout, malformed, hash mismatch) to error", () => {
    for (const reason of [
      "validator_crash",
      "validator_timeout_or_crash",
      "malformed_verdict",
      "snapshot_hash_mismatch",
    ]) {
      const record = expectationRecordFromValidation({
        ...base,
        result: { pass: false, reason, hashMatched: reason !== "snapshot_hash_mismatch", exitCode: 1 },
      });
      expect(record.result).toBe("error");
      expect(record.error).toBe(reason);
    }
  });

  it("produces skipped records for unreached validators", () => {
    expect(skippedValidatorRecord("val_1", "step_1").result).toBe("skipped");
  });
});
