/**
 * InMemoryRunbookStorage — volatile durable-runbook storage for tests and
 * local mode (SPEC-AGX-SUBSTRATE B4b, §11.5: Supabase + InMemory first; a
 * FileSystemRunbookStorage is deferred until H1/H2 pass).
 *
 * Mirrors SupabaseRunbookStorage semantics: structural copies on read and
 * write (no shared references), append-only templates/instances/executions/
 * ledger (duplicate natural keys throw — there is no update path at all).
 *
 * The backing state can be shared across storage instances via
 * `createRunbookMemoryState()` so tests can simulate a process restart
 * (new instance of the class, same durable substrate) without Supabase.
 */

import {
  aggregateFitness,
  AdvanceReservationConflictError,
  type AdvanceReservation,
  type CellExecutionRecord,
  type FitnessAggregate,
  type FitnessLedgerRow,
  type RunbookInstance,
  type RunbookStorage,
  type RunbookTemplate,
} from "./types.js";
import { TemplateVersionConflictError } from "./template-versioning.js";

export interface RunbookMemoryState {
  /** Keyed by `${templateId}@${version}`. */
  templates: Map<string, RunbookTemplate>;
  instances: Map<string, RunbookInstance>;
  /** Keyed by `${instanceId}#${seq}`. */
  executions: Map<string, CellExecutionRecord>;
  /** Keyed by `${instanceId}#${seq}` — B8 advance CAS claims (GH #403). */
  reservations: Map<string, AdvanceReservation>;
  ledger: FitnessLedgerRow[];
}

export function createRunbookMemoryState(): RunbookMemoryState {
  return {
    templates: new Map(),
    instances: new Map(),
    executions: new Map(),
    reservations: new Map(),
    ledger: [],
  };
}

function templateKey(templateId: string, version: number): string {
  return `${templateId}@${version}`;
}

function executionKey(instanceId: string, seq: number): string {
  return `${instanceId}#${seq}`;
}

