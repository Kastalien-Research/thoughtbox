/**
 * notebook_fitness — the fitness ledger READ path (SPEC-AGX-SUBSTRATE §7).
 *
 * Before this operation the ledger was write-only: getFitnessAggregate had
 * zero non-storage callers. These tests drive a real contracted runbook run
 * through NotebookHandler and read the accrued fitness back through the same
 * public tool surface an agent uses (tb.notebook.fitness).
 */

import { describe, expect, it } from "vitest";
import { NotebookHandler } from "../index.js";
import {
  InMemoryRunbookStorage,
  createRunbookMemoryState,
} from "../runbook/in-memory-runbook-storage.js";

const WRITE_OUTPUT_SOURCE =
  `import { writeFileSync } from "node:fs";\n` +
  `writeFileSync(process.env.TB_OUTPUT_PATH, JSON.stringify({ count: 3 }));\n` +
  `console.log("step ran");`;

async function contractedRunbook(handler: NotebookHandler, title: string) {
  const created = await handler.handleCreateNotebook({ title, language: "javascript" });
  const notebookId = created.notebook.id as string;
  await handler.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "step.js",
    content: WRITE_OUTPUT_SOURCE,
    contract: {
      schemaVersion: "outcome-contract.v0",
      expectations: [
        { source: { kind: "exitCode" }, op: "eq", value: 0 },
        { source: { kind: "output", pointer: "/count" }, op: "gte", value: 3 },
      ],
    },
  });
  return notebookId;
}

describe("notebook_fitness (ledger read path)", () => {
  it("returns per-version aggregates and raw rows after a contracted run", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    const handler = new NotebookHandler(undefined, {
      runbookStorage: storage,
      agentId: "agent-fitness",
    });
    await handler.init();

    const notebookId = await contractedRunbook(handler, "Fitness read");
    const runResult = await handler.handleStartRun({ notebookId, mode: "runbook" });
    expect(runResult.run.status).toBe("completed");

    const fitness = await handler.handleFitness({
      templateId: notebookId,
      includeRows: true,
    });

    expect(fitness.success).toBe(true);
    expect(fitness.templateId).toBe(notebookId);
    expect(fitness.versions).toEqual([1]);
    expect(fitness.aggregates).toHaveLength(1);
    const aggregate = fitness.aggregates[0];
    expect(aggregate.templateVersion).toBe(1);
    expect(aggregate.instances).toBe(1);
    expect(aggregate.evaluated).toBe(2);
    expect(aggregate.passed).toBe(2);
    expect(aggregate.passRate).toBe(1);
    expect(aggregate.errorRate).toBe(0);
    expect(aggregate.distinctAgents).toBe(1);

    expect(fitness.rows).toHaveLength(2);
    for (const row of fitness.rows) {
      expect(row.templateId).toBe(notebookId);
      expect(row.agentId).toBe("agent-fitness");
      expect(row.pass).toBe(row.result === "pass");
    }
  });

  it("scopes to a single version when templateVersion is given", async () => {
    const storage = new InMemoryRunbookStorage(createRunbookMemoryState());
    const handler = new NotebookHandler(undefined, { runbookStorage: storage });
    await handler.init();

    const notebookId = await contractedRunbook(handler, "Fitness versioned");
    await handler.handleStartRun({ notebookId, mode: "runbook" });

    const fitness = await handler.handleFitness({
      templateId: notebookId,
      templateVersion: 1,
    });
    expect(fitness.aggregates).toHaveLength(1);
    expect(fitness.aggregates[0].templateVersion).toBe(1);
    expect(fitness.rows).toBeUndefined();

    await expect(
      handler.handleFitness({ templateId: notebookId, templateVersion: 7 }),
    ).rejects.toThrow(/no version 7/);
  });

  it("names the remedy when no template versions exist", async () => {
    const handler = new NotebookHandler();
    await handler.init();
    await expect(handler.handleFitness({ templateId: "nb_missing" })).rejects.toThrow(
      /notebook_start_run/,
    );
  });
});
