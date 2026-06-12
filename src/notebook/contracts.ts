/**
 * Outcome contracts — typed per-cell expectations for honest runbook verdicts
 * (SPEC-AGX-SUBSTRATE B4a, claim c3 template/contract half).
 *
 * Design (adopted 2026-06-12):
 * - Tier 1 (declarative): a contract is pure data `{ source, op, value }`,
 *   authored alongside the cell and validated with zod on the compile path
 *   (extract → zod → canonicalize → sha256 — the same parse-only pattern as
 *   `src/peer-notebook/manifest.ts`).
 * - Tier 2 (executable): the existing validator-cell machinery
 *   (ValidatorService snapshot+hash); its verdicts map into the same
 *   per-expectation record model via `expectationRecordFromValidation`.
 * - Binding at authoring, hash-checked at run (Ulysses pattern): the contract
 *   hash is computed when the contract is attached and re-verified before any
 *   cell executes; mismatch means tampering and the run is rejected.
 * - Result semantics: pass | fail | error | skipped. `error` = could not
 *   evaluate; `fail` = evaluated false; `skipped` = cell never reached.
 *   skipped and error are NEVER pass.
 * - Actuals come from declared channels only: exit code, JSON pointer
 *   (RFC 6901) into the cell's structured output sidecar (TB_OUTPUT_PATH),
 *   run artifact content, or claim status. Free-text stdout is never scraped.
 */

import { z } from "zod";
import { canonicalizeJson, hashJson } from "../peer-notebook/manifest.js";

// ---------------------------------------------------------------------------
// Schemas (zod — contracts are authored external data on the compile path)
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ]),
);

/** Minimal JSON Schema subset for the `schema` op — mirrors the peer-manifest subset. */
export interface ContractJsonSchemaSubset {
  type?: "object" | "array" | "string" | "number" | "boolean" | "null";
  properties?: Record<string, ContractJsonSchemaSubset>;
  required?: string[];
  items?: ContractJsonSchemaSubset;
  additionalProperties?: boolean;
}

const ContractJsonSchemaSubsetSchema: z.ZodType<ContractJsonSchemaSubset> = z.lazy(() =>
  z.object({
    type: z.enum(["object", "array", "string", "number", "boolean", "null"]).optional(),
    properties: z.record(ContractJsonSchemaSubsetSchema).optional(),
    required: z.array(z.string()).optional(),
    items: ContractJsonSchemaSubsetSchema.optional(),
    additionalProperties: z.boolean().optional(),
  }) as z.ZodType<ContractJsonSchemaSubset>,
);

const JsonPointerSchema = z
  .string()
  .refine((p) => p === "" || p.startsWith("/"), {
    message: 'JSON pointer must be "" (whole document) or start with "/" (RFC 6901)',
  });

const ExpectationSourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("exitCode") }),
  z.object({ kind: z.literal("output"), pointer: JsonPointerSchema }),
  z.object({
    kind: z.literal("artifact"),
    name: z.string().min(1),
    pointer: JsonPointerSchema.optional(),
  }),
  z.object({ kind: z.literal("claimStatus"), claimId: z.string().min(1) }),
]);
export type ExpectationSource = z.infer<typeof ExpectationSourceSchema>;

export const OutcomeOpSchema = z.enum([
  "eq",
  "ne",
  "lt",
  "lte",
  "gt",
  "gte",
  "matches",
  "schema",
]);
export type OutcomeOp = z.infer<typeof OutcomeOpSchema>;

const ORDERED_OPS: ReadonlySet<OutcomeOp> = new Set(["lt", "lte", "gt", "gte"]);

export const OutcomeExpectationSchema = z
  .object({
    source: ExpectationSourceSchema,
    op: OutcomeOpSchema,
    value: JsonValueSchema,
    description: z.string().optional(),
  })
  .superRefine((expectation, ctx) => {
    const { op, value } = expectation;
    if (ORDERED_OPS.has(op) && typeof value !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: `op "${op}" requires a numeric value`,
      });
    }
    if (op === "matches") {
      if (typeof value !== "string") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: 'op "matches" requires a string regex value',
        });
      } else {
        try {
          const compiled = new RegExp(value);
          void compiled;
        } catch (error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["value"],
            message: `op "matches" value is not a valid regex: ${
              error instanceof Error ? error.message : String(error)
            }`,
          });
        }
      }
    }
    if (op === "schema" && !ContractJsonSchemaSubsetSchema.safeParse(value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message:
          'op "schema" requires a JSON Schema subset value ' +
          "(type/properties/required/items/additionalProperties)",
      });
    }
  });