function copy<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryRunbookStorage implements RunbookStorage {
  constructor(private readonly state: RunbookMemoryState = createRunbookMemoryState()) {}

  async saveTemplate(template: RunbookTemplate): Promise<void> {
    if (!Number.isInteger(template.version) || template.version < 1) {
      throw new Error(
        `InMemoryRunbookStorage.saveTemplate failed: version must be a positive integer, got ${template.version}`,
      );
    }
    const key = templateKey(template.templateId, template.version);
    if (this.state.templates.has(key)) {
      throw new TemplateVersionConflictError(template.templateId, template.version);
    }
    this.state.templates.set(key, copy(template));
  }

  async getTemplate(templateId: string, version: number): Promise<RunbookTemplate | null> {
    const stored = this.state.templates.get(templateKey(templateId, version));
    return stored ? copy(stored) : null;
  }

  async getLatestTemplate(templateId: string): Promise<RunbookTemplate | null> {
    let latest: RunbookTemplate | undefined;
    for (const template of this.state.templates.values()) {
      if (template.templateId !== templateId) continue;
      if (!latest || template.version > latest.version) latest = template;
    }
    return latest ? copy(latest) : null;
  }

  async listTemplateVersions(templateId: string): Promise<number[]> {
    const versions: number[] = [];
    for (const template of this.state.templates.values()) {
      if (template.templateId === templateId) versions.push(template.version);
    }
    versions.sort((a, b) => a - b);
    return versions;
  }

  async createInstance(instance: RunbookInstance): Promise<void> {
    if (this.state.instances.has(instance.instanceId)) {
      throw new Error(
        `InMemoryRunbookStorage.createInstance failed: instance ${instance.instanceId} already exists`,
      );
    }
    const template = this.state.templates.get(
      templateKey(instance.templateId, instance.templateVersion),
    );
    if (!template) {
      throw new Error(
        `InMemoryRunbookStorage.createInstance failed: template ${instance.templateId} ` +
          `version ${instance.templateVersion} not found — an instance must pin an existing template version`,
      );
    }
    this.state.instances.set(instance.instanceId, copy(instance));
  }

  async getInstance(instanceId: string): Promise<RunbookInstance | null> {
    const stored = this.state.instances.get(instanceId);
    return stored ? copy(stored) : null;
  }

  async listInstances(templateId: string): Promise<RunbookInstance[]> {
    const matches: RunbookInstance[] = [];
    for (const instance of this.state.instances.values()) {
      if (instance.templateId === templateId) matches.push(copy(instance));
    }
    matches.sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.instanceId.localeCompare(b.instanceId),
    );
    return matches;
  }

  async appendCellExecution(record: CellExecutionRecord): Promise<void> {
    if (!Number.isInteger(record.seq) || record.seq < 1) {
      throw new Error(
        `InMemoryRunbookStorage.appendCellExecution failed: seq must be a positive integer, got ${record.seq}`,
      );
    }
    if (!this.state.instances.has(record.instanceId)) {
      throw new Error(
        `InMemoryRunbookStorage.appendCellExecution failed: instance ${record.instanceId} not found`,
      );
    }
    const key = executionKey(record.instanceId, record.seq);
    if (this.state.executions.has(key)) {
      throw new Error(
        `InMemoryRunbookStorage.appendCellExecution failed: execution seq ${record.seq} ` +
          `already recorded for instance ${record.instanceId} — records are append-only; ` +
          `re-execution must append a new seq`,
      );
    }
    this.state.executions.set(key, copy(record));
  }

  async listCellExecutions(instanceId: string): Promise<CellExecutionRecord[]> {
    const matches: CellExecutionRecord[] = [];
    for (const record of this.state.executions.values()) {
      if (record.instanceId === instanceId) matches.push(copy(record));
    }
    matches.sort((a, b) => a.seq - b.seq);
    return matches;
  }

  /**
   * B8 advance CAS (GH #403). Atomic with respect to concurrent callers:
   * the check-and-set below has no await point, so in single-threaded JS no
   * other reservation can interleave between the conflict check and the set.
   */
  async reserveAdvance(reservation: AdvanceReservation): Promise<void> {
    if (!Number.isInteger(reservation.seq) || reservation.seq < 1) {
      throw new Error(
        `InMemoryRunbookStorage.reserveAdvance failed: seq must be a positive integer, got ${reservation.seq}`,
      );
    }
    if (!this.state.instances.has(reservation.instanceId)) {
      throw new Error(
        `InMemoryRunbookStorage.reserveAdvance failed: instance ${reservation.instanceId} not found`,
      );
    }
    const key = executionKey(reservation.instanceId, reservation.seq);
    const holder = this.state.reservations.get(key);
    if (holder !== undefined) {
      throw new AdvanceReservationConflictError(
        reservation.instanceId,
        reservation.seq,
        `held by ${holder.agentId} since ${holder.reservedAt}`,
      );
    }
    this.state.reservations.set(key, copy(reservation));
  }

  async listAdvanceReservations(instanceId: string): Promise<AdvanceReservation[]> {
    const matches: AdvanceReservation[] = [];
    for (const reservation of this.state.reservations.values()) {
      if (reservation.instanceId === instanceId) matches.push(copy(reservation));
    }
    matches.sort((a, b) => a.seq - b.seq);
    return matches;
  }

  async appendFitnessRows(rows: FitnessLedgerRow[]): Promise<void> {
    // Validate every row before appending any — the Supabase backend's batch
    // insert is atomic, so a partially applied batch must be impossible here
    // too. The first two checks mirror the database FKs (instance_id →
    // runbook_instances, plus the composite pinning FK from migration
    // 20260612130000) so tests that run only against this backend catch what
    // Supabase would reject.
    for (const row of rows) {
      const instance = this.state.instances.get(row.instanceId);
      if (!instance) {
        throw new Error(
          `InMemoryRunbookStorage.appendFitnessRows failed: instance ${row.instanceId} not found`,
        );
      }
      if (
        instance.templateId !== row.templateId ||
        instance.templateVersion !== row.templateVersion
      ) {
        throw new Error(
          `InMemoryRunbookStorage.appendFitnessRows failed: row for cell ${row.cellId} ` +
            `carries template ${row.templateId} version ${row.templateVersion}, but ` +
            `instance ${row.instanceId} pins template ${instance.templateId} ` +
            `version ${instance.templateVersion} — ledger rows must match the ` +
            `instance's template pinning`,
        );
      }
      if (row.pass !== (row.result === "pass")) {
        throw new Error(
          `InMemoryRunbookStorage.appendFitnessRows failed: pass must equal (result === "pass") ` +
            `for cell ${row.cellId} (result ${row.result}, pass ${row.pass})`,
        );
      }
    }
    for (const row of rows) {
      this.state.ledger.push(copy(row));
    }
  }

  async listFitnessRows(
    templateId: string,
    templateVersion?: number,
  ): Promise<FitnessLedgerRow[]> {
    const matches: FitnessLedgerRow[] = [];
    for (const row of this.state.ledger) {
      if (row.templateId !== templateId) continue;
      if (templateVersion !== undefined && row.templateVersion !== templateVersion) continue;
      matches.push(copy(row));
    }
    return matches;
  }

  async getFitnessAggregate(
    templateId: string,
    templateVersion: number,
  ): Promise<FitnessAggregate> {
    const rows = await this.listFitnessRows(templateId, templateVersion);
    return aggregateFitness(templateId, templateVersion, rows);
  }
}
