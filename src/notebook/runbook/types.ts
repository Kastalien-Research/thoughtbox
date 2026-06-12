/**
 * Durable runbook domain types and storage contract
 * (SPEC-AGX-SUBSTRATE B4b — claim c3 instance half + claim c7 fitness ledger).
 *
 * Identity scheme (documented per spec §5 template-vs-instance):
 * - A template is identified by a `templateId` that is STABLE across
 *   versions; in the engine wiring the templateId is the notebook id.
 * - Each distinct cell set is an immutable `(templateId, version)` record
 *   with a 1-based monotonically increasing integer version. A new version
 *   is appended whenever the canonical cells hash changes; no record is
 *   ever mutated in place.
 * - An instance pins `(templateId, templateVersion)` at creation and never
 *   changes it. Instance status is DERIVED from its append-only execution
 *   records via `deriveInstanceStatus` (ordering.ts) — never stored mutably.
 * - Cell executions are append-only rows keyed by `(instanceId, seq)`;
 *   re-executing a cell appends a new record with a fresh seq. There is no
 *   update operation anywhere in the storage contract — that absence is the
 *   structural append-only guarantee, enforced again at the database layer
 *   by revoked UPDATE/DELETE grants (migration 20260612120000).
 */

import {
  verifyAttachedContract,
  type AttachedContract,
  type ExpectationRecord,
  type ExpectationResult,
} from "../contracts.js";
import { hashJson } from "../../peer-notebook/manifest.js";
import type { Notebook } from "../types.js";

// ---------------------------------------------------------------------------
// Template (versioned like code — spec §5)
// ---------------------------------------------------------------------------

/**
 * Snapshot of one executable cell as authored, including the compiled
 * tier-1 contract (with its hash) so contracts survive persistence and can
 * be re-verified after load (closes B4a's "contracts don't survive export"
 * gap at the durable-template layer; .src.md encoding remains out of scope).
 */
export interface RunbookTemplateCell {
  cellId: string;
  cellType: "code" | "package.json";
  filename: string;
  source: string;
  /** Compiled tier-1 outcome contract (zod → canonicalize → sha256). */
  contract?: AttachedContract;
  /** Tier-2 marker: this cell validates the named cell's structured output. */
  validatorFor?: string;
  /** Authoring-time validator snapshot hash (Ulysses pattern). */
  validatorSnapshotHash?: string;
}

export interface RunbookTemplate {
  /** Stable across versions (the notebook id in the engine wiring). */
  templateId: string;
  /** 1-based, monotonically increasing. New version = new immutable record. */
  version: number;
  cells: RunbookTemplateCell[];
  /** sha256 over the canonicalized cells — version-dedup key. */
  cellsHash: string;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Instance (append-only execution record — spec §5, claim c3)
// ---------------------------------------------------------------------------

export interface RunbookInstance {
  instanceId: string;
  templateId: string;
  /** Pinned at creation; never changes. */
  templateVersion: number;
  createdBy: string;
  createdAt: string;
}

/**
 * Since B5, the engine records only cells that actually executed —
 * "completed" or "failed". Cells a halted run never reached leave NO record
 * (their skipped expectations still produce ledger rows). "skipped" remains
 * accepted by the storage contract and database for callers that record
 * explicit skips.
 */
export type CellExecutionStatus = "completed" | "failed" | "skipped";

export interface CellExecutionRecord {
  instanceId: string;
  /** 1-based append sequence within the instance; unique, never reused. */
  seq: number;
  cellId: string;
  startedAt: string;
  /** Hub agentId (or "local") of the executing agent. */
  agentId: string;
  /** sha256 over the canonicalized run inputs. */
  inputsDigest: string;
  /** Artifact reference for the cell-results evidence, when persisted. */
  outputsRef?: string;
  status: CellExecutionStatus;
  /** Per-expectation results (tier, expected, actual-or-error) for this cell. */
  expectations: ExpectationRecord[];
}

export type RunbookInstanceStatus = "created" | "in_progress" | "completed" | "failed";

// ---------------------------------------------------------------------------
// Fitness ledger (spec §7, claim c7)
// ---------------------------------------------------------------------------

/**
 * One machine-checked expectation evaluation. Rows are written only when a
 * contracted cell's expectation evaluates (tier 1 declarative or tier 2
 * validator — both machine-checked; tier provenance is carried). `error`
 * and `skipped` evaluations are recorded with their state but are excluded
 * from pass-rate aggregates.
 */
export interface FitnessLedgerRow {
  templateId: string;
  templateVersion: number;
  instanceId: string;
  cellId: string;
  tier: 1 | 2;
  result: ExpectationResult;
  /** True iff result is "pass" — fail/error/skipped are never pass. */
  pass: boolean;
  expected: unknown;
  actual?: unknown;
  /** Populated when result is "error" or "skipped". */
  error?: string;
  agentId: string;
  ts: string;
}

export interface FitnessAggregate {
  templateId: string;
  templateVersion: number;
  /** Distinct instances that produced machine-checked ledger rows. */
  instances: number;
  /** Rows that reached a verdict (pass or fail). */
  evaluated: number;
  passed: number;
  /** passed / evaluated; null when nothing was evaluated. */
  passRate: number | null;
  errorRows: number;
  /** errorRows / total rows; 0 when the ledger is empty. */
  errorRate: number;
  distinctAgents: number;
}

// ---------------------------------------------------------------------------
// Storage contract — implemented by SupabaseRunbookStorage (deployed) and
// InMemoryRunbookStorage (tests/local). A FileSystemRunbookStorage is
// deliberately deferred until H1/H2 pass (spec §11.5: contract-suite-first,
// Supabase-first, FS gated on evidence).
// ---------------------------------------------------------------------------

export interface RunbookStorage {
  /**
   * Persist an immutable template version. Re-saving an existing
   * (templateId, version) throws — versions are append-only.
   */
  saveTemplate(template: RunbookTemplate): Promise<void>;
  getTemplate(templateId: string, version: number): Promise<RunbookTemplate | null>;
  getLatestTemplate(templateId: string): Promise<RunbookTemplate | null>;
  listTemplateVersions(templateId: string): Promise<number[]>;