export type OutcomeExpectation = z.infer<typeof OutcomeExpectationSchema>;

export const OutcomeContractSchema = z.object({
  schemaVersion: z.literal("outcome-contract.v0"),
  expectations: z.array(OutcomeExpectationSchema).min(1),
});
export type OutcomeContract = z.infer<typeof OutcomeContractSchema>;

export const AttachedContractSchema = z.object({
  contract: OutcomeContractSchema,
  contractHash: z.string().min(1),
  attachedAt: z.string().min(1),
});
export type AttachedContract = z.infer<typeof AttachedContractSchema>;

// ---------------------------------------------------------------------------
// Compile path: extract → zod → canonicalize → sha256 (parse-only)
// ---------------------------------------------------------------------------

export class ContractCompileError extends Error {
  override readonly name = "ContractCompileError";
}

export class ContractHashMismatchError extends Error {
  override readonly name = "ContractHashMismatchError";

  constructor(
    readonly cellId: string,
    readonly expected: string,
    readonly actual: string,
  ) {
    super(
      `outcome contract hash mismatch on cell ${cellId}: expected ${expected}, ` +
        `got ${actual} — contract was modified after attach; run rejected`,
    );
  }
}

/** Compile an authored contract: zod-parse, canonicalize, hash. Throws ContractCompileError. */
export function compileOutcomeContract(input: unknown): AttachedContract {
  const parsed = OutcomeContractSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new ContractCompileError(`outcome contract failed validation: ${issues}`);
  }
  return {
    contract: parsed.data,
    contractHash: hashJson(parsed.data),
    attachedAt: new Date().toISOString(),
  };
}

/** Re-verify an attached contract's hash at run time. Throws ContractHashMismatchError. */
export function verifyAttachedContract(cellId: string, attached: AttachedContract): void {
  const liveHash = hashJson(attached.contract);
  if (liveHash !== attached.contractHash) {
    throw new ContractHashMismatchError(cellId, attached.contractHash, liveHash);
  }
}

// ---------------------------------------------------------------------------
// RFC 6901 JSON pointer resolution
// ---------------------------------------------------------------------------

export type PointerResolution =
  | { found: true; value: unknown }
  | { found: false; reason: string };

export function resolveJsonPointer(document: unknown, pointer: string): PointerResolution {
  if (pointer === "") return { found: true, value: document };
  if (!pointer.startsWith("/")) {
    return { found: false, reason: `invalid JSON pointer "${pointer}" — must start with "/"` };
  }
  const tokens = pointer
    .slice(1)
    .split("/")
    .map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current: unknown = document;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token)) {
        return { found: false, reason: `pointer token "${token}" is not a valid array index` };
      }
      const index = Number(token);
      if (index >= current.length) {
        return { found: false, reason: `array index ${index} out of bounds (length ${current.length})` };
      }
      current = current[index];
    } else if (current !== null && typeof current === "object") {
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        return { found: false, reason: `property "${token}" not found` };
      }
      current = (current as Record<string, unknown>)[token];
    } else {
      return { found: false, reason: `cannot descend into ${JSON.stringify(current)} with token "${token}"` };
    }
  }
  return { found: true, value: current };
}

// ---------------------------------------------------------------------------
// Per-expectation result model (shared by tier 1 and tier 2)
// ---------------------------------------------------------------------------

export type ExpectationResult = "pass" | "fail" | "error" | "skipped";

export interface ExpectationRecord {
  cellId: string;
  tier: 1 | 2;
  /** Human-readable description of what was asserted. */
  expectation: string;
  result: ExpectationResult;
  /** The declared expectation (tier 1) or validator descriptor (tier 2). */
  expected: unknown;
  /** The extracted actual (when evaluation reached comparison). */
  actual?: unknown;
  /** Populated when result is "error" or "skipped". */
  error?: string;
}

/** Narrow interface for claim-status resolution; wired when the claims layer merges. */
export interface ClaimStatusResolver {
  resolve(claimId: string): unknown;
}

export interface ExpectationEvaluationContext {
  cellId: string;
  cellStatus: "completed" | "failed" | "skipped";
  exitCode: number | null;
  /** Raw JSON text the cell wrote to its TB_OUTPUT_PATH sidecar, if any. */
  structuredOutputRaw?: string;
  /** Resolve a run artifact's content by name (exact or runId-prefixed). */
  readArtifact?: (name: string) => string | undefined;
  claimResolver?: ClaimStatusResolver;
}

