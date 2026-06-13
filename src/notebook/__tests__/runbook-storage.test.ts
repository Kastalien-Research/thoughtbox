/**
 * RunbookStorage contract suite (SPEC-AGX-SUBSTRATE B4b — claim c3 instance
 * half + claim c7 fitness ledger).
 *
 * Runs the shared contract against both backends — InMemoryRunbookStorage
 * and SupabaseRunbookStorage (local stack) — then covers Supabase-specific
 * guarantees: database-level append-only enforcement (revoked UPDATE/DELETE
 * grants) and tenant isolation. Supabase tests skip gracefully when the
 * local stack is not running (src/__tests__/supabase-test-helpers).
 *
 * Because the runbook tables revoke DELETE even from service_role, tests
 * never clean these tables up — every test uses fresh random ids instead.
 *
 * A FileSystemRunbookStorage is deliberately absent (deferred per spec §11.5).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import {
  InMemoryRunbookStorage,
  createRunbookMemoryState,
} from "../runbook/in-memory-runbook-storage.js";
import { SupabaseRunbookStorage } from "../runbook/supabase-runbook-storage.js";
import {
  aggregateFitness,
  deriveInstanceStatus,
  hashTemplateCells,
  verifyTemplateContracts,
  type CellExecutionRecord,
  type FitnessLedgerRow,
  type RunbookInstance,
  type RunbookStorage,
  type RunbookTemplate,
  type RunbookTemplateCell,
} from "../runbook/types.js";
import { compileOutcomeContract } from "../contracts.js";
import {
  createServiceClient,
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from "../../__tests__/supabase-test-helpers.js";

const TENANT_B_WORKSPACE_ID = "33333333-3333-4333-a333-333333333333";

function makeTemplateCells(): RunbookTemplateCell[] {
  return [
    {
      cellId: "pkg",
      cellType: "package.json",
      filename: "package.json",
      source: '{ "type": "module", "dependencies": {} }',
    },
    {
      cellId: "step",
      cellType: "code",
      filename: "step.js",
      source: 'console.log("ok");',
      contract: compileOutcomeContract({
        schemaVersion: "outcome-contract.v0",
        expectations: [{ source: { kind: "exitCode" }, op: "eq", value: 0 }],
      }),
    },
  ];
}

function makeTemplate(
  templateId: string,
  version = 1,
  cells: RunbookTemplateCell[] = makeTemplateCells(),
): RunbookTemplate {
  return {
    templateId,
    version,
    cells,
    cellsHash: hashTemplateCells(cells),
    createdBy: "agent-alice",
    createdAt: new Date().toISOString(),
  };
}

function makeInstance(
  template: RunbookTemplate,
  overrides: Partial<RunbookInstance> = {},
): RunbookInstance {
  return {
    instanceId: `rbi-${randomUUID()}`,
    templateId: template.templateId,
    templateVersion: template.version,
    createdBy: "agent-alice",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeExecution(
  instanceId: string,
  seq: number,
  overrides: Partial<CellExecutionRecord> = {},
): CellExecutionRecord {
  return {
    instanceId,
    seq,
    cellId: "step",
    startedAt: new Date().toISOString(),
    agentId: "agent-alice",
    inputsDigest: "sha256:abc",
    outputsRef: "nba_evidence",
    status: "completed",
    expectations: [
      {
        cellId: "step",
        tier: 1,
        expectation: "exitCode eq 0",
        result: "pass",
        expected: { source: { kind: "exitCode" }, op: "eq", value: 0 },
        actual: 0,
      },
    ],
    ...overrides,
  };
}

function makeLedgerRow(
  template: RunbookTemplate,
  instanceId: string,
  overrides: Partial<FitnessLedgerRow> = {},
): FitnessLedgerRow {
  return {
    templateId: template.templateId,
    templateVersion: template.version,
    instanceId,
    cellId: "step",
    tier: 1,
    result: "pass",
    pass: true,
    expected: { source: { kind: "exitCode" }, op: "eq", value: 0 },
    actual: 0,
    agentId: "agent-alice",
    ts: new Date().toISOString(),
    ...overrides,
  };
}

interface ContractContext {
  storage: RunbookStorage;
}

// =============================================================================
// Shared RunbookStorage contract
// =============================================================================

function runRunbookStorageContract(
  ctx: () => ContractContext,
  isAvailable: () => boolean,
): void {
  it("round-trips template versions and rejects in-place rewrites", async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const templateId = `rbt-${randomUUID()}`;

    const v1 = makeTemplate(templateId, 1);
    await storage.saveTemplate(v1);
    expect(await storage.getTemplate(templateId, 1)).toEqual(v1);
    expect(await storage.getTemplate(templateId, 2)).toBeNull();
    expect(await storage.getTemplate("rbt-missing", 1)).toBeNull();

    // A version is immutable: re-saving (templateId, 1) throws, even with
    // different cells — new content must become a new version.
    const rewritten = makeTemplate(templateId, 1, [
      { cellId: "other", cellType: "code", filename: "other.js", source: "1" },
    ]);
    await expect(storage.saveTemplate(rewritten)).rejects.toThrow(/already exists/);
    expect(await storage.getTemplate(templateId, 1)).toEqual(v1);

    const v2Cells: RunbookTemplateCell[] = [
      ...makeTemplateCells(),
      { cellId: "extra", cellType: "code", filename: "extra.js", source: "2" },
    ];
    const v2 = makeTemplate(templateId, 2, v2Cells);
    await storage.saveTemplate(v2);

    expect(await storage.listTemplateVersions(templateId)).toEqual([1, 2]);
    expect(await storage.getLatestTemplate(templateId)).toEqual(v2);
    expect(await storage.getLatestTemplate("rbt-missing")).toBeNull();
  });

  it("preserves compiled outcome contracts across the persistence round-trip", async ({
    skip,
  }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const templateId = `rbt-${randomUUID()}`;

    await storage.saveTemplate(makeTemplate(templateId, 1));
    const loaded = await storage.getTemplate(templateId, 1);

    // Hash re-verification passes on the loaded contract (Ulysses pattern at
    // the durable layer — closes the B4a "contracts don't survive export"
    // gap for durable templates).
    expect(() => verifyTemplateContracts(loaded!)).not.toThrow();
    const contracted = loaded!.cells.find((cell) => cell.contract !== undefined)!;
    expect(contracted.contract!.contractHash).toMatch(/^sha256:/);

    // A tampered loaded copy fails verification.
    (
      contracted.contract!.contract.expectations[0] as { value: unknown }
    ).value = 1;
    expect(() => verifyTemplateContracts(loaded!)).toThrow(/hash mismatch/);
  });

  it("pins instances to an existing template version at creation", async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await storage.saveTemplate(template);

    const instance = makeInstance(template);
    await storage.createInstance(instance);
    expect(await storage.getInstance(instance.instanceId)).toEqual(instance);
    expect(await storage.getInstance("rbi-missing")).toBeNull();

    await expect(storage.createInstance(instance)).rejects.toThrow(/already exists/);
    await expect(
      storage.createInstance(makeInstance(template, { templateVersion: 99 })),
    ).rejects.toThrow(/not found/);

    const second = makeInstance(template);
    await storage.createInstance(second);
    const listed = await storage.listInstances(template.templateId);
    expect(listed.map((i) => i.instanceId).sort()).toEqual(
      [instance.instanceId, second.instanceId].sort(),
    );
  });

  it("appends cell executions and rejects any rewrite of a prior record", async ({
    skip,
  }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await storage.saveTemplate(template);
    const instance = makeInstance(template);
    await storage.createInstance(instance);

    const first = makeExecution(instance.instanceId, 1, { cellId: "pkg" });
    const second = makeExecution(instance.instanceId, 2, { status: "failed" });
    await storage.appendCellExecution(first);
    await storage.appendCellExecution(second);

    // Rewriting seq 2 must fail — re-execution appends a fresh seq instead.
    await expect(
      storage.appendCellExecution(
        makeExecution(instance.instanceId, 2, { status: "completed" }),
      ),
    ).rejects.toThrow(/append-only/);
    const reExecution = makeExecution(instance.instanceId, 3, { status: "completed" });
    await storage.appendCellExecution(reExecution);

    const records = await storage.listCellExecutions(instance.instanceId);
    expect(records).toEqual([first, second, reExecution]);
    expect(records[1]!.status).toBe("failed");

    await expect(
      storage.appendCellExecution(makeExecution("rbi-missing", 1)),
    ).rejects.toThrow(/not found/);

    // Status is derived from the append-only history: the latest record per
    // cell wins, so the seq-3 re-execution supersedes the seq-2 failure.
    expect(deriveInstanceStatus(template, records)).toBe("completed");
    expect(deriveInstanceStatus(template, [first, second])).toBe("failed");
    expect(deriveInstanceStatus(template, [first])).toBe("in_progress");
    expect(deriveInstanceStatus(template, [])).toBe("created");
  });

  it("records fitness rows and aggregates them per template version (spec §7)", async ({
    skip,
  }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await storage.saveTemplate(template);
    const instanceA = makeInstance(template);
    const instanceB = makeInstance(template);
    await storage.createInstance(instanceA);
    await storage.createInstance(instanceB);

    await storage.appendFitnessRows([
      makeLedgerRow(template, instanceA.instanceId),
      makeLedgerRow(template, instanceA.instanceId, {
        result: "fail",
        pass: false,
        actual: 1,
        agentId: "agent-bob",
        tier: 2,
      }),
      makeLedgerRow(template, instanceB.instanceId, {
        result: "error",
        pass: false,
        error: "claim resolver not wired",
      }),
      makeLedgerRow(template, instanceB.instanceId, {
        result: "skipped",
        pass: false,
        error: "cell never reached (earlier cell failed)",
      }),
    ]);

    const rows = await storage.listFitnessRows(template.templateId, template.version);
    expect(rows).toHaveLength(4);
    expect(rows.filter((row) => row.tier === 2)).toHaveLength(1);

    // Aggregate: error/skipped rows are recorded but never count toward the
    // pass-rate; only machine-evaluated pass/fail rows do.
    const aggregate = await storage.getFitnessAggregate(
      template.templateId,
      template.version,
    );
    expect(aggregate).toEqual({
      templateId: template.templateId,
      templateVersion: template.version,
      instances: 2,
      evaluated: 2,
      passed: 1,
      passRate: 0.5,
      errorRows: 1,
      errorRate: 0.25,
      distinctAgents: 2,
    });
    expect(aggregate).toEqual(aggregateFitness(template.templateId, template.version, rows));

    // Version filter: rows from a later version do not leak into v1 aggregates.
    const v2 = makeTemplate(template.templateId, 2, [
      ...makeTemplateCells(),
      { cellId: "extra", cellType: "code", filename: "extra.js", source: "2" },
    ]);
    await storage.saveTemplate(v2);
    const instanceV2 = makeInstance(v2);
    await storage.createInstance(instanceV2);
    await storage.appendFitnessRows([makeLedgerRow(v2, instanceV2.instanceId)]);

    expect(
      await storage.listFitnessRows(template.templateId, template.version),
    ).toHaveLength(4);
    expect(await storage.listFitnessRows(template.templateId)).toHaveLength(5);
    expect(
      (await storage.getFitnessAggregate(template.templateId, 2)).passRate,
    ).toBe(1);
  });

  it("rejects ledger rows where pass disagrees with the result", async ({ skip }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await storage.saveTemplate(template);
    const instance = makeInstance(template);
    await storage.createInstance(instance);

    await expect(
      storage.appendFitnessRows([
        makeLedgerRow(template, instance.instanceId, { result: "error", pass: true }),
      ]),
    ).rejects.toThrow();
  });

  it("rejects ledger rows for missing instances or mismatched template pinning", async ({
    skip,
  }) => {
    if (!isAvailable()) skip();
    const { storage } = ctx();
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await storage.saveTemplate(template);
    const instance = makeInstance(template);
    await storage.createInstance(instance);

    // Unknown instance — the instance_id FK (InMemory: explicit check).
    await expect(
      storage.appendFitnessRows([makeLedgerRow(template, `rbi-${randomUUID()}`)]),
    ).rejects.toThrow();

    // The denormalized (templateId, templateVersion) must match the
    // instance's pinning even when the other version EXISTS as a template —
    // migration 20260612130000's composite FK / the InMemory pinning check.
    const v2 = makeTemplate(template.templateId, 2, [
      ...makeTemplateCells(),
      { cellId: "extra", cellType: "code", filename: "extra.js", source: "2" },
    ]);
    await storage.saveTemplate(v2);
    await expect(
      storage.appendFitnessRows([makeLedgerRow(v2, instance.instanceId)]),
    ).rejects.toThrow();

    // A matching row is still accepted, and nothing from the rejected
    // batches leaked into the ledger.
    await storage.appendFitnessRows([makeLedgerRow(template, instance.instanceId)]);
    expect(await storage.listFitnessRows(template.templateId)).toHaveLength(1);
  });
}

// =============================================================================
// InMemory backend
// =============================================================================

describe("RunbookStorage contract — InMemoryRunbookStorage", () => {
  const context: ContractContext = { storage: new InMemoryRunbookStorage() };
  runRunbookStorageContract(
    () => context,
    () => true,
  );

  it("survives a simulated restart when backed by shared state", async () => {
    const state = createRunbookMemoryState();
    const before = new InMemoryRunbookStorage(state);
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await before.saveTemplate(template);
    const instance = makeInstance(template);
    await before.createInstance(instance);
    await before.appendCellExecution(makeExecution(instance.instanceId, 1));

    // New instance of the class over the same durable substrate.
    const after = new InMemoryRunbookStorage(state);
    expect(await after.getTemplate(template.templateId, 1)).toEqual(template);
    expect(await after.getInstance(instance.instanceId)).toEqual(instance);
    expect(await after.listCellExecutions(instance.instanceId)).toHaveLength(1);
  });
});

// =============================================================================
// Supabase backend (local stack; skips when unavailable)
// =============================================================================

function makeSupabaseRunbookStorage(tenantWorkspaceId: string): SupabaseRunbookStorage {
  return new SupabaseRunbookStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId,
  });
}

async function ensureTenantBWorkspace(): Promise<void> {
  const client = createServiceClient();
  const { data: users } = await client.auth.admin.listUsers();
  const testUser = users?.users?.find((u) => u.email === "test@test.local");
  if (!testUser) throw new Error("Test user missing; run ensureTestWorkspace first");
  const { error } = await client.from("workspaces").upsert(
    {
      id: TENANT_B_WORKSPACE_ID,
      name: "Test Workspace B (runbooks)",
      slug: "test-workspace-b-runbooks",
      owner_user_id: testUser.id,
      status: "active",
      plan_id: "free",
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`Failed to create tenant B workspace: ${error.message}`);
}

describe("RunbookStorage contract — SupabaseRunbookStorage", () => {
  let available = false;
  let context: ContractContext;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    await ensureTestWorkspace();
    context = { storage: makeSupabaseRunbookStorage(TEST_WORKSPACE_ID) };
  });

  runRunbookStorageContract(
    () => context,
    () => available,
  );
});

describe("SupabaseRunbookStorage — database-level append-only enforcement", () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    await ensureTestWorkspace();
  });

  it("denies UPDATE and DELETE on execution records even for service_role", async ({
    skip,
  }) => {
    if (!available) skip();
    const storage = makeSupabaseRunbookStorage(TEST_WORKSPACE_ID);
    const template = makeTemplate(`rbt-${randomUUID()}`);
    await storage.saveTemplate(template);
    const instance = makeInstance(template);
    await storage.createInstance(instance);
    await storage.appendCellExecution(makeExecution(instance.instanceId, 1));

    // Raw service-role client bypasses the storage layer entirely; the
    // revoked grants (migration 20260612120000) must still block rewrites.
    const raw = createServiceClient();
    const update = await raw
      .from("runbook_cell_executions")
      .update({ status: "completed" })
      .eq("instance_id", instance.instanceId);
    expect(update.error?.message).toMatch(/permission denied/);

    const del = await raw
      .from("runbook_cell_executions")
      .delete()
      .eq("instance_id", instance.instanceId);
    expect(del.error?.message).toMatch(/permission denied/);

    const templateUpdate = await raw
      .from("runbook_templates")
      .update({ cells_hash: "sha256:tampered" })
      .eq("template_id", template.templateId);
    expect(templateUpdate.error?.message).toMatch(/permission denied/);

    const ledgerDelete = await raw
      .from("runbook_fitness_ledger")
      .delete()
      .eq("instance_id", instance.instanceId);
    expect(ledgerDelete.error?.message).toMatch(/permission denied/);

    // The record is intact after all four attempts.
    const records = await storage.listCellExecutions(instance.instanceId);
    expect(records).toHaveLength(1);
    expect(records[0]!.seq).toBe(1);
  });
});

describe("SupabaseRunbookStorage — tenant isolation", () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    await ensureTestWorkspace();
    await ensureTenantBWorkspace();
  });

  it("templates, instances, executions, and ledger rows are invisible across tenants", async ({
    skip,
  }) => {
    if (!available) skip();
    const tenantA = makeSupabaseRunbookStorage(TEST_WORKSPACE_ID);
    const tenantB = makeSupabaseRunbookStorage(TENANT_B_WORKSPACE_ID);

    const template = makeTemplate(`rbt-${randomUUID()}`);
    await tenantA.saveTemplate(template);
    const instance = makeInstance(template);
    await tenantA.createInstance(instance);
    await tenantA.appendCellExecution(makeExecution(instance.instanceId, 1));
    await tenantA.appendFitnessRows([makeLedgerRow(template, instance.instanceId)]);

    expect(await tenantB.getTemplate(template.templateId, 1)).toBeNull();
    expect(await tenantB.getLatestTemplate(template.templateId)).toBeNull();
    expect(await tenantB.listTemplateVersions(template.templateId)).toEqual([]);
    expect(await tenantB.getInstance(instance.instanceId)).toBeNull();
    expect(await tenantB.listInstances(template.templateId)).toEqual([]);
    expect(await tenantB.listCellExecutions(instance.instanceId)).toEqual([]);
    expect(await tenantB.listFitnessRows(template.templateId)).toEqual([]);

    const aggregate = await tenantB.getFitnessAggregate(template.templateId, 1);
    expect(aggregate.instances).toBe(0);
    expect(aggregate.passRate).toBeNull();
  });
});
