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
import { buildDefaultTsconfig, type Cell, type Notebook } from "../types.js";
import type { AwaitCondition } from "./await.js";

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
  cellType: "code" | "package.json" | "await";
  /** Empty string for await cells (nothing is written to disk for them). */
  filename: string;
  /** Empty string for await cells (they execute nothing). */
  source: string;
  /** Compiled tier-1 outcome contract (zod → canonicalize → sha256). */
  contract?: AttachedContract;
  /** Tier-2 marker: this cell validates the named cell's structured output. */
  validatorFor?: string;
  /** Authoring-time validator snapshot hash (Ulysses pattern). */
  validatorSnapshotHash?: string;
  /**
   * B6: the claim predicate an await cell blocks on. Present iff
   * cellType is "await".
   */
  awaitClaim?: AwaitCondition;
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
// Advance reservations (SPEC-AGX-SUBSTRATE B8 — GH #403 double-execute guard)
// ---------------------------------------------------------------------------

/**
 * A compare-and-swap claim on one advance step: BEFORE an advancer runs an
 * exec cell's side effects, it must atomically reserve `(instanceId, seq)`.
 * Exactly one concurrent advancer wins the reservation (unique natural key
 * on both backends — a Map check-and-set with no interleaving await points
 * in memory, a unique-constraint conditional insert on Postgres); losers
 * receive AdvanceReservationConflictError WITHOUT having run any side
 * effect. The winner then executes the cell and appends its execution
 * record at the reserved seq.
 *
 * Reservations are append-only like everything else here (no update/delete
 * path). A reservation whose seq has no matching execution record marks an
 * in-flight — or crashed — advance; tb.runbook.advance surfaces it as
 * `in_flight` (with holder + age) instead of double-running, and only an
 * explicit force skips past it.
 */
export interface AdvanceReservation {
  instanceId: string;
  /** The execution seq this reservation claims (1-based, unique per instance). */
  seq: number;
  cellId: string;
  /** Hub agentId (or "local") of the reserving advancer. */
  agentId: string;
  reservedAt: string;
}

/** Typed loss of the advance CAS — the step is already held. No side effects ran. */
export class AdvanceReservationConflictError extends Error {
  override readonly name = "AdvanceReservationConflictError";

  constructor(
    readonly instanceId: string,
    readonly seq: number,
    detail?: string,
  ) {
    super(
      `advance reservation (${instanceId}, seq ${seq}) already held — ` +
        `another advancer owns this step; no side effects were run` +
        (detail ? ` (${detail})` : ""),
    );
  }
}

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
// Storage contract — implemented by SupabaseRunbookStorage (deployed),
// SqliteRunbookStorage (local durable — `<dataDir>/runbooks.db`), and
// InMemoryRunbookStorage (tests/THOUGHTBOX_STORAGE=memory).
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

  /**
   * Atomically reserve one advance step (B8 CAS — GH #403). Throws
   * AdvanceReservationConflictError when (instanceId, seq) is already
   * reserved; any other failure throws a backend error. MUST be atomic with
   * respect to concurrent reservations of the same key.
   */
  reserveAdvance(reservation: AdvanceReservation): Promise<void>;
  /** All reservations for an instance, ordered by seq ascending. */
  listAdvanceReservations(instanceId: string): Promise<AdvanceReservation[]>;

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
    if (cell.type === "await") {
      // B6: await cells are part of template order but execute nothing —
      // no filename/source; the claim predicate is the whole cell.
      cells.push({
        cellId: cell.id,
        cellType: "await",
        filename: "",
        source: "",
        awaitClaim: { claimId: cell.claimId, until: [...cell.until] },
      });
      continue;
    }
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
 * Reconstruct a live, executable Notebook from a persisted template version
 * (SPEC-AGX-SUBSTRATE claim c5 substrate — fresh-session instantiation).
 * The inverse of `templateCellsFromNotebook`: the round-trip preserves every
 * hash-bearing field, so `hashTemplateCells(templateCellsFromNotebook(nb))`
 * equals the template's `cellsHash` and instance-aware execution accepts the
 * reconstructed notebook against the pinned version.
 *
 * The notebook id IS the templateId (the engine's identity scheme, header
 * comment above), so `notebook_run_cell { notebookId, cellId, instanceId }`
 * works unchanged against instances of this template.
 */
export function notebookFromTemplate(template: RunbookTemplate): Notebook {
  const cells: Cell[] = [
    {
      id: `${template.templateId}-title`,
      type: "title",
      text: `Runbook ${template.templateId} v${template.version}`,
    },
  ];
  let hasTypescript = false;
  for (const cell of template.cells) {
    if (cell.cellType === "await") {
      // B6: reconstruct the claim predicate verbatim — awaitClaim is a
      // hash-bearing field, so the round-trip must preserve it exactly.
      if (cell.awaitClaim === undefined) {
        throw new Error(
          `template ${template.templateId} v${template.version} await cell ` +
            `${cell.cellId} has no awaitClaim predicate`,
        );
      }
      cells.push({
        id: cell.cellId,
        type: "await",
        claimId: cell.awaitClaim.claimId,
        until: [...cell.awaitClaim.until],
      });
      continue;
    }
    if (cell.cellType === "package.json") {
      cells.push({
        id: cell.cellId,
        type: "package.json",
        filename: "package.json",
        source: cell.source,
        status: "idle",
      });
      continue;
    }
    const language = /\.tsx?$/.test(cell.filename) ? "typescript" : "javascript";
    if (language === "typescript") hasTypescript = true;
    cells.push({
      id: cell.cellId,
      type: "code",
      language,
      filename: cell.filename,
      source: cell.source,
      status: "idle",
      ...(cell.contract !== undefined ? { contract: cell.contract } : {}),
      ...(cell.validatorFor !== undefined ? { validatorFor: cell.validatorFor } : {}),
      ...(cell.validatorSnapshotHash !== undefined
        ? { validatorSnapshotHash: cell.validatorSnapshotHash }
        : {}),
    });
  }
  const now = Date.now();
  return {
    id: template.templateId,
    cells,
    language: hasTypescript ? "typescript" : "javascript",
    ...(hasTypescript ? { "tsconfig.json": buildDefaultTsconfig() } : {}),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Re-verify every attached contract hash on a list of template cells
 * (Ulysses pattern at the durable layer). Throws ContractHashMismatchError
 * on tampering. Used both to gate a notebook's cells before they are
 * persisted as a template version and to re-check a template loaded from
 * storage.
 */
export function verifyCellContracts(cells: RunbookTemplateCell[]): void {
  for (const cell of cells) {
    if (cell.contract !== undefined) {
      verifyAttachedContract(cell.cellId, cell.contract);
    }
  }
}

/**
 * Re-verify every attached contract hash on a template loaded from storage.
 * Throws ContractHashMismatchError on tampering.
 */
export function verifyTemplateContracts(template: RunbookTemplate): void {
  verifyCellContracts(template.cells);
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