export function describeExpectation(expectation: OutcomeExpectation): string {
  if (expectation.description) return expectation.description;
  const source = expectation.source;
  const sourceText =
    source.kind === "exitCode"
      ? "exitCode"
      : source.kind === "output"
        ? `output${source.pointer === "" ? "" : ` ${source.pointer}`}`
        : source.kind === "artifact"
          ? `artifact ${source.name}${source.pointer ? ` ${source.pointer}` : ""}`
          : `claimStatus ${source.claimId}`;
  return `${sourceText} ${expectation.op} ${JSON.stringify(expectation.value)}`;
}

/** Evaluate a tier-1 declarative expectation against a cell's declared channels. */
export function evaluateExpectation(
  expectation: OutcomeExpectation,
  context: ExpectationEvaluationContext,
): ExpectationRecord {
  const base = {
    cellId: context.cellId,
    tier: 1 as const,
    expectation: describeExpectation(expectation),
    expected: { source: expectation.source, op: expectation.op, value: expectation.value },
  };

  if (context.cellStatus === "skipped") {
    return { ...base, result: "skipped", error: "cell never reached (earlier cell failed)" };
  }

  const extraction = extractActual(expectation.source, context);
  if (!extraction.ok) {
    return { ...base, result: "error", error: extraction.error };
  }

  const comparison = applyOp(expectation.op, expectation.value, extraction.actual);
  if (!comparison.ok) {
    return { ...base, result: "error", actual: extraction.actual, error: comparison.error };
  }
  return { ...base, result: comparison.pass ? "pass" : "fail", actual: extraction.actual };
}

type Extraction = { ok: true; actual: unknown } | { ok: false; error: string };

