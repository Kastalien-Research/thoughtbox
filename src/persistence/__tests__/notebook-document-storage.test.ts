/**
 * Durable notebook-document persistence behind notebook_persist
 * (.specs/agentic-runbooks.md H4, dual-backend).
 *
 * Restart simulation follows the runbook-durability pattern: a NEW
 * NotebookHandler (empty in-memory state) over the SAME durable substrate
 * (same baseDir for FileSystem; same table for Supabase). The Supabase
 * backend suite runs only when the local stack is up AND the gated
 * `notebooks` migration has been applied — it skips (with the reason) when
 * the relation is missing, since that migration ships in a separate,
 * droppable commit pending the DB-parity ruling.
 */

import { describe, expect, it, beforeAll } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { randomUUID } from "node:crypto";
import { NotebookHandler } from "../../notebook/index.js";
import {
  FileSystemNotebookDocumentStorage,
  InMemoryNotebookDocumentStorage,
  type NotebookDocumentStorage,
} from "../notebook-document-storage.js";
import { SupabaseNotebookDocumentStorage } from "../supabase-notebook-document-storage.js";
import {
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
  createServiceClient,
} from "../../__tests__/supabase-test-helpers.js";

async function freshTempDir(prefix: string): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

/**
 * Session 1: author a notebook with a contracted cell, persist it through
 * the given backend. Returns what session 2 must be able to restore.
 */
async function persistNotebook(storage: NotebookDocumentStorage) {
  const handler = new NotebookHandler(await freshTempDir("tb-nb-session1-"), {
    documentStorage: storage,
  });
  await handler.init();
  const created = await handler.handleCreateNotebook({
    title: "Persist round-trip",
    language: "javascript",
  });
  const notebookId = created.notebook.id as string;
  await handler.handleAddCell({
    notebookId,
    cellType: "markdown",
    content: "Survives restarts.",
  });
  const added = await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "step.js",
    content: 'console.log("persisted step");',
    contract: {
      schemaVersion: "outcome-contract.v0",
      expectations: [{ source: { kind: "exitCode" }, op: "eq", value: 0 }],
    },
  });

  const persisted = await handler.handlePersist({ notebookId });
  expect(persisted.success).toBe(true);
  expect(persisted.persistence).toBe(storage.backend);
  expect(persisted.persistedAt).toBeTruthy();
  return { notebookId, contractedCellId: added.cell.id as string };
}

/** Session 2 (restart): only the notebookId and the substrate carry over. */
async function restoreAndVerify(
  storage: NotebookDocumentStorage,
  notebookId: string,
  contractedCellId: string,
) {
  const handler = new NotebookHandler(await freshTempDir("tb-nb-session2-"), {
    documentStorage: storage,
  });
  await handler.init();

  const loaded = await handler.handleLoadNotebook({ notebookId });
  expect(loaded.success).toBe(true);
  expect(loaded.restoredFrom).toBe(storage.backend);
  // Identity survives the restart — the durable restore path pins the id.
  expect(loaded.notebook.id).toBe(notebookId);
  expect(loaded.notebook.title).toBe("Persist round-trip");

  // Contract bindings survive via the .src.md thoughtbox:cell encoding.
  const cell = await handler.handleGetCell({ notebookId, cellId: contractedCellId });
  expect(cell.cell.contract).toBeDefined();

  // The restored notebook is executable, not just readable.
  const run = await handler.handleRunCell({ notebookId, cellId: contractedCellId });
  expect(run.success).toBe(true);
}

