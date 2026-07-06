/**
 * SupabaseRunbookStorage — Postgres-backed durable runbook storage
 * (SPEC-AGX-SUBSTRATE B4b, claims c3 instance half + c7).
 *
 * Implements the RunbookStorage contract over the runbook_templates /
 * runbook_instances / runbook_cell_executions / runbook_fitness_ledger
 * tables, scoped to a single tenant workspace — the same pattern as
 * SupabaseHubStorage:
 * - every table is insert-only from the storage's perspective; the
 *   interface exposes no update path, and migration 20260612120000 revokes
 *   UPDATE/DELETE from the API roles so even a raw client cannot rewrite a
 *   record;
 * - duplicate natural keys (template version, instance id, execution seq)
 *   surface as errors, never as silent overwrites;
 * - aggregates are computed in application code from ledger rows via the
 *   shared `aggregateFitness` helper so both backends agree exactly (row
 *   volumes per template version are small in v0; a SQL aggregate replaces
 *   this when the ledger grows).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../database.types.js";
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
import type { ExpectationRecord, ExpectationResult } from "../contracts.js";
import { TemplateVersionConflictError } from "./template-versioning.js";

type Tables = Database["public"]["Tables"];
type TemplateRow = Tables["runbook_templates"]["Row"];
type InstanceRow = Tables["runbook_instances"]["Row"];
type ExecutionRow = Tables["runbook_cell_executions"]["Row"];
type ReservationRow = Tables["runbook_advance_reservations"]["Row"];
type LedgerRow = Tables["runbook_fitness_ledger"]["Row"];

export interface SupabaseRunbookStorageConfig {
  supabaseUrl: string;
  /** Service role key — bypasses RLS; tenant isolation is enforced in queries. */
  serviceRoleKey: string;
  /** SaaS workspace (public.workspaces.id) all runbook rows are scoped to. */
  tenantWorkspaceId: string;
}

function toIso(timestamp: string): string {
  return new Date(timestamp).toISOString();
}

export class SupabaseRunbookStorage implements RunbookStorage {
  private client: SupabaseClient<Database>;
  private tenantWorkspaceId: string;