function extractActual(
  source: ExpectationSource,
  context: ExpectationEvaluationContext,
): Extraction {
  switch (source.kind) {
    case "exitCode": {
      if (context.exitCode === null) {
        return { ok: false, error: "exit code unavailable (process did not report one)" };
      }
      return { ok: true, actual: context.exitCode };
    }
    case "output": {
      if (context.cellStatus === "failed") {
        return { ok: false, error: "cell failed before its structured output could be trusted" };
      }
      if (context.structuredOutputRaw === undefined) {
        return {
          ok: false,
          error:
            "cell declared a structured-output expectation but wrote nothing to TB_OUTPUT_PATH",
        };
      }
      return parseAndPoint(context.structuredOutputRaw, source.pointer, "structured output");
    }
    case "artifact": {
      const content = context.readArtifact?.(source.name);
      if (content === undefined) {
        return { ok: false, error: `run artifact "${source.name}" not found` };
      }
      return parseAndPoint(content, source.pointer ?? "", `artifact "${source.name}"`);
    }
    case "claimStatus": {
      if (!context.claimResolver) {
        return { ok: false, error: "claim resolver not wired" };
      }
      try {
        return { ok: true, actual: context.claimResolver.resolve(source.claimId) };
      } catch (error) {
        return {
          ok: false,
          error: `claim resolver failed for ${source.claimId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        };
      }
    }
  }
}

function parseAndPoint(raw: string, pointer: string, channel: string): Extraction {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      error: `${channel} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  const resolution = resolveJsonPointer(parsed, pointer);
  if (!resolution.found) {
    return { ok: false, error: `JSON pointer "${pointer}" not found in ${channel}: ${resolution.reason}` };
  }
  return { ok: true, actual: resolution.value };
}

type Comparison = { ok: true; pass: boolean } | { ok: false; error: string };

function applyOp(op: OutcomeOp, value: JsonValue, actual: unknown): Comparison {
  switch (op) {
    case "eq":
    case "ne": {
      let equal: boolean;
      try {
        equal = canonicalizeJson(actual) === canonicalizeJson(value);
      } catch (error) {
        return {
          ok: false,
          error: `actual is not comparable JSON: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
      return { ok: true, pass: op === "eq" ? equal : !equal };
    }
    case "lt":
    case "lte":
    case "gt":
    case "gte": {
      if (typeof actual !== "number" || Number.isNaN(actual)) {
        return { ok: false, error: `op "${op}" requires a numeric actual, got ${JSON.stringify(actual)}` };
      }
      const threshold = value as number;
      const pass =
        op === "lt"
          ? actual < threshold
          : op === "lte"
            ? actual <= threshold
            : op === "gt"
              ? actual > threshold
              : actual >= threshold;
      return { ok: true, pass };
    }
    case "matches": {
      if (typeof actual !== "string") {
        return { ok: false, error: `op "matches" requires a string actual, got ${JSON.stringify(actual)}` };
      }
      return { ok: true, pass: new RegExp(value as string).test(actual) };
    }
    case "schema": {
      const mismatch = checkJsonSchemaSubset(actual, value as ContractJsonSchemaSubset);
      return { ok: true, pass: mismatch === null };
    }
  }
}

/** Returns null when the value conforms, otherwise a mismatch description. */
export function checkJsonSchemaSubset(
  value: unknown,
  schema: ContractJsonSchemaSubset,
): string | null {
  if (schema.type !== undefined) {
    const matchesType =
      schema.type === "object"
        ? value !== null && typeof value === "object" && !Array.isArray(value)
        : schema.type === "array"
          ? Array.isArray(value)
          : schema.type === "null"
            ? value === null
            : typeof value === schema.type;
    if (!matchesType) {
      return `expected type ${schema.type}, got ${Array.isArray(value) ? "array" : value === null ? "null" : typeof value}`;
    }
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    for (let index = 0; index < value.length; index += 1) {
      const mismatch = checkJsonSchemaSubset(value[index], schema.items);
      if (mismatch !== null) return `items[${index}]: ${mismatch}`;
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(record, key)) {
        return `missing required property "${key}"`;
      }
    }
    if (schema.properties !== undefined) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          const mismatch = checkJsonSchemaSubset(record[key], propertySchema);
          if (mismatch !== null) return `properties.${key}: ${mismatch}`;
        }
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(record)) {
        if (!allowed.has(key)) return `unexpected additional property "${key}"`;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tier 2: map validator verdicts into the per-expectation result model
// ---------------------------------------------------------------------------

/** Structural subset of ValidationResult (src/notebook/types.ts) needed for mapping. */
export interface ValidatorOutcomeLike {
  pass: boolean;
  reason: string;
  evidence?: unknown;
  hashMatched: boolean;
  exitCode: number | null;
}

/**
 * Reasons the validator machinery emits when it could not obtain a verdict.
 * These map to "error" (could not evaluate), never to "fail".
 */
const VALIDATOR_MACHINERY_REASONS: ReadonlySet<string> = new Set([
  "snapshot_hash_mismatch",
  "validator_timeout_or_crash",
  "validator_crash",
  "malformed_verdict",
]);

export function expectationRecordFromValidation(input: {
  validatorCellId: string;
  targetCellId: string;
  result: ValidatorOutcomeLike;
}): ExpectationRecord {
  const { validatorCellId, targetCellId, result } = input;
  const base = {
    cellId: validatorCellId,
    tier: 2 as const,
    expectation: `validator ${validatorCellId} over structured output of cell ${targetCellId}`,
    expected: { kind: "validator", validatorCellId, targetCellId },
  };
  if (result.pass) {
    return {
      ...base,
      result: "pass",
      actual: { reason: result.reason, ...(result.evidence !== undefined ? { evidence: result.evidence } : {}) },
    };
  }
  if (VALIDATOR_MACHINERY_REASONS.has(result.reason)) {
    return { ...base, result: "error", error: result.reason };
  }
  return {
    ...base,
    result: "fail",
    actual: { reason: result.reason, ...(result.evidence !== undefined ? { evidence: result.evidence } : {}) },
  };
}

export function skippedValidatorRecord(
  validatorCellId: string,
  targetCellId: string,
): ExpectationRecord {
  return {
    cellId: validatorCellId,
    tier: 2,
    expectation: `validator ${validatorCellId} over structured output of cell ${targetCellId}`,
    expected: { kind: "validator", validatorCellId, targetCellId },
    result: "skipped",
    error: "cell never reached (earlier cell failed)",
  };
}

export function erroredValidatorRecord(
  validatorCellId: string,
  targetCellId: string,
  error: string,
): ExpectationRecord {
  return {
    cellId: validatorCellId,
    tier: 2,
    expectation: `validator ${validatorCellId} over structured output of cell ${targetCellId}`,
    expected: { kind: "validator", validatorCellId, targetCellId },
    result: "error",
    error,
  };
}
