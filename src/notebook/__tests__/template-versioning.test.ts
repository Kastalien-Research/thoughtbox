/**
 * Concurrency-safe template version resolution (Greptile PR #401 — TOCTOU
 * race between getLatestTemplate and saveTemplate).
 *
 * The race: two concurrent runs of the same notebook both read the latest
 * template version, both compute version + 1, and the loser's saveTemplate
 * hits the (templateId, version) uniqueness guarantee. ensureTemplateVersion
 * must recover the loser — reusing the winner's just-written version when the
 * cells hash matches, appending the next version when content diverged —
 * instead of failing the run.
 *
 * Covered here: the resolver under a deterministic forced overlap (two
 * storage instances over shared state, first reads barriered), the engine
 * runtime end to end under the same overlap, and the Supabase backend's
 * typed 23505 conflict plus a real two-client race (skips when the local
 * stack is down).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Effect } from "effect";
import {
  InMemoryRunbookStorage,
  createRunbookMemoryState,
} from "../runbook/in-memory-runbook-storage.js";
import { SupabaseRunbookStorage } from "../runbook/supabase-runbook-storage.js";
import {
  ensureTemplateVersion,
  TemplateVersionConflictError,
} from "../runbook/template-versioning.js";
import type { RunbookStorage, RunbookTemplateCell } from "../runbook/types.js";
import {
  InMemoryNotebookEngineRuntime,
  type CellExecutionEvidence,
} from "../engine/runtime.js";
import {
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from "../../__tests__/supabase-test-helpers.js";

function makeCells(marker = "ok"): RunbookTemplateCell[] {
  return [
    {
      cellId: "step",
      cellType: "code",
      filename: "step.js",
      source: `console.log("${marker}");`,
    },
  ];
}

/** Resolves every caller's promise once `parties` callers have arrived. */
function makeBarrier(parties: number): () => Promise<void> {
  let arrived = 0;
  const resolvers: Array<() => void> = [];
  return () =>
    new Promise<void>((resolve) => {
      resolvers.push(resolve);
      arrived += 1;
      if (arrived >= parties) {
        for (const release of resolvers) release();
      }
    });
}

/**
 * Delegating storage whose FIRST getLatestTemplate call blocks until all
 * barrier parties arrive — forces both racers into the check-then-act window
 * (both read "no template yet") before either may write.
 */
function withFirstReadBarrier(
  inner: RunbookStorage,
  arrive: () => Promise<void>,
): RunbookStorage {
  let first = true;
  return {
    saveTemplate: (template) => inner.saveTemplate(template),
    getTemplate: (templateId, version) => inner.getTemplate(templateId, version),
    getLatestTemplate: async (templateId) => {
      if (first) {
        first = false;
        await arrive();
      }
      return inner.getLatestTemplate(templateId);
    },
    listTemplateVersions: (templateId) => inner.listTemplateVersions(templateId),
    createInstance: (instance) => inner.createInstance(instance),
    getInstance: (instanceId) => inner.getInstance(instanceId),
    listInstances: (templateId) => inner.listInstances(templateId),
    appendCellExecution: (record) => inner.appendCellExecution(record),
    listCellExecutions: (instanceId) => inner.listCellExecutions(instanceId),
    appendFitnessRows: (rows) => inner.appendFitnessRows(rows),
    listFitnessRows: (templateId, templateVersion) =>
      inner.listFitnessRows(templateId, templateVersion),
    getFitnessAggregate: (templateId, templateVersion) =>
      inner.getFitnessAggregate(templateId, templateVersion),
  };
}

describe("ensureTemplateVersion — sequential behavior", () => {
  it("reuses the latest version when the cells hash matches, appends when it changes", async () => {
    const storage = new InMemoryRunbookStorage();
    const templateId = `rbt-${randomUUID()}`;

    const v1 = await ensureTemplateVersion(storage, {
      templateId,
      cells: makeCells("a"),
      createdBy: "agent-alice",
    });
    expect(v1.version).toBe(1);

    const reused = await ensureTemplateVersion(storage, {
      templateId,
      cells: makeCells("a"),
      createdBy: "agent-bob",
    });
    expect(reused.version).toBe(1);
    expect(reused.createdBy).toBe("agent-alice");

    const v2 = await ensureTemplateVersion(storage, {
      templateId,
      cells: makeCells("b"),
      createdBy: "agent-bob",
    });
    expect(v2.version).toBe(2);
    expect(await storage.listTemplateVersions(templateId)).toEqual([1, 2]);
  });

  it("propagates non-conflict storage failures instead of retrying them", async () => {
    const storage = new InMemoryRunbookStorage();
    storage.saveTemplate = async () => {
      throw new Error("substrate offline");
    };
    await expect(
      ensureTemplateVersion(storage, {
        templateId: `rbt-${randomUUID()}`,
        cells: makeCells(),
        createdBy: "agent-alice",
      }),
    ).rejects.toThrow(/substrate offline/);
  });
});

