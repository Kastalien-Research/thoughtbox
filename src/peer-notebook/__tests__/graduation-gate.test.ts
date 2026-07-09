/**
 * B10 evidence-gated graduation — handler integration
 * (SPEC-AGX-SUBSTRATE claim c8, ELG tier ladder folded into B10).
 *
 * Covers the done-criteria directly:
 * - shadow default records would-have-blocked with ZERO behavior change
 * - enforce rejects a never-run notebook naming the missing evidence
 * - thresholds satisfied ⇒ graduation proceeds under enforce
 * - the THOUGHTBOX_GRADUATION_GATE env switch flips enforcement
 */

import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { NotebookHandler } from "../../notebook/index.js";
import {
  GRADUATION_GATE_ENV_VAR,
} from "../../notebook/runbook/graduation-gate.js";
import { hashTemplateCells, type RunbookTemplateCell } from "../../notebook/runbook/types.js";
import {
  InMemoryPeerNotebookRepository,
  PeerNotebookHandler,
  type PeerGraduationGateOptions,
} from "../index.js";
import { graduationPeerManifest } from "./fixtures.js";

const WORKSPACE_ID = "workspace_graduation_gate";

const tempDirs: string[] = [];

afterAll(async () => {
  for (const dir of tempDirs) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe("evidence-gated graduation (B10)", () => {
  it("shadow default: a never-run notebook still graduates, with the would-have-blocked recorded", async () => {
    const { handler, notebookHandler } = await setup();
    const notebookId = await notebookWithManifestCell(notebookHandler, "shadow-peer");

    const result = await handler.graduateNotebook({ notebookId });

    // Zero behavior change: the draft lands exactly as before the gate.
    expect(result.manifest.status).toBe("draft");
    expect(result.manifest.version).toBe(1);
    expect(result.supersededManifestIds).toEqual([]);

    // The decision is recorded: shadow tier, failing, non-blocking.
    expect(result.gateDecision).toMatchObject({
      mode: "shadow",
      pass: false,
      enforced: false,
      wouldHaveBlocked: true,
      templateId: notebookId,
      templateVersion: null,
    });
    expect(result.gateDecision.deficits.join(" ")).toContain("no fitness evidence");
  });

  it("enforce: a never-run notebook is rejected with an explanation naming the missing evidence", async () => {
    const { handler, notebookHandler } = await setup({ mode: "enforce" });
    const notebookId = await notebookWithManifestCell(notebookHandler, "enforced-peer");

    await expect(handler.graduateNotebook({ notebookId })).rejects.toMatchObject({
      code: "graduation_below_threshold",
      message: expect.stringContaining("no fitness evidence"),
    });
    await expect(handler.graduateNotebook({ notebookId })).rejects.toMatchObject({
      message: expect.stringContaining("never run as a runbook"),
    });
  });

  it("enforce: graduation proceeds when the fitness ledger satisfies the thresholds", async () => {
    const { handler, notebookHandler } = await setup({
      mode: "enforce",
      thresholds: { minInstances: 2, minPassRate: 0.9, minDistinctAgents: 1 },
    });
    const notebookId = await notebookWithManifestCell(notebookHandler, "evidenced-peer");
    await seedFitness(notebookHandler, notebookId, { instances: 2, result: "pass" });

    const result = await handler.graduateNotebook({ notebookId });

    expect(result.manifest.status).toBe("draft");
    expect(result.gateDecision).toMatchObject({
      mode: "enforce",
      pass: true,
      enforced: true,
      wouldHaveBlocked: false,
      templateVersion: 1,
    });
    expect(result.gateDecision.aggregate).toMatchObject({ instances: 2, passRate: 1 });
  });

  it("enforce: rejection names the failing pass rate when evidence exists but is bad", async () => {
    const { handler, notebookHandler } = await setup({
      mode: "enforce",
      thresholds: { minInstances: 2, minPassRate: 0.9, minDistinctAgents: 1 },
    });
    const notebookId = await notebookWithManifestCell(notebookHandler, "failing-peer");
    await seedFitness(notebookHandler, notebookId, { instances: 2, result: "fail" });

    await expect(handler.graduateNotebook({ notebookId })).rejects.toMatchObject({
      code: "graduation_below_threshold",
      message: expect.stringContaining("pass rate 0 below threshold 0.9"),
    });
  });

  it("advisory: below-threshold graduation proceeds and only the decision records it", async () => {
    const { handler, notebookHandler } = await setup({ mode: "advisory" });
    const notebookId = await notebookWithManifestCell(notebookHandler, "advisory-peer");

    const result = await handler.graduateNotebook({ notebookId });
    expect(result.manifest.status).toBe("draft");
    expect(result.gateDecision.mode).toBe("advisory");
    expect(result.gateDecision.pass).toBe(false);
  });

  it("THOUGHTBOX_GRADUATION_GATE=enforce flips enforcement without handler options", async () => {
    const previous = process.env[GRADUATION_GATE_ENV_VAR];
    process.env[GRADUATION_GATE_ENV_VAR] = "enforce";
    try {
      const { handler, notebookHandler } = await setup();
      const notebookId = await notebookWithManifestCell(notebookHandler, "env-enforced-peer");

      await expect(handler.graduateNotebook({ notebookId })).rejects.toMatchObject({
        code: "graduation_below_threshold",
      });
    } finally {
      if (previous === undefined) delete process.env[GRADUATION_GATE_ENV_VAR];
      else process.env[GRADUATION_GATE_ENV_VAR] = previous;
    }
  });

  it("enforce: a notebook source without runbook storage is missing evidence, not exempt", async () => {
    const { notebookHandler } = await setup();
    const notebookId = await notebookWithManifestCell(notebookHandler, "storageless-peer");
    const handler = new PeerNotebookHandler({
      repository: new InMemoryPeerNotebookRepository(),
      workspaceId: WORKSPACE_ID,
      // Narrow source: getNotebook only — no getRunbookStorage.
      notebookSource: {
        getNotebook: id => notebookHandler.getNotebook(id),
      },
      graduationGate: { mode: "enforce" },
    });

    await expect(handler.graduateNotebook({ notebookId })).rejects.toMatchObject({
      code: "graduation_below_threshold",
      message: expect.stringContaining("fitness ledger unavailable"),
    });
  });
});

async function setup(graduationGate?: PeerGraduationGateOptions) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tb-graduation-gate-"));
  tempDirs.push(tempDir);
  const notebookHandler = new NotebookHandler(tempDir);
  const repository = new InMemoryPeerNotebookRepository();
  const handler = new PeerNotebookHandler({
    repository,
    workspaceId: WORKSPACE_ID,
    notebookSource: notebookHandler,
    ...(graduationGate !== undefined ? { graduationGate } : {}),
  });
  return { handler, notebookHandler, repository };
}

async function notebookWithManifestCell(
  notebookHandler: NotebookHandler,
  peerId: string,
): Promise<string> {
  const created = await notebookHandler.handleCreateNotebook({
    title: "Gate candidate",
    language: "javascript",
  });
  const notebookId = created.notebook.id as string;
  await notebookHandler.handleAddCell({
    notebookId,
    cellType: "code",
    content: JSON.stringify(graduationPeerManifest(peerId, notebookId)),
    filename: "peer.manifest.json",
  });
  return notebookId;
}

/**
 * Seed ledger evidence for the notebook through its own runbook storage —
 * the same substrate graduation reads (templateId = notebook id).
 */
async function seedFitness(
  notebookHandler: NotebookHandler,
  notebookId: string,
  input: { instances: number; result: "pass" | "fail" },
): Promise<void> {
  const storage = notebookHandler.getRunbookStorage();
  const cells: RunbookTemplateCell[] = [
    { cellId: "cell-1", cellType: "code", filename: "main.mjs", source: "console.log(1);" },
  ];
  await storage.saveTemplate({
    templateId: notebookId,
    version: 1,
    cells,
    cellsHash: hashTemplateCells(cells),
    createdBy: "local",
    createdAt: new Date().toISOString(),
  });
  for (let i = 0; i < input.instances; i += 1) {
    const instanceId = `${notebookId}-inst-${i + 1}`;
    await storage.createInstance({
      instanceId,
      templateId: notebookId,
      templateVersion: 1,
      createdBy: "local",
      createdAt: new Date().toISOString(),
    });
    await storage.appendFitnessRows([
      {
        templateId: notebookId,
        templateVersion: 1,
        instanceId,
        cellId: "cell-1",
        tier: 1,
        result: input.result,
        pass: input.result === "pass",
        expected: 0,
        actual: input.result === "pass" ? 0 : 1,
        agentId: "local",
        ts: new Date().toISOString(),
      },
    ]);
  }
}
