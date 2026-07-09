/**
 * notebook_instantiate — fresh-session instantiation and resumption from a
 * persisted runbook template (SPEC-AGX-SUBSTRATE claim c5 / Experiment H2).
 *
 * Simulates process restarts the same way runbook-durability.test.ts does:
 * a NEW NotebookHandler (empty in-memory notebook state — nothing carried)
 * over the SAME durable storage substrate. The only context that crosses a
 * "restart" is a template id or an instance id.
 */

import { describe, expect, it } from "vitest";
import { NotebookHandler } from "../index.js";
import {
  InMemoryRunbookStorage,
  createRunbookMemoryState,
  type RunbookMemoryState,
} from "../runbook/in-memory-runbook-storage.js";
import {
  hashTemplateCells,
  notebookFromTemplate,
  templateCellsFromNotebook,
} from "../runbook/types.js";

const STEP_SOURCE = (label: string) =>
  `import { writeFileSync } from "node:fs";\n` +
  `writeFileSync(process.env.TB_OUTPUT_PATH, JSON.stringify({ label: "${label}" }));\n` +
  `console.log("${label} ran");`;

const CONTRACT = {
  schemaVersion: "outcome-contract.v0",
  expectations: [{ source: { kind: "exitCode" }, op: "eq", value: 0 }],
};

/** Session 1: author a two-step contracted runbook and version it via a run. */
async function authorTemplate(state: RunbookMemoryState) {
  const handler = new NotebookHandler(undefined, {
    runbookStorage: new InMemoryRunbookStorage(state),
    agentId: "agent-session-1",
  });
  await handler.init();
  const created = await handler.handleCreateNotebook({
    title: "H2 checklist",
    language: "javascript",
  });
  const notebookId = created.notebook.id as string;
  for (const step of ["step1", "step2"]) {
    await handler.handleAddCell({
      notebookId,
      cellType: "code",
      filename: `${step}.js`,
      content: STEP_SOURCE(step),
      contract: CONTRACT,
    });
  }
  const run = await handler.handleStartRun({ notebookId, mode: "runbook" });
  expect(run.run.status).toBe("completed");
  expect(run.run.outputs[0].pass).toBe(true);
  return notebookId;
}

function freshSession(state: RunbookMemoryState, agentId: string) {
  return new NotebookHandler(undefined, {
    runbookStorage: new InMemoryRunbookStorage(state),
    agentId,
  });
}

describe("notebook_instantiate (fresh-session resumption, c5/H2)", () => {
  it("round-trips template cells through notebookFromTemplate hash-identically", async () => {
    const state = createRunbookMemoryState();
    const templateId = await authorTemplate(state);
    const template = await new InMemoryRunbookStorage(state).getLatestTemplate(templateId);
    expect(template).not.toBeNull();
    const notebook = notebookFromTemplate(template!);
    expect(notebook.id).toBe(templateId);
    expect(hashTemplateCells(templateCellsFromNotebook(notebook))).toBe(
      template!.cellsHash,
    );
  });

  it("instantiates from templateId alone in a fresh session and runs to completion", async () => {
    const state = createRunbookMemoryState();
    const templateId = await authorTemplate(state);

    // Fresh session: empty notebook state, only the templateId carried.
    const session2 = freshSession(state, "agent-session-2");
    await session2.init();
    const instantiated = await session2.handleInstantiate({ templateId });

    expect(instantiated.success).toBe(true);
    expect(instantiated.notebookId).toBe(templateId);
    expect(instantiated.resumed).toBe(false);
    expect(instantiated.instance.templateVersion).toBe(1);
    expect(instantiated.instance.status).toBe("created");
    expect(instantiated.instance.createdBy).toBe("agent-session-2");

    // Execute the whole instance in document order via the public surface.
    const instanceId = instantiated.instance.instanceId as string;
    let nextCellId = instantiated.instance.nextCellId as string | null;
    expect(nextCellId).not.toBeNull();
    while (nextCellId !== null) {
      const result = await session2.handleRunCell({
        notebookId: templateId,
        cellId: nextCellId,
        instanceId,
      });
      expect(result.success).toBe(true);
      nextCellId = result.instance.nextCellId;
    }

    const fitness = await session2.handleFitness({ templateId });
    expect(fitness.aggregates[0].instances).toBe(2); // authoring run + this instance
  });

  it("resumes a half-executed instance from instanceId alone in a fresh session", async () => {
    const state = createRunbookMemoryState();
    const templateId = await authorTemplate(state);

    // Session 2: new instance, execute only the FIRST half.
    const session2 = freshSession(state, "agent-session-2");
    await session2.init();
    const instantiated = await session2.handleInstantiate({ templateId });
    const instanceId = instantiated.instance.instanceId as string;
    const first = await session2.handleRunCell({
      notebookId: templateId,
      cellId: instantiated.instance.nextCellId,
      instanceId,
    });
    expect(first.success).toBe(true);
    expect(first.instance.status).toBe("in_progress");
    const expectedNext = first.instance.nextCellId as string;

    // Session 3 (agent death simulated): ONLY the instanceId crosses over.
    const session3 = freshSession(state, "agent-session-3");
    await session3.init();
    const resumed = await session3.handleInstantiate({ instanceId });

    expect(resumed.resumed).toBe(true);
    expect(resumed.notebookId).toBe(templateId);
    expect(resumed.instance.instanceId).toBe(instanceId);
    expect(resumed.instance.status).toBe("in_progress");
    expect(resumed.instance.nextCellId).toBe(expectedNext);
    expect(resumed.instance.executedCells.every((c: any) => c.satisfied)).toBe(true);

    // Ordering still binds on the resumed instance: jumping past the next
    // unsatisfied cell is rejected (re-execution only unlocks once every
    // cell is satisfied — ordering.ts contract).
    const lastCellId = resumed.template.cells.at(-1)!.cellId as string;
    expect(lastCellId).not.toBe(expectedNext);
    await expect(
      session3.handleRunCell({
        notebookId: templateId,
        cellId: lastCellId,
        instanceId,
      }),
    ).rejects.toThrow(/out-of-order/);

    // Complete the remaining cells with zero carried context.
    let nextCellId = resumed.instance.nextCellId as string | null;
    let finalStatus = resumed.instance.status;
    while (nextCellId !== null) {
      const result = await session3.handleRunCell({
        notebookId: templateId,
        cellId: nextCellId,
        instanceId,
      });
      expect(result.success).toBe(true);
      nextCellId = result.instance.nextCellId;
      finalStatus = result.instance.status;
    }
    expect(finalStatus).toBe("completed");
  });

  it("rejects unknown templates, versions, and instances with named errors", async () => {
    const state = createRunbookMemoryState();
    const templateId = await authorTemplate(state);
    const session = freshSession(state, "agent-x");
    await session.init();

    await expect(session.handleInstantiate({})).rejects.toThrow(
      /templateId .* or instanceId/,
    );
    await expect(
      session.handleInstantiate({ templateId: "nb_missing" }),
    ).rejects.toThrow(/No template versions/);
    await expect(
      session.handleInstantiate({ templateId, templateVersion: 9 }),
    ).rejects.toThrow(/version 9 not found/);
    await expect(
      session.handleInstantiate({ instanceId: "rbi_missing" }),
    ).rejects.toThrow(/not found/);
  });
});