  constructor(config: SupabaseRunbookStorageConfig) {
    this.tenantWorkspaceId = config.tenantWorkspaceId;
    this.client = createClient<Database>(config.supabaseUrl, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(operation: string, message: string): never {
    throw new Error(
      `SupabaseRunbookStorage.${operation} failed (tenant ${this.tenantWorkspaceId}): ${message}`,
    );
  }

  // -------------------------------------------------------------------------
  // Templates
  // -------------------------------------------------------------------------

  private rowToTemplate(row: TemplateRow): RunbookTemplate {
    return {
      templateId: row.template_id,
      version: row.version,
      cells: row.cells as unknown as RunbookTemplateCell[],
      cellsHash: row.cells_hash,
      createdBy: row.created_by,
      createdAt: toIso(row.created_at),
    };
  }

  async saveTemplate(template: RunbookTemplate): Promise<void> {
    const { error } = await this.client.from("runbook_templates").insert({
      template_id: template.templateId,
      version: template.version,
      tenant_workspace_id: this.tenantWorkspaceId,
      cells: template.cells as unknown as Json,
      cells_hash: template.cellsHash,
      created_by: template.createdBy,
      created_at: template.createdAt,
    });
    if (error) {
      if (error.code === "23505") {
        // Typed so ensureTemplateVersion can recover from a lost version race.
        throw new TemplateVersionConflictError(
          template.templateId,
          template.version,
          `tenant ${this.tenantWorkspaceId}`,
        );
      }
      this.fail("saveTemplate", error.message);
    }
  }

  async getTemplate(templateId: string, version: number): Promise<RunbookTemplate | null> {
    const { data, error } = await this.client
      .from("runbook_templates")
      .select()
      .eq("template_id", templateId)
      .eq("version", version)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail("getTemplate", error.message);
    return data ? this.rowToTemplate(data) : null;
  }

  async getLatestTemplate(templateId: string): Promise<RunbookTemplate | null> {
    const { data, error } = await this.client
      .from("runbook_templates")
      .select()
      .eq("template_id", templateId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) this.fail("getLatestTemplate", error.message);
    return data ? this.rowToTemplate(data) : null;
  }

  async listTemplateVersions(templateId: string): Promise<number[]> {
    const { data, error } = await this.client
      .from("runbook_templates")
      .select("version")
      .eq("template_id", templateId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .order("version", { ascending: true });
    if (error) this.fail("listTemplateVersions", error.message);
    return (data ?? []).map((row) => row.version);
  }

  // -------------------------------------------------------------------------
  // Instances
  // -------------------------------------------------------------------------

  private rowToInstance(row: InstanceRow): RunbookInstance {
    return {
      instanceId: row.id,
      templateId: row.template_id,
      templateVersion: row.template_version,
      createdBy: row.created_by,
      createdAt: toIso(row.created_at),
    };
  }

  async createInstance(instance: RunbookInstance): Promise<void> {
    const { error } = await this.client.from("runbook_instances").insert({
      id: instance.instanceId,
      template_id: instance.templateId,
      template_version: instance.templateVersion,
      tenant_workspace_id: this.tenantWorkspaceId,
      created_by: instance.createdBy,
      created_at: instance.createdAt,
    });
    if (error) {
      if (error.code === "23505") {
        this.fail("createInstance", `instance ${instance.instanceId} already exists`);
      }
      if (error.code === "23503") {
        this.fail(
          "createInstance",
          `template ${instance.templateId} version ${instance.templateVersion} not found — ` +
            `an instance must pin an existing template version`,
        );
      }
      this.fail("createInstance", error.message);
    }
  }

  async getInstance(instanceId: string): Promise<RunbookInstance | null> {
    const { data, error } = await this.client
      .from("runbook_instances")
      .select()
      .eq("id", instanceId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .maybeSingle();
    if (error) this.fail("getInstance", error.message);
    return data ? this.rowToInstance(data) : null;
  }

  async listInstances(templateId: string): Promise<RunbookInstance[]> {
    const { data, error } = await this.client
      .from("runbook_instances")
      .select()
      .eq("template_id", templateId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) this.fail("listInstances", error.message);
    return (data ?? []).map((row) => this.rowToInstance(row));
  }

  // -------------------------------------------------------------------------
  // Cell executions (append-only)
  // -------------------------------------------------------------------------

  private rowToExecution(row: ExecutionRow): CellExecutionRecord {
    return {
      instanceId: row.instance_id,
      seq: row.seq,
      cellId: row.cell_id,
      startedAt: toIso(row.started_at),
      agentId: row.agent_id,
      inputsDigest: row.inputs_digest,
      ...(row.outputs_ref !== null ? { outputsRef: row.outputs_ref } : {}),
      status: row.status as CellExecutionStatus,
      expectations: row.expectations as unknown as ExpectationRecord[],
    };
  }

  async appendCellExecution(record: CellExecutionRecord): Promise<void> {
    const { error } = await this.client.from("runbook_cell_executions").insert({
      instance_id: record.instanceId,
      seq: record.seq,
      cell_id: record.cellId,
      tenant_workspace_id: this.tenantWorkspaceId,
      started_at: record.startedAt,
      agent_id: record.agentId,
      inputs_digest: record.inputsDigest,
      outputs_ref: record.outputsRef ?? null,
      status: record.status,
      expectations: record.expectations as unknown as Json,
    });
    if (error) {
      if (error.code === "23505") {
        this.fail(
          "appendCellExecution",
          `execution seq ${record.seq} already recorded for instance ${record.instanceId} — ` +
            `records are append-only; re-execution must append a new seq`,
        );
      }
      if (error.code === "23503") {
        this.fail("appendCellExecution", `instance ${record.instanceId} not found`);
      }
      this.fail("appendCellExecution", error.message);
    }
  }

  async listCellExecutions(instanceId: string): Promise<CellExecutionRecord[]> {
    const { data, error } = await this.client
      .from("runbook_cell_executions")
      .select()
      .eq("instance_id", instanceId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .order("seq", { ascending: true });
    if (error) this.fail("listCellExecutions", error.message);
    return (data ?? []).map((row) => this.rowToExecution(row));
  }

  // -------------------------------------------------------------------------
  // Advance reservations (B8 CAS — GH #403)
  // -------------------------------------------------------------------------

  private rowToReservation(row: ReservationRow): AdvanceReservation {
    return {
      instanceId: row.instance_id,
      seq: row.seq,
      cellId: row.cell_id,
      agentId: row.agent_id,
      reservedAt: toIso(row.reserved_at),
    };
  }

  /**
   * Conditional insert against the (instance_id, seq) primary key: Postgres
   * guarantees exactly one of any set of concurrent inserts commits; every
   * loser observes 23505 and surfaces the typed conflict WITHOUT having run
   * any side effect. The table is insert-only (UPDATE/DELETE revoked by
   * migration 20260615000000), so a reservation can never be stolen.
   */
  async reserveAdvance(reservation: AdvanceReservation): Promise<void> {
    const { error } = await this.client.from("runbook_advance_reservations").insert({
      instance_id: reservation.instanceId,
      seq: reservation.seq,
      cell_id: reservation.cellId,
      tenant_workspace_id: this.tenantWorkspaceId,
      agent_id: reservation.agentId,
      reserved_at: reservation.reservedAt,
    });
    if (error) {
      if (error.code === "23505") {
        throw new AdvanceReservationConflictError(
          reservation.instanceId,
          reservation.seq,
          `tenant ${this.tenantWorkspaceId}`,
        );
      }
      if (error.code === "23503") {
        this.fail("reserveAdvance", `instance ${reservation.instanceId} not found`);
      }
      this.fail("reserveAdvance", error.message);
    }
  }

  async listAdvanceReservations(instanceId: string): Promise<AdvanceReservation[]> {
    const { data, error } = await this.client
      .from("runbook_advance_reservations")
      .select()
      .eq("instance_id", instanceId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId)
      .order("seq", { ascending: true });
    if (error) this.fail("listAdvanceReservations", error.message);
    return (data ?? []).map((row) => this.rowToReservation(row));
  }

  // -------------------------------------------------------------------------
  // Fitness ledger (append-only)
  // -------------------------------------------------------------------------

  private rowToLedgerRow(row: LedgerRow): FitnessLedgerRow {
    return {
      templateId: row.template_id,
      templateVersion: row.template_version,
      instanceId: row.instance_id,
      cellId: row.cell_id,
      tier: row.tier as 1 | 2,
      result: row.result as ExpectationResult,
      pass: row.pass,
      expected: row.expected,
      ...(row.actual !== null ? { actual: row.actual } : {}),
      ...(row.error !== null ? { error: row.error } : {}),
      agentId: row.agent_id,
      ts: toIso(row.ts),
    };
  }

  async appendFitnessRows(rows: FitnessLedgerRow[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.client.from("runbook_fitness_ledger").insert(
      rows.map((row) => ({
        template_id: row.templateId,
        template_version: row.templateVersion,
        instance_id: row.instanceId,
        cell_id: row.cellId,
        tenant_workspace_id: this.tenantWorkspaceId,
        tier: row.tier,
        result: row.result,
        pass: row.pass,
        expected: row.expected as Json,
        actual: (row.actual ?? null) as Json,
        error: row.error ?? null,
        agent_id: row.agentId,
        ts: row.ts,
      })),
    );
    if (error) {
      if (error.code === "23503") {
        this.fail(
          "appendFitnessRows",
          `a ledger row references a missing instance or carries a ` +
            `(template_id, template_version) that does not match its instance's ` +
            `template pinning: ${error.message}`,
        );
      }
      this.fail("appendFitnessRows", error.message);
    }
  }

  async listFitnessRows(
    templateId: string,
    templateVersion?: number,
  ): Promise<FitnessLedgerRow[]> {
    let request = this.client
      .from("runbook_fitness_ledger")
      .select()
      .eq("template_id", templateId)
      .eq("tenant_workspace_id", this.tenantWorkspaceId);
    if (templateVersion !== undefined) {
      request = request.eq("template_version", templateVersion);
    }
    const { data, error } = await request.order("id", { ascending: true });
    if (error) this.fail("listFitnessRows", error.message);
    return (data ?? []).map((row) => this.rowToLedgerRow(row));
  }

  async getFitnessAggregate(
    templateId: string,
    templateVersion: number,
  ): Promise<FitnessAggregate> {
    const rows = await this.listFitnessRows(templateId, templateVersion);
    return aggregateFitness(templateId, templateVersion, rows);
  }
}

/**
 * Per-tenant SupabaseRunbookStorage provider for multi-tenant mode.
 * Instances are cached per tenant workspace; all rows are scoped by
 * tenant_workspace_id so durable runbooks never cross tenant boundaries.
 * Mirrors createSupabaseClaimStorageProvider.
 */
export function createSupabaseRunbookStorageProvider(
  config: Omit<SupabaseRunbookStorageConfig, "tenantWorkspaceId">,
): (tenantWorkspaceId: string) => RunbookStorage {
  const cache = new Map<string, RunbookStorage>();
  return (tenantWorkspaceId: string): RunbookStorage => {
    let storage = cache.get(tenantWorkspaceId);
    if (!storage) {
      storage = new SupabaseRunbookStorage({ ...config, tenantWorkspaceId });
      cache.set(tenantWorkspaceId, storage);
    }
    return storage;
  };
}