describe("NotebookDocumentStorage — InMemory backend", () => {
  it("upserts by notebookId (latest wins) and lists summaries", async () => {
    const storage = new InMemoryNotebookDocumentStorage();
    await storage.save({
      notebookId: "nb1",
      title: "v1",
      language: "javascript",
      content: "one",
      persistedAt: "2026-07-06T00:00:00.000Z",
    });
    await storage.save({
      notebookId: "nb1",
      title: "v2",
      language: "javascript",
      content: "two",
      persistedAt: "2026-07-06T00:01:00.000Z",
    });
    const doc = await storage.load("nb1");
    expect(doc?.title).toBe("v2");
    expect(doc?.content).toBe("two");
    const list = await storage.list();
    expect(list).toHaveLength(1);
    expect((list[0] as Record<string, unknown>).content).toBeUndefined();
  });

  it("rejects traversal-shaped notebook ids on both save and load", async () => {
    const storage = new InMemoryNotebookDocumentStorage();
    await expect(
      storage.save({
        notebookId: "../escape",
        title: "x",
        language: "javascript",
        content: "x",
        persistedAt: "2026-07-06T00:00:00.000Z",
      }),
    ).rejects.toThrow(/Invalid notebook id/);
    await expect(storage.load("../escape")).rejects.toThrow(/Invalid notebook id/);
  });
});

describe("NotebookDocumentStorage — FileSystem backend (restart survival)", () => {
  it("persists via notebook_persist and restores via notebook_load { notebookId } across a restart", async () => {
    const baseDir = await freshTempDir("tb-nb-docs-");
    const { notebookId, contractedCellId } = await persistNotebook(
      new FileSystemNotebookDocumentStorage(baseDir),
    );
    // Restart: a brand-new storage instance over the same directory.
    await restoreAndVerify(
      new FileSystemNotebookDocumentStorage(baseDir),
      notebookId,
      contractedCellId,
    );
  });

  it("returns null for unknown ids and [] for an empty base dir", async () => {
    const storage = new FileSystemNotebookDocumentStorage(
      await freshTempDir("tb-nb-empty-"),
    );
    expect(await storage.load("nb_missing")).toBeNull();
    expect(await storage.list()).toEqual([]);
  });

  it("keeps the honest in_memory label when no backend is configured", async () => {
    const handler = new NotebookHandler(await freshTempDir("tb-nb-honest-"));
    await handler.init();
    const created = await handler.handleCreateNotebook({
      title: "No backend",
      language: "javascript",
    });
    const persisted = await handler.handlePersist({ notebookId: created.notebook.id });
    expect(persisted.persistence).toBe("in_memory");
    await expect(
      handler.handleLoadNotebook({ notebookId: created.notebook.id }),
    ).rejects.toThrow(/No durable notebook persistence/);
  });
});

let supabaseReady = false;
let supabaseSkipReason = "local Supabase not running";

beforeAll(async () => {
  if (!(await isSupabaseAvailable())) return;
  // The notebooks table ships in a gated migration; skip (loudly) when absent.
  const probe = await createServiceClient().from("notebooks").select("id").limit(1);
  if (probe.error) {
    supabaseSkipReason = `notebooks table unavailable (gated migration not applied): ${probe.error.message}`;
    return;
  }
  await ensureTestWorkspace();
  supabaseReady = true;
});

describe("NotebookDocumentStorage — Supabase backend (restart survival)", () => {
  it("persists and restores across a restart, tenant-scoped", async (ctx) => {
    if (!supabaseReady) return ctx.skip(supabaseSkipReason);

    const makeStorage = () =>
      new SupabaseNotebookDocumentStorage({
        supabaseUrl: SUPABASE_TEST_URL,
        serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
        tenantWorkspaceId: TEST_WORKSPACE_ID,
      });

    const { notebookId, contractedCellId } = await persistNotebook(makeStorage());
    await restoreAndVerify(makeStorage(), notebookId, contractedCellId);

    // Cross-tenant isolation: another workspace sees nothing.
    const otherTenant = new SupabaseNotebookDocumentStorage({
      supabaseUrl: SUPABASE_TEST_URL,
      serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
      tenantWorkspaceId: randomUUID(),
    });
    expect(await otherTenant.load(notebookId)).toBeNull();
  });
});
