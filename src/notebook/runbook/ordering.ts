/**
 * Ordered execution and halt rules (SPEC-AGX-SUBSTRATE B5 — spec §5
 * "Ordering" + §5.1 expected-failure rule, adopted 2026-06-12).
 *
 * Pure rules shared by the batch run path (engine runtime gate) and the
 * instance-aware single-cell path (`executeInstanceCell`):
 *
 * - **Satisfied** (per executed cell, latest record wins): the cell ran
 *   (not skipped) AND — when it declares expectations (tier-1 contract or
 *   tier-2 validator) — every declared expectation passed; when it declares
 *   none, it completed procedurally. A cell that exits nonzero but whose
 *   every declared expectation passes is *expectation-satisfied* (a
 *   predicted failure) and counts as satisfied.
 * - **Halt**: an unsatisfied execution halts the run — uncontracted
 *   procedural failures, and contracted cells whose expectations fail or
 *   error. Expectation-satisfied predicted failures continue.
 * - **Ordering**: cells execute in document (template) order; only the next
 *   unsatisfied cell may execute. Out-of-order execution is rejected with a
 *   typed error naming the expected next cell — never warned. When every
 *   cell is satisfied, re-execution of any cell is allowed (re-running
 *   appends; all prior cells are trivially satisfied).
 */

import type {
  CellExecutionRecord,
  RunbookInstanceStatus,
  RunbookTemplate,
} from "./types.js";

/** Out-of-order execution is rejected, not warned (spec §5 "Ordering"). */
export class OutOfOrderExecutionError extends Error {
  override readonly name = "OutOfOrderExecutionError";

  constructor(
    readonly attemptedCellId: string,
    readonly expectedNextCellId: string,
  ) {
    super(
      `out-of-order execution rejected: cell ${attemptedCellId} cannot run before all ` +
        `prior cells are satisfied — the next unsatisfied cell is ${expectedNextCellId}`,
    );
  }
}

/**
 * Whether one execution record satisfies its cell (B5 satisfaction rule):
 * declared expectations decide when present (all must pass — this is what
 * makes a predicted failure satisfiable); otherwise procedural completion
 * decides. Skipped records never satisfy.
 */
export function isExecutionSatisfied(
  record: Pick<CellExecutionRecord, "status" | "expectations">,
): boolean {
  if (record.status === "skipped") return false;
  if (record.expectations.length > 0) {
    return record.expectations.every((expectation) => expectation.result === "pass");
  }
  return record.status === "completed";
}

/** Latest execution record per cell — re-execution appends, latest seq wins. */
export function latestExecutionsByCell(
  executions: CellExecutionRecord[],
): Map<string, CellExecutionRecord> {
  const latest = new Map<string, CellExecutionRecord>();
  for (const record of [...executions].sort((a, b) => a.seq - b.seq)) {
    latest.set(record.cellId, record);
  }
  return latest;
}

/**
 * The first template cell (in document order) without a satisfying latest
 * execution record, or null when every cell is satisfied.
 */
export function nextUnsatisfiedCell(
  template: Pick<RunbookTemplate, "cells">,
  executions: CellExecutionRecord[],
): string | null {
  const latest = latestExecutionsByCell(executions);
  for (const cell of template.cells) {
    const record = latest.get(cell.cellId);
    if (record === undefined || !isExecutionSatisfied(record)) return cell.cellId;
  }
  return null;
}

/**
 * Enforce document-order execution against an instance's append-only
 * records: only the next unsatisfied cell may execute. Throws
 * OutOfOrderExecutionError naming the expected next cell, or a plain Error
 * when the cell is not part of the template. When all cells are satisfied,
 * any cell may re-execute (appends a fresh record).
 */
export function assertCellExecutable(
  template: Pick<RunbookTemplate, "templateId" | "version" | "cells">,
  executions: CellExecutionRecord[],
  cellId: string,
): void {
  if (!template.cells.some((cell) => cell.cellId === cellId)) {
    throw new Error(
      `cell ${cellId} is not part of template ${template.templateId} ` +
        `version ${template.version}`,
    );
  }
  const next = nextUnsatisfiedCell(template, executions);
  if (next !== null && next !== cellId) {
    throw new OutOfOrderExecutionError(cellId, next);
  }
}

/**
 * Derive an instance's status from its append-only execution records —
 * the latest record per cell wins (decided design: derived, never stored).
 * An executed-but-unsatisfied latest record (uncontracted failure, or
 * failed/errored expectations) means the instance halted: "failed". An
 * expectation-satisfied predicted failure counts as satisfied, so partial
 * progress with only satisfied records derives "in_progress" and full
 * satisfaction derives "completed".
 */
export function deriveInstanceStatus(
  template: RunbookTemplate,
  executions: CellExecutionRecord[],
): RunbookInstanceStatus {
  if (executions.length === 0) return "created";
  const latest = latestExecutionsByCell(executions);
  for (const record of latest.values()) {
    if (record.status !== "skipped" && !isExecutionSatisfied(record)) return "failed";
  }
  const allSatisfied = template.cells.every((cell) => {
    const record = latest.get(cell.cellId);
    return record !== undefined && isExecutionSatisfied(record);
  });
  return allSatisfied ? "completed" : "in_progress";
}
