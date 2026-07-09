/**
 * SqliteRunbookStorage — durable local runbook storage
 * (SPEC-AGX-SUBSTRATE B4b/B8; §11.5 dual-backend product gate).
 *
 * The local-mode counterpart of SupabaseRunbookStorage: one better-sqlite3
 * database at `<dataDir>/runbooks.db` holding templates, instances, cell
 * executions, advance reservations, and the fitness ledger — all append-only
 * (duplicate natural keys throw; there is no update path anywhere in this
 * class, which is the structural append-only guarantee).
 *
 * The B8 advance CAS (GH #403) maps to a primary-key conditional insert:
 * better-sqlite3 is synchronous, so the conflict check and insert cannot
 * interleave in-process, and the (instance_id, seq) primary key arbitrates
 * cross-process racers — the loser throws AdvanceReservationConflictError
 * WITHOUT having run any side effect.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import type { ExpectationRecord } from "../contracts.js";
import {
  aggregateFitness,
  AdvanceReservationConflictError,
  type AdvanceReservation,
  type CellExecutionRecord,
  type CellExecutionStatus,
  type FitnessAggregate,
  type FitnessLedgerRow,
  type RunbookInstance,
  type RunbookStorage,
  type RunbookTemplate,
  type RunbookTemplateCell,
} from "./types.js";
import { TemplateVersionConflictError } from "./template-versioning.js";

interface TemplateRow {
  template_id: string;
  version: number;
  cells: string;
  cells_hash: string;
  created_by: string;
  created_at: string;
}

interface InstanceRow {
  instance_id: string;
  template_id: string;
  template_version: number;
  created_by: string;
  created_at: string;
}

interface ExecutionRow {
  instance_id: string;
  seq: number;
  cell_id: string;
  started_at: string;
  agent_id: string;
  inputs_digest: string;
  outputs_ref: string | null;
  status: string;
  expectations: string;
}

interface ReservationRow {
  instance_id: string;
  seq: number;
  cell_id: string;
  agent_id: string;
  reserved_at: string;
}

interface LedgerRow {
  template_id: string;
  template_version: number;
  instance_id: string;
  cell_id: string;
  tier: number;
  result: string;
  pass: number;
  expected: string | null;
  actual: string | null;
  error: string | null;
  agent_id: string;
  ts: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS runbook_templates (
  template_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version >= 1),
  cells TEXT NOT NULL,
  cells_hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (template_id, version)
);

CREATE TABLE IF NOT EXISTS runbook_instances (
  instance_id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (template_id, template_version)
    REFERENCES runbook_templates(template_id, version)
);
CREATE INDEX IF NOT EXISTS idx_runbook_instances_template
  ON runbook_instances(template_id);

CREATE TABLE IF NOT EXISTS runbook_cell_executions (
  instance_id TEXT NOT NULL REFERENCES runbook_instances(instance_id),
  seq INTEGER NOT NULL CHECK (seq >= 1),
  cell_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  inputs_digest TEXT NOT NULL,
  outputs_ref TEXT,
  status TEXT NOT NULL,
  expectations TEXT NOT NULL,
  PRIMARY KEY (instance_id, seq)
);

CREATE TABLE IF NOT EXISTS runbook_advance_reservations (
  instance_id TEXT NOT NULL REFERENCES runbook_instances(instance_id),
  seq INTEGER NOT NULL CHECK (seq >= 1),
  cell_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  reserved_at TEXT NOT NULL,
  PRIMARY KEY (instance_id, seq)
);

CREATE TABLE IF NOT EXISTS runbook_fitness_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  instance_id TEXT NOT NULL REFERENCES runbook_instances(instance_id),
  cell_id TEXT NOT NULL,
  tier INTEGER NOT NULL,
  result TEXT NOT NULL,
  pass INTEGER NOT NULL,
  expected TEXT,
  actual TEXT,
  error TEXT,
  agent_id TEXT NOT NULL,
  ts TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_runbook_ledger_template
  ON runbook_fitness_ledger(template_id, template_version);
`;

function isPrimaryKeyConflict(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string }).code === "SQLITE_CONSTRAINT_PRIMARYKEY"
  );
}

export class SqliteRunbookStorage implements RunbookStorage {
  private db: Database.Database;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(SCHEMA);
  }

  private fail(operation: string, message: string): never {
    throw new Error(`SqliteRunbookStorage.${operation} failed: ${message}`);
  }

  // ---------------------------------------------------------------------------
  // Templates (immutable versions)
  // ---------------------------------------------------------------------------

  private rowToTemplate(row: TemplateRow): RunbookTemplate {
    return {
      templateId: row.template_id,
      version: row.version,
      cells: JSON.parse(row.cells) as RunbookTemplateCell[],
      cellsHash: row.cells_hash,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  async saveTemplate(template: RunbookTemplate): Promise<void> {
    if (!Number.isInteger(template.version) || template.version < 1) {
      this.fail(
        "saveTemplate",
        `version must be a positive integer, got ${template.version}`,
      );
    }
    try {
      this.db
        .prepare(
          `INSERT INTO runbook_templates
             (template_id, version, cells, cells_hash, created_by, created_at)
           VALUES (@template_id, @version, @cells, @cells_hash, @created_by, @created_at)`,
        )
        .run({
          template_id: template.templateId,
          version: template.version,
          cells: JSON.stringify(template.cells),
          cells_hash: template.cellsHash,
          created_by: template.createdBy,
          created_at: template.createdAt,
        });
    } catch (err) {
      if (isPrimaryKeyConflict(err)) {
        throw new TemplateVersionConflictError(template.templateId, template.version);
      }
      throw err;
    }
  }

  async getTemplate(templateId: string, version: number): Promise<RunbookTemplate | null> {
    const row = this.db
      .prepare("SELECT * FROM runbook_templates WHERE template_id = ? AND version = ?")
      .get(templateId, version) as TemplateRow | undefined;
    return row ? this.rowToTemplate(row) : null;
  }

  async getLatestTemplate(templateId: string): Promise<RunbookTemplate | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM runbook_templates WHERE template_id = ?
         ORDER BY version DESC LIMIT 1`,
      )
      .get(templateId) as TemplateRow | undefined;
    return row ? this.rowToTemplate(row) : null;
  }

  async listTemplateVersions(templateId: string): Promise<number[]> {
    const rows = this.db
      .prepare(
        `SELECT version FROM runbook_templates WHERE template_id = ?
         ORDER BY version ASC`,
      )
      .all(templateId) as Array<{ version: number }>;
    return rows.map((row) => row.version);
  }

  // ---------------------------------------------------------------------------
  // Instances (pin an existing template version)
  // ---------------------------------------------------------------------------

  private rowToInstance(row: InstanceRow): RunbookInstance {
    return {
      instanceId: row.instance_id,
      templateId: row.template_id,
      templateVersion: row.template_version,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  private instanceExists(instanceId: string): boolean {
    return (
      this.db
        .prepare("SELECT 1 FROM runbook_instances WHERE instance_id = ?")
        .get(instanceId) !== undefined
    );
  }

  async createInstance(instance: RunbookInstance): Promise<void> {
    if (this.instanceExists(instance.instanceId)) {
      this.fail("createInstance", `instance ${instance.instanceId} already exists`);
    }
    const template = this.db
      .prepare("SELECT 1 FROM runbook_templates WHERE template_id = ? AND version = ?")
      .get(instance.templateId, instance.templateVersion);
    if (!template) {
      this.fail(
        "createInstance",
        `template ${instance.templateId} version ${instance.templateVersion} not found — ` +
          `an instance must pin an existing template version`,
      );
    }
    this.db
      .prepare(
        `INSERT INTO runbook_instances
           (instance_id, template_id, template_version, created_by, created_at)
         VALUES (@instance_id, @template_id, @template_version, @created_by, @created_at)`,
      )
      .run({
        instance_id: instance.instanceId,
        template_id: instance.templateId,
        template_version: instance.templateVersion,
        created_by: instance.createdBy,
        created_at: instance.createdAt,
      });
  }

  async getInstance(instanceId: string): Promise<RunbookInstance | null> {
    const row = this.db
      .prepare("SELECT * FROM runbook_instances WHERE instance_id = ?")
      .get(instanceId) as InstanceRow | undefined;
    return row ? this.rowToInstance(row) : null;
  }

  async listInstances(templateId: string): Promise<RunbookInstance[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM runbook_instances WHERE template_id = ?
         ORDER BY created_at ASC, instance_id ASC`,
      )
      .all(templateId) as InstanceRow[];
    return rows.map((row) => this.rowToInstance(row));
  }

  // ---------------------------------------------------------------------------
  // Cell executions (append-only)
  // ---------------------------------------------------------------------------

  private rowToExecution(row: ExecutionRow): CellExecutionRecord {
    return {
      instanceId: row.instance_id,
      seq: row.seq,
      cellId: row.cell_id,
      startedAt: row.started_at,
      agentId: row.agent_id,
      inputsDigest: row.inputs_digest,
      ...(row.outputs_ref !== null ? { outputsRef: row.outputs_ref } : {}),
      status: row.status as CellExecutionStatus,
      expectations: JSON.parse(row.expectations) as ExpectationRecord[],
    };
  }

  async appendCellExecution(record: CellExecutionRecord): Promise<void> {
    if (!Number.isInteger(record.seq) || record.seq < 1) {
      this.fail(
        "appendCellExecution",
        `seq must be a positive integer, got ${record.seq}`,
      );
    }
    if (!this.instanceExists(record.instanceId)) {
      this.fail("appendCellExecution", `instance ${record.instanceId} not found`);
    }
    try {
      this.db
        .prepare(
          `INSERT INTO runbook_cell_executions
             (instance_id, seq, cell_id, started_at, agent_id, inputs_digest,
              outputs_ref, status, expectations)
           VALUES (@instance_id, @seq, @cell_id, @started_at, @agent_id, @inputs_digest,
                   @outputs_ref, @status, @expectations)`,
        )
        .run({
          instance_id: record.instanceId,
          seq: record.seq,
          cell_id: record.cellId,
          started_at: record.startedAt,
          agent_id: record.agentId,
          inputs_digest: record.inputsDigest,
          outputs_ref: record.outputsRef ?? null,
          status: record.status,
          expectations: JSON.stringify(record.expectations),
        });
    } catch (err) {
      if (isPrimaryKeyConflict(err)) {
        this.fail(
          "appendCellExecution",
          `execution seq ${record.seq} already recorded for instance ` +
            `${record.instanceId} — records are append-only; re-execution must ` +
            `append a new seq`,
        );
      }
      throw err;
    }
  }

  async listCellExecutions(instanceId: string): Promise<CellExecutionRecord[]> {
    const rows = this.db
      .prepare(
        "SELECT * FROM runbook_cell_executions WHERE instance_id = ? ORDER BY seq ASC",
      )
      .all(instanceId) as ExecutionRow[];
    return rows.map((row) => this.rowToExecution(row));
  }

  // ---------------------------------------------------------------------------
  // Advance reservations (B8 CAS — GH #403)
  // ---------------------------------------------------------------------------

  /**
   * Primary-key conditional insert: exactly one concurrent reservation of
   * (instance_id, seq) commits; the loser observes the PK conflict and
   * surfaces the typed conflict WITHOUT having run any side effect.
   */
  async reserveAdvance(reservation: AdvanceReservation): Promise<void> {
    if (!Number.isInteger(reservation.seq) || reservation.seq < 1) {
      this.fail(
        "reserveAdvance",
        `seq must be a positive integer, got ${reservation.seq}`,
      );
    }
    if (!this.instanceExists(reservation.instanceId)) {
      this.fail("reserveAdvance", `instance ${reservation.instanceId} not found`);
    }
    try {
      this.db
        .prepare(
          `INSERT INTO runbook_advance_reservations
             (instance_id, seq, cell_id, agent_id, reserved_at)
           VALUES (@instance_id, @seq, @cell_id, @agent_id, @reserved_at)`,
        )
        .run({
          instance_id: reservation.instanceId,
          seq: reservation.seq,
          cell_id: reservation.cellId,
          agent_id: reservation.agentId,
          reserved_at: reservation.reservedAt,
        });
    } catch (err) {
      if (isPrimaryKeyConflict(err)) {
        const holder = this.db
          .prepare(
            `SELECT agent_id, reserved_at FROM runbook_advance_reservations
             WHERE instance_id = ? AND seq = ?`,
          )
          .get(reservation.instanceId, reservation.seq) as
          | Pick<ReservationRow, "agent_id" | "reserved_at">
          | undefined;
        throw new AdvanceReservationConflictError(
          reservation.instanceId,
          reservation.seq,
          holder ? `held by ${holder.agent_id} since ${holder.reserved_at}` : undefined,
        );
      }
      throw err;
    }
  }

  async listAdvanceReservations(instanceId: string): Promise<AdvanceReservation[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM runbook_advance_reservations WHERE instance_id = ?
         ORDER BY seq ASC`,
      )
      .all(instanceId) as ReservationRow[];
    return rows.map((row) => ({
      instanceId: row.instance_id,
      seq: row.seq,
      cellId: row.cell_id,
      agentId: row.agent_id,
      reservedAt: row.reserved_at,
    }));
  }

  // ---------------------------------------------------------------------------
  // Fitness ledger (append-only, atomic batches)
  // ---------------------------------------------------------------------------

  private rowToLedgerRow(row: LedgerRow): FitnessLedgerRow {
    return {
      templateId: row.template_id,
      templateVersion: row.template_version,
      instanceId: row.instance_id,
      cellId: row.cell_id,
      tier: row.tier as 1 | 2,
      result: row.result as FitnessLedgerRow["result"],
      pass: row.pass === 1,
      expected: row.expected !== null ? (JSON.parse(row.expected) as unknown) : undefined,
      ...(row.actual !== null ? { actual: JSON.parse(row.actual) as unknown } : {}),
      ...(row.error !== null ? { error: row.error } : {}),
      agentId: row.agent_id,
      ts: row.ts,
    };
  }

  async appendFitnessRows(rows: FitnessLedgerRow[]): Promise<void> {
    // Validate every row, then insert all inside ONE transaction — a
    // partially applied batch is impossible, mirroring the Supabase backend's
    // atomic batch insert. The checks mirror the database FKs there
    // (instance_id FK plus the composite template-pinning FK).
    const insert = this.db.prepare(
      `INSERT INTO runbook_fitness_ledger
         (template_id, template_version, instance_id, cell_id, tier, result,
          pass, expected, actual, error, agent_id, ts)
       VALUES (@template_id, @template_version, @instance_id, @cell_id, @tier, @result,
               @pass, @expected, @actual, @error, @agent_id, @ts)`,
    );
    const getInstance = this.db.prepare(
      "SELECT * FROM runbook_instances WHERE instance_id = ?",
    );
    const apply = this.db.transaction((batch: FitnessLedgerRow[]) => {
      for (const row of batch) {
        const instance = getInstance.get(row.instanceId) as InstanceRow | undefined;
        if (!instance) {
          this.fail("appendFitnessRows", `instance ${row.instanceId} not found`);
        }
        if (
          instance.template_id !== row.templateId ||
          instance.template_version !== row.templateVersion
        ) {
          this.fail(
            "appendFitnessRows",
            `row for cell ${row.cellId} carries template ${row.templateId} version ` +
              `${row.templateVersion}, but instance ${row.instanceId} pins template ` +
              `${instance.template_id} version ${instance.template_version} — ledger ` +
              `rows must match the instance's template pinning`,
          );
        }
        if (row.pass !== (row.result === "pass")) {
          this.fail(
            "appendFitnessRows",
            `pass must equal (result === "pass") for cell ${row.cellId} ` +
              `(result ${row.result}, pass ${row.pass})`,
          );
        }
      }
      for (const row of batch) {
        const expected = JSON.stringify(row.expected);
        const actual = JSON.stringify(row.actual);
        insert.run({
          template_id: row.templateId,
          template_version: row.templateVersion,
          instance_id: row.instanceId,
          cell_id: row.cellId,
          tier: row.tier,
          result: row.result,
          pass: row.pass ? 1 : 0,
          expected: expected === undefined ? null : expected,
          actual: actual === undefined ? null : actual,
          error: row.error ?? null,
          agent_id: row.agentId,
          ts: row.ts,
        });
      }
    });
    apply(rows);
  }

  async listFitnessRows(
    templateId: string,
    templateVersion?: number,
  ): Promise<FitnessLedgerRow[]> {
    const clauses = ["template_id = @template_id"];
    const params: Record<string, string | number> = { template_id: templateId };
    if (templateVersion !== undefined) {
      clauses.push("template_version = @template_version");
      params.template_version = templateVersion;
    }
    const rows = this.db
      .prepare(
        `SELECT * FROM runbook_fitness_ledger WHERE ${clauses.join(" AND ")}
         ORDER BY id ASC`,
      )
      .all(params) as LedgerRow[];
    return rows.map((row) => this.rowToLedgerRow(row));
  }

  async getFitnessAggregate(
    templateId: string,
    templateVersion: number,
  ): Promise<FitnessAggregate> {
    const rows = await this.listFitnessRows(templateId, templateVersion);
    return aggregateFitness(templateId, templateVersion, rows);
  }

  /** Close the underlying database handle (tests / graceful shutdown). */
  close(): void {
    this.db.close();
  }
}