  /** Create an instance pinning (templateId, templateVersion). Duplicate ids throw. */
  createInstance(instance: RunbookInstance): Promise<void>;
  getInstance(instanceId: string): Promise<RunbookInstance | null>;
  listInstances(templateId: string): Promise<RunbookInstance[]>;

  /**
   * Append one cell execution record. A duplicate (instanceId, seq) throws —
   * nothing ever mutates a prior record; re-execution appends a fresh seq.
   */
  appendCellExecution(record: CellExecutionRecord): Promise<void>;
  /** All execution records for an instance, ordered by seq ascending. */
  listCellExecutions(instanceId: string): Promise<CellExecutionRecord[]>;

  appendFitnessRows(rows: FitnessLedgerRow[]): Promise<void>;
  listFitnessRows(
    templateId: string,
    templateVersion?: number,
  ): Promise<FitnessLedgerRow[]>;
  /** Aggregate per template version (spec §7: n instances, pass rate, error rate, distinct agents). */
  getFitnessAggregate(
    templateId: string,
    templateVersion: number,
  ): Promise<FitnessAggregate>;
}

// ---------------------------------------------------------------------------
// Pure domain helpers (shared by both backends and the engine runtime)
// ---------------------------------------------------------------------------

/** Canonical content hash of a template's cells (version-dedup key). */
export function hashTemplateCells(cells: RunbookTemplateCell[]): string {
  return hashJson(cells);
}

/** Snapshot a live notebook's executable cells for durable template versioning. */
export function templateCellsFromNotebook(
  notebook: Pick<Notebook, "cells">,
): RunbookTemplateCell[] {
  const cells: RunbookTemplateCell[] = [];
  for (const cell of notebook.cells) {
    if (cell.type !== "code" && cell.type !== "package.json") continue;
    cells.push({
      cellId: cell.id,
      cellType: cell.type,
      filename: cell.filename,
      source: cell.source,
      ...(cell.type === "code" && cell.contract !== undefined
        ? { contract: cell.contract }
        : {}),
      ...(cell.type === "code" && cell.validatorFor !== undefined
        ? { validatorFor: cell.validatorFor }
        : {}),
      ...(cell.type === "code" && cell.validatorSnapshotHash !== undefined
        ? { validatorSnapshotHash: cell.validatorSnapshotHash }
        : {}),
    });
  }
  return cells;
}

/**
 * Re-verify every attached contract hash on a template loaded from storage
 * (Ulysses pattern at the durable layer). Throws ContractHashMismatchError
 * on tampering.
 */
export function verifyTemplateContracts(template: RunbookTemplate): void {
  for (const cell of template.cells) {
    if (cell.contract !== undefined) {
      verifyAttachedContract(cell.cellId, cell.contract);
    }
  }
}

/**
 * Compute the fitness aggregate from ledger rows (spec §7). Pass rate counts
 * only rows that reached a verdict; error/skipped rows are carried in the
 * ledger but never contribute to pass-rates.
 */
export function aggregateFitness(
  templateId: string,
  templateVersion: number,
  rows: FitnessLedgerRow[],
): FitnessAggregate {
  const instances = new Set<string>();
  const agents = new Set<string>();
  let evaluated = 0;
  let passed = 0;
  let errorRows = 0;
  for (const row of rows) {
    instances.add(row.instanceId);
    agents.add(row.agentId);
    if (row.result === "pass" || row.result === "fail") {
      evaluated += 1;
      if (row.pass) passed += 1;
    } else if (row.result === "error") {
      errorRows += 1;
    }
  }
  return {
    templateId,
    templateVersion,
    instances: instances.size,
    evaluated,
    passed,
    passRate: evaluated === 0 ? null : passed / evaluated,
    errorRows,
    errorRate: rows.length === 0 ? 0 : errorRows / rows.length,
    distinctAgents: agents.size,
  };
}