describe("ensureTemplateVersion — check-then-act race (two storage instances)", () => {
  it("identical cells: both racers converge on one version, neither fails", async () => {
    const state = createRunbookMemoryState();
    const arrive = makeBarrier(2);
    const templateId = `rbt-${randomUUID()}`;
    const racer = (createdBy: string) =>
      ensureTemplateVersion(
        withFirstReadBarrier(new InMemoryRunbookStorage(state), arrive),
        { templateId, cells: makeCells(), createdBy },
      );

    // Both read "no template" before either writes: the loser's saveTemplate
    // conflicts and must recover by reusing the winner's version 1.
    const [a, b] = await Promise.all([racer("agent-a"), racer("agent-b")]);
    expect(a.version).toBe(1);
    expect(b.version).toBe(1);
    expect(a.cellsHash).toBe(b.cellsHash);
    expect(
      await new InMemoryRunbookStorage(state).listTemplateVersions(templateId),
    ).toEqual([1]);
  });

  it("divergent cells: both racers succeed with distinct appended versions", async () => {
    const state = createRunbookMemoryState();
    const arrive = makeBarrier(2);
    const templateId = `rbt-${randomUUID()}`;
    const racer = (marker: string) =>
      ensureTemplateVersion(
        withFirstReadBarrier(new InMemoryRunbookStorage(state), arrive),
        { templateId, cells: makeCells(marker), createdBy: `agent-${marker}` },
      );

    const [a, b] = await Promise.all([racer("a"), racer("b")]);
    expect([a.version, b.version].sort((x, y) => x - y)).toEqual([1, 2]);
    expect(a.cellsHash).not.toBe(b.cellsHash);
    expect(
      await new InMemoryRunbookStorage(state).listTemplateVersions(templateId),
    ).toEqual([1, 2]);
  });
});

describe("Engine runtime — concurrent first runs of the same notebook", () => {
  it("both runs complete and pin the single template version", async () => {
    const evidence: CellExecutionEvidence[] = [
      {
        cellId: "step",
        cellType: "code",
        filename: "step.js",
        status: "completed",
        exitCode: 0,
        output: "ok",
        error: "",
      },
    ];
    const state = createRunbookMemoryState();
    const arrive = makeBarrier(2);
    const makeRuntime = (agentId: string) =>
      new InMemoryNotebookEngineRuntime(async () => evidence, undefined, {
        storage: withFirstReadBarrier(new InMemoryRunbookStorage(state), arrive),
        agentId,
      });

    const notebookId = "nb_version_race";
    const [a, b] = await Promise.all([
      Effect.runPromise(makeRuntime("agent-a").startRun({ notebookId, mode: "runbook" })),
      Effect.runPromise(makeRuntime("agent-b").startRun({ notebookId, mode: "runbook" })),
    ]);

    // Before the fix the loser surfaced "already exists" as a FailedRun.
    expect(a.run.status).toBe("completed");
    expect(b.run.status).toBe("completed");

    const storage = new InMemoryRunbookStorage(state);
    expect(await storage.listTemplateVersions(notebookId)).toEqual([1]);
    const instances = await storage.listInstances(notebookId);
    expect(instances).toHaveLength(2);
    expect(instances.every((instance) => instance.templateVersion === 1)).toBe(true);
  });
});

describe("SupabaseRunbookStorage — version conflicts (local stack)", () => {
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    await ensureTestWorkspace();
  });

  function makeStorage(): SupabaseRunbookStorage {
    return new SupabaseRunbookStorage({
      supabaseUrl: SUPABASE_TEST_URL,
      serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
      tenantWorkspaceId: TEST_WORKSPACE_ID,
    });
  }

  it("maps the 23505 duplicate-version insert to TemplateVersionConflictError", async ({
    skip,
  }) => {
    if (!available) skip();
    const storage = makeStorage();
    const templateId = `rbt-${randomUUID()}`;
    const cells = makeCells();
    const template = {
      templateId,
      version: 1,
      cells,
      cellsHash: "sha256:race-test",
      createdBy: "agent-alice",
      createdAt: new Date().toISOString(),
    };
    await storage.saveTemplate(template);
    // The retry-on-conflict recovery depends on this exact typed error.
    await expect(storage.saveTemplate(template)).rejects.toBeInstanceOf(
      TemplateVersionConflictError,
    );
  });

  it("two clients resolving the same new template converge on version 1", async ({
    skip,
  }) => {
    if (!available) skip();
    const templateId = `rbt-${randomUUID()}`;
    const racer = (createdBy: string) =>
      ensureTemplateVersion(makeStorage(), {
        templateId,
        cells: makeCells(),
        createdBy,
      });

    const [a, b] = await Promise.all([racer("agent-a"), racer("agent-b")]);
    expect(a.version).toBe(1);
    expect(b.version).toBe(1);
    expect(await makeStorage().listTemplateVersions(templateId)).toEqual([1]);
  });
});
