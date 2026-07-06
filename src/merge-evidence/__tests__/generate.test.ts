/**
 * Merge Evidence Notebook generation (SPEC-MERGE-EVIDENCE) — against the real
 * notebook execution path (subprocess cells, contracts, ValidatorService) and
 * an InMemoryClaimStorage fixture with two branches carrying claims.
 *
 * Done-criteria coverage:
 * - two claim-carrying branches → persisted notebook, replaying cells,
 *   schema-valid verdict, verifiable stable hash;
 * - crossing contradiction / failing validator ⇒ blocking verdict;
 * - empty evidence ⇒ low-confidence prose-only verdict;
 * - claim-extractor peer seam populates claim extraction from prose.
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { NotebookHandler } from "../../notebook/index.js";
import { InMemoryClaimStorage } from "../../claims/in-memory-claim-storage.js";
import type { Claim } from "../../claims/types.js";
import {
  MergeVerdictSchema,
  branchRef,
  computeMergeEvidenceHash,
  crossingContradictions,
  diffBranchClaims,
  generateMergeEvidence,
  type MergeEvidenceDeps,
} from "../index.js";

const GENERATION_TIMEOUT_MS = 180_000;
const WORKSPACE_ID = "ws-merge-evidence-test";
const BRANCH_A = "branch-a";
const BRANCH_B = "branch-b";

let counter = 0;
function makeClaim(overrides: Partial<Claim> & { id: string }): Claim {
  const now = new Date().toISOString();
  counter += 1;
  return {
    workspaceId: WORKSPACE_ID,
    type: "decision",
    statement: `claim statement ${counter}`,
    status: "asserted",
    evidenceRefs: [],
    createdBy: "agent-test",
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
    ...overrides,
  };
}

async function seedTwoBranchFixture(options?: {
  contradiction?: boolean;
}): Promise<InMemoryClaimStorage> {
  const storage = new InMemoryClaimStorage();
  await storage.saveClaim(
    makeClaim({
      id: "claim-a1",
      statement: "The cache layer tolerates 30s staleness",
      evidenceRefs: [branchRef(BRANCH_A)],
    }),
  );
  await storage.saveClaim(
    makeClaim({
      id: "claim-a2",
      statement: "Reads must go through the cache",
      status: "supported",
      evidenceRefs: [branchRef(BRANCH_A), "thought:sess-1/4"],
    }),
  );
  await storage.saveClaim(
    makeClaim({
      id: "claim-b1",
      statement: "Reads must bypass the cache for consistency",
      evidenceRefs: [branchRef(BRANCH_B)],
    }),
  );
  if (options?.contradiction) {
    await storage.addEdge({
      fromClaim: "claim-a2",
      toClaim: "claim-b1",
      kind: "contradicts",
      createdBy: "agent-test",
      createdAt: new Date().toISOString(),
    });
  }
  return storage;
}

function mergeRecord(overrides?: Record<string, unknown>) {
  return {
    id: `merge-${Math.random().toString(36).slice(2, 10)}`,
    workspace_id: WORKSPACE_ID,
    parent_branch_ids: [BRANCH_A, BRANCH_B],
    base_ref: "thought:sess-1/3",
    requested_by: "agent-test",
    ...overrides,
  };
}

function makeHandler(): NotebookHandler {
  return new NotebookHandler(
    path.join(os.tmpdir(), `tb-merge-evidence-${Math.random().toString(36).slice(2, 10)}`),
  );
}

// =============================================================================
// Pure claim-diff unit coverage
// =============================================================================

describe("diffBranchClaims", () => {
  const claimsA = [
    makeClaim({ id: "c1", evidenceRefs: [branchRef(BRANCH_A)] }),
    makeClaim({ id: "shared", evidenceRefs: [branchRef(BRANCH_A), branchRef(BRANCH_B)] }),
    makeClaim({
      id: "old",
      status: "superseded",
      supersededBy: "c2",
      evidenceRefs: [branchRef(BRANCH_A)],
    }),
  ];
  const claimsB = [
    makeClaim({ id: "c2", evidenceRefs: [branchRef(BRANCH_B)] }),
    makeClaim({ id: "shared", evidenceRefs: [branchRef(BRANCH_A), branchRef(BRANCH_B)] }),
  ];
  const edges = [
    {
      fromClaim: "c1",
      toClaim: "c2",
      kind: "contradicts" as const,
      createdBy: "agent-test",
      createdAt: new Date().toISOString(),
    },
  ];

  it("computes added, removed, shared, superseded, and contradicting", () => {
    const diff = diffBranchClaims({
      branchA: BRANCH_A,
      claimsA,
      branchB: BRANCH_B,
      claimsB,
      contradictsEdges: edges,
    });
    expect(diff.added).toEqual(["c2"]);
    expect(diff.removed).toEqual(["c1", "old"]);
    expect(diff.shared).toEqual(["shared"]);
    expect(diff.superseded).toEqual([{ claimId: "old", supersededBy: "c2" }]);
    expect(diff.contradicting).toEqual([
      { fromClaim: "c1", toClaim: "c2", fromBranch: BRANCH_A, toBranch: BRANCH_B },
    ]);
  });

  it("ignores contradicts edges inside a single branch", () => {
    const pairs = crossingContradictions(
      { [BRANCH_A]: new Set(["c1", "c2"]), [BRANCH_B]: new Set(["c3"]) },
      edges,
    );
    expect(pairs).toEqual([]);
  });
});

// =============================================================================
// End-to-end generation (real subprocess execution)
// =============================================================================

describe("generateMergeEvidence", () => {
  it(
    "produces a persisted, replayable notebook with a schema-valid verdict and a verifiable hash",
    { timeout: GENERATION_TIMEOUT_MS },
    async () => {
      const handler = makeHandler();
      await handler.init();
      const claims = await seedTwoBranchFixture();
      const deps: MergeEvidenceDeps = { notebooks: handler, claims };

      const record = mergeRecord();
      const result = await generateMergeEvidence(record, deps);

      // Frozen return contract.
      expect(result.notebookId).toBeTruthy();
      expect(result.hash).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(MergeVerdictSchema.parse(result.verdict)).toEqual(result.verdict);

      // Claims from both branches were extracted; no contradiction → merge.
      expect(result.verdict.decision).toBe("merge");
      expect(result.verdict.confidence).toBe("medium");
      expect(result.verdict.mergedBranchIds).toEqual([BRANCH_A, BRANCH_B]);
      expect(result.verdict.rejectedBranchIds).toEqual([]);
      expect(result.details.branchClaims).toEqual([
        expect.objectContaining({ branchId: BRANCH_A, source: "claim-graph" }),
        expect.objectContaining({ branchId: BRANCH_B, source: "claim-graph" }),
      ]);
      expect(result.details.runPass).toBe(true);
      expect(result.verdict.reopenTriggers.length).toBeGreaterThan(0);

      // Persisted: the artifact holds the exported notebook.
      expect(result.details.artifactId).toBeTruthy();
      const artifact = await handler.handleGetArtifact({
        artifactId: result.details.artifactId,
      });
      expect(artifact.content).toContain("Merge Evidence");
      expect(artifact.content).toContain("contradiction-scan.js");

      // Cells replay: re-run every evidence cell through the public surface.
      for (const cellId of result.details.evidenceCellIds) {
        const replay = await handler.handleRunCell({
          notebookId: result.notebookId,
          cellId,
        });
        expect(replay.success).toBe(true);
      }

      // The verdict cell emitted the verdict JSON (replayable).
      expect(result.details.verdictCellId).toBeTruthy();
      const verdictReplay = await handler.handleRunCell({
        notebookId: result.notebookId,
        cellId: result.details.verdictCellId,
      });
      expect(verdictReplay.success).toBe(true);

      // Hash is verifiable: recompute over the persisted state + verdict.
      const exported = await handler.handleExportNotebook({
        notebookId: result.notebookId,
      });
      const notebook = handler.getNotebook(result.notebookId)!;
      const contractHashes = notebook.cells.flatMap((cell) =>
        cell.type === "code" && cell.contract !== undefined
          ? [{ cellId: cell.id, contractHash: cell.contract.contractHash }]
          : [],
      );
      const runSummary = {
        pass: result.details.runPass,
        reason: result.details.runReason,
        contractCoverage: result.details.runContractCoverage,
      };
      const recomputed = computeMergeEvidenceHash({
        schemaVersion: "merge-evidence-snapshot.v1",
        mergeId: record.id,
        srcmd: exported.content,
        contractHashes,
        verdict: result.verdict,
        run: runSummary,
      });
      expect(recomputed).toBe(result.hash);

      // Tampering with any cell changes the hash.
      const tampered = computeMergeEvidenceHash({
        schemaVersion: "merge-evidence-snapshot.v1",
        mergeId: record.id,
        srcmd: exported.content.replace("crossingCount", "crossingCounts"),
        contractHashes,
        verdict: result.verdict,
        run: runSummary,
      });
      expect(tampered).not.toBe(result.hash);
    },
  );

  it(
    "blocks the merge when contradicts edges cross the branches' claim sets",
    { timeout: GENERATION_TIMEOUT_MS },
    async () => {
      const handler = makeHandler();
      await handler.init();
      const claims = await seedTwoBranchFixture({ contradiction: true });

      const result = await generateMergeEvidence(mergeRecord(), {
        notebooks: handler,
        claims,
      });

      expect(MergeVerdictSchema.parse(result.verdict)).toEqual(result.verdict);
      expect(result.verdict.decision).toBe("block");
      expect(result.verdict.confidence).toBe("high");
      expect(result.verdict.mergedBranchIds).toEqual([]);
      expect(result.verdict.rejectedBranchIds).toEqual([BRANCH_A, BRANCH_B]);
      expect(result.details.runPass).toBe(false);
      expect(result.details.crossingContradictionCount).toBe(1);
      expect(result.verdict.dissent).toEqual([
        expect.objectContaining({ branchId: BRANCH_A }),
        expect.objectContaining({ branchId: BRANCH_B }),
      ]);
      expect(
        result.verdict.conditions.some((condition) => condition.startsWith("blocked:")),
      ).toBe(true);
      // The evidence notebook is still produced, persisted, and hashed.
      expect(result.notebookId).toBeTruthy();
      expect(result.hash).toMatch(/^sha256:/);
      expect(result.details.artifactId).toBeTruthy();
    },
  );

  it(
    "blocks the merge when a branch-attached validator fails",
    { timeout: GENERATION_TIMEOUT_MS },
    async () => {
      const handler = makeHandler();
      await handler.init();
      const claims = await seedTwoBranchFixture();

      // Real validator cell in a separate notebook, bound to branch-b.
      const validatorNotebook = await handler.handleCreateNotebook({
        title: "branch-b runbook",
        language: "javascript",
      });
      const validatorCell = await handler.handleAddCell({
        notebookId: validatorNotebook.notebook.id,
        cellType: "code",
        filename: "branch-outcome.js",
        content: [
          'import { observed, fail } from "./tb-validate.js";',
          "const data = observed();",
          'fail("branch outcome contract violated", { branchId: data.branchId });',
        ].join("\n"),
      });

      const result = await generateMergeEvidence(mergeRecord(), {
        notebooks: handler,
        claims,
        branchValidators: async (_workspaceId, branchId) =>
          branchId === BRANCH_B
            ? [
                {
                  notebookId: validatorNotebook.notebook.id,
                  cellId: validatorCell.cell.id,
                },
              ]
            : [],
      });

      expect(result.verdict.decision).toBe("block");
      expect(result.details.runPass).toBe(false);
      expect(result.details.validatorOutcomes).toEqual([
        expect.objectContaining({ branchId: BRANCH_B, pass: false }),
      ]);
      expect(result.verdict.dissent).toEqual([
        expect.objectContaining({ branchId: BRANCH_B }),
      ]);
    },
  );

  it(
    "raises confidence to high when branch-attached validators pass",
    { timeout: GENERATION_TIMEOUT_MS },
    async () => {
      const handler = makeHandler();
      await handler.init();
      const claims = await seedTwoBranchFixture();

      const validatorNotebook = await handler.handleCreateNotebook({
        title: "branch-a runbook",
        language: "javascript",
      });
      const validatorCell = await handler.handleAddCell({
        notebookId: validatorNotebook.notebook.id,
        cellType: "code",
        filename: "branch-outcome.js",
        content: [
          'import { observed, pass, fail } from "./tb-validate.js";',
          "const data = observed();",
          "Array.isArray(data.claims) && data.claims.length > 0",
          '  ? pass("branch carries claims", { claimCount: data.claims.length })',
          '  : fail("branch carries no claims", data);',
        ].join("\n"),
      });

      const result = await generateMergeEvidence(mergeRecord(), {
        notebooks: handler,
        claims,
        branchValidators: async (_workspaceId, branchId) =>
          branchId === BRANCH_A
            ? [
                {
                  notebookId: validatorNotebook.notebook.id,
                  cellId: validatorCell.cell.id,
                },
              ]
            : [],
      });

      expect(result.verdict.decision).toBe("merge");
      expect(result.verdict.confidence).toBe("high");
      expect(result.details.validatorOutcomes).toEqual([
        expect.objectContaining({ branchId: BRANCH_A, pass: true, hashMatched: true }),
      ]);
    },
  );

  it(
    "produces a low-confidence prose-only verdict when no evidence exists",
    { timeout: GENERATION_TIMEOUT_MS },
    async () => {
      const handler = makeHandler();
      await handler.init();
      const claims = new InMemoryClaimStorage(); // empty: no claims anywhere

      const result = await generateMergeEvidence(mergeRecord(), {
        notebooks: handler,
        claims,
      });

      expect(MergeVerdictSchema.parse(result.verdict)).toEqual(result.verdict);
      expect(result.verdict.decision).toBe("merge");
      expect(result.verdict.confidence).toBe("low");
      expect(result.details.evidenceCellIds).toEqual([]);
      expect(
        result.verdict.conditions.some((condition) =>
          condition.includes("prose-only merge"),
        ),
      ).toBe(true);
      // The notebook still exists, is persisted, and carries the verdict.
      expect(result.details.artifactId).toBeTruthy();
      expect(result.hash).toMatch(/^sha256:/);
    },
  );

  it(
    "uses the claim-extractor seam for branches carrying only prose",
    { timeout: GENERATION_TIMEOUT_MS },
    async () => {
      const handler = makeHandler();
      await handler.init();
      const claims = new InMemoryClaimStorage();

      // Deterministic sentence-split contract of the claim-extractor peer
      // (src/peer-notebook/peers/claim-extractor.ts).
      const extractClaims = async (text: string) =>
        text
          .split(/[.!?\n]+/)
          .map((claim) => claim.trim())
          .filter(Boolean)
          .map((claim, index) => ({ id: `claim_${index + 1}`, text: claim }));

      const result = await generateMergeEvidence(mergeRecord(), {
        notebooks: handler,
        claims,
        extractClaims,
        branchProse: async (_workspaceId, branchId) =>
          branchId === BRANCH_A
            ? "The scheduler is idempotent. Retries are safe."
            : undefined,
      });

      expect(result.verdict.decision).toBe("merge");
      expect(result.verdict.confidence).toBe("medium");
      expect(result.details.branchClaims).toEqual([
        expect.objectContaining({
          branchId: BRANCH_A,
          source: "claim-extractor",
          claims: [
            expect.objectContaining({
              id: `extracted:${BRANCH_A}:claim_1`,
              statement: "The scheduler is idempotent",
            }),
            expect.objectContaining({
              id: `extracted:${BRANCH_A}:claim_2`,
              statement: "Retries are safe",
            }),
          ],
        }),
        expect.objectContaining({ branchId: BRANCH_B, source: "none" }),
      ]);
    },
  );

  it("rejects a malformed merge record without touching the notebook layer", async () => {
    const handler = makeHandler();
    const claims = new InMemoryClaimStorage();
    await expect(
      generateMergeEvidence(
        { id: "", workspace_id: WORKSPACE_ID, parent_branch_ids: [] },
        { notebooks: handler, claims },
      ),
    ).rejects.toThrow(/merge record failed validation/);
  });
});
