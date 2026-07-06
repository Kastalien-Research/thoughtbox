/**
 * generateMergeEvidence — auto-generates the Merge Evidence Notebook for a
 * merge request (frozen contract: `generateMergeEvidence(record) →
 * {notebookId, verdict, hash}`; merge-core's state machine calls this during
 * `pending_evidence`).
 *
 * Pipeline (blueprint: .specs/product-shape/branches/001-merge-evidence-notebooks.md):
 *   (a) input capture   — branch heads, base ref, requester (contracted cell)
 *   (b) claim extraction — per-branch claim sets from the claim graph, or the
 *       claim-extractor peer seam for branches carrying only prose
 *   (d) validator invocation — validator cells attached to the branches, run
 *       through the real ValidatorService (snapshot-hash verified)
 *   (c) contradiction scan — typed `contradicts` edges crossing the branches'
 *       claim sets; contract expects zero crossings
 *   (e) verdict cell     — frozen-schema verdict JSON, derived from the REAL
 *       run results (notebook_start_run in merge_evidence mode)
 *
 * Cell order is (a)(b)(d)(c): the B5 gate halts a run at the first failing
 * cell, so validator evidence is collected before the contradiction gate.
 *
 * Verdict rules (owner-approved design contract):
 * - any FAILING executable evidence cell ⇒ decision "block"
 * - no passing executable EVIDENCE cells (input capture does not count) ⇒
 *   confidence FORCED to "low" (prose-only merge)
 * - evidence hash = canonical hash of the persisted snapshot (hash.ts)
 */

import type { Claim } from "../claims/types.js";
import {
  claimsForBranch as defaultClaimsForBranch,
  crossingContradictions,
  diffBranchClaims,
  type BranchClaimDiff,
  type ContradictingPair,
} from "./claim-diff.js";
import { computeMergeEvidenceHash, type MergeEvidenceRunSummary } from "./hash.js";
import {
  MERGE_DECISION,
  MergeEvidenceRecordSchema,
  MergeVerdictSchema,
  type BranchClaimCapture,
  type BranchValidatorOutcome,
  type MergeEvidenceDeps,
  type MergeEvidenceRecordInput,
  type MergeEvidenceResult,
  type MergeVerdict,
} from "./types.js";

const MERGE_EVIDENCE_TEMPLATE = "merge-evidence";
const MAX_REOPEN_TRIGGERS = 20;

interface OutcomeContractInput {
  schemaVersion: "outcome-contract.v0";
  expectations: Array<{
    source: { kind: "output"; pointer: string };
    op: "eq" | "schema";
    value: unknown;
    description?: string;
  }>;
}

export class MergeEvidenceGenerationError extends Error {
  override readonly name = "MergeEvidenceGenerationError";
}

export function createMergeEvidenceGenerator(deps: MergeEvidenceDeps) {
  return {
    generateMergeEvidence: (record: unknown): Promise<MergeEvidenceResult> =>
      generateMergeEvidence(record, deps),
  };
}

export async function generateMergeEvidence(
  record: unknown,
  deps: MergeEvidenceDeps,
): Promise<MergeEvidenceResult> {
  const parsed = MergeEvidenceRecordSchema.safeParse(record);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new MergeEvidenceGenerationError(
      `merge record failed validation: ${issues}`,
    );
  }
  const merge = parsed.data;

  // -------------------------------------------------------------------------
  // Evidence gathering (generation time — baked into replayable cells below)
  // -------------------------------------------------------------------------
  const branchClaims = await gatherBranchClaims(merge, deps);
  const storedClaimsByBranch = new Map<string, Claim[]>(
    branchClaims.stored.map(({ branchId, claims }) => [branchId, claims]),
  );

  const contradictsEdges = (await deps.claims.listEdges({ kind: "contradicts" })).filter(
    (edge) => edge.kind === "contradicts",
  );
  const claimIdsByBranch: Record<string, ReadonlySet<string>> = {};
  for (const [branchId, claims] of storedClaimsByBranch) {
    claimIdsByBranch[branchId] = new Set(claims.map((claim) => claim.id));
  }
  const crossings = crossingContradictions(claimIdsByBranch, contradictsEdges);

  const diffs: BranchClaimDiff[] = [];
  const branchIds = merge.parent_branch_ids;
  for (let i = 0; i < branchIds.length; i += 1) {
    for (let j = i + 1; j < branchIds.length; j += 1) {
      diffs.push(
        diffBranchClaims({
          branchA: branchIds[i]!,
          claimsA: storedClaimsByBranch.get(branchIds[i]!) ?? [],
          branchB: branchIds[j]!,
          claimsB: storedClaimsByBranch.get(branchIds[j]!) ?? [],
          contradictsEdges,
        }),
      );
    }
  }

  const validatorOutcomes = await invokeBranchValidators(merge, deps, {
    storedClaimsByBranch,
    crossingCount: crossings.length,
  });

  // -------------------------------------------------------------------------
  // Notebook assembly from the system template
  // -------------------------------------------------------------------------
  const created = await deps.notebooks.handleCreateNotebook({
    title: `Merge Evidence — ${merge.id}`,
    language: "javascript",
    template: MERGE_EVIDENCE_TEMPLATE,
  });
  const notebookId: string = created.notebook.id;

  const evidenceCellIds: string[] = [];
  const totalClaims = branchClaims.captures.reduce(
    (count, capture) => count + capture.claims.length,
    0,
  );
  const hasClaimEvidence = totalClaims > 0;
  const hasValidatorEvidence = validatorOutcomes.length > 0;

  // (a) input capture — always present, pins the merge request. It is
  // deliberately NOT counted as an evidence cell (it cannot raise confidence
  // above the prose-only floor).
  await addEmittingCell(deps, notebookId, {
    filename: "input-capture.js",
    heading: "### (a) Input capture",
    prose:
      "Merge request inputs pinned at generation time: parent branch heads, " +
      "base ref, and requester. The contract asserts the emitted inputs match " +
      "this merge record.",
    data: {
      mergeId: merge.id,
      workspaceId: merge.workspace_id,
      parentBranchIds: merge.parent_branch_ids,
      baseRef: merge.base_ref ?? null,
      requestedBy: merge.requested_by,
    },
    log: "input capture: merge ${data.mergeId} (${data.parentBranchIds.length} branch(es))",
    contract: {
      schemaVersion: "outcome-contract.v0",
      expectations: [
        {
          source: { kind: "output", pointer: "/mergeId" },
          op: "eq",
          value: merge.id,
          description: "captured inputs pin this merge record",
        },
        {
          source: { kind: "output", pointer: "/parentBranchIds" },
          op: "eq",
          value: merge.parent_branch_ids,
          description: "captured branch heads match the merge request",
        },
      ],
    },
  });

  // (b) claim extraction per branch — executable only when claims exist.
  if (hasClaimEvidence) {
    const cellId = await addEmittingCell(deps, notebookId, {
      filename: "claim-extraction.js",
      heading: "### (b) Claim extraction per branch",
      prose:
        "Per-branch claim sets read from the claim graph (source " +
        "`claim-graph`) or extracted from branch prose by the claim-extractor " +
        "peer (source `claim-extractor`). Pairwise diffs " +
        "(added/removed/shared/superseded) are included for audit.",
      data: { branches: branchClaims.captures, diffs, totalClaims },
      log: "claim extraction: ${data.totalClaims} claim(s) across ${data.branches.length} branch(es)",
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [
          {
            source: { kind: "output", pointer: "/totalClaims" },
            op: "eq",
            value: totalClaims,
            description: "claim count matches the generation-time extraction",
          },
          {
            source: { kind: "output", pointer: "" },
            op: "schema",
            value: {
              type: "object",
              required: ["branches", "diffs", "totalClaims"],
            },
            description: "claim extraction output is structurally complete",
          },
        ],
      },
    });
    evidenceCellIds.push(cellId);
  } else {
    await addMarkdownCell(
      deps,
      notebookId,
      "### (b) Claim extraction per branch\n\n" +
        "**No claims found for any parent branch** (claim graph empty for " +
        "these branches and no prose extraction available). This merge is " +
        "prose-only: the verdict below is produced with confidence forced to " +
        "`low` per the merge-evidence design contract.",
    );
  }

  // (d) validator invocation — before the contradiction gate so validator
  // evidence is collected even when contradictions will block the merge.
  if (hasValidatorEvidence) {
    const allPassed = validatorOutcomes.every(
      (outcome) => outcome.pass && outcome.hashMatched,
    );
    const cellId = await addEmittingCell(deps, notebookId, {
      filename: "validator-invocation.js",
      heading: "### (d) Validator invocation",
      prose:
        "Validator cells attached to the parent branches, invoked at " +
        "generation time through the real ValidatorService (snapshot-hash " +
        "verified) with each branch's claim set as observed data. The " +
        "contract requires every validator to pass; a failing validator " +
        "blocks the merge.",
      data: { results: validatorOutcomes, allPassed },
      log: "validator invocation: ${data.results.length} validator(s), allPassed=${data.allPassed}",
      contract: {
        schemaVersion: "outcome-contract.v0",
        expectations: [
          {
            source: { kind: "output", pointer: "/allPassed" },
            op: "eq",
            value: true,
            description: "every branch-attached validator passed",
          },
        ],
      },
    });
    evidenceCellIds.push(cellId);
  } else {
    await addMarkdownCell(
      deps,
      notebookId,
      "### (d) Validator invocation\n\n" +
        "No validator cells are attached to the parent branches; no outcome " +
        "contracts were invoked.",
    );
  }

  // (c) contradiction scan — the gate: crossing contradicts edges fail the
  // cell's contract, which fails the run, which blocks the merge.
  if (hasClaimEvidence) {
    const cellId = await addContradictionScanCell(deps, notebookId, {
      claimIdsByBranch: Object.fromEntries(
        Object.entries(claimIdsByBranch).map(([branchId, ids]) => [branchId, [...ids]]),
      ),
      contradictsEdges: contradictsEdges.map((edge) => ({
        fromClaim: edge.fromClaim,
        toClaim: edge.toClaim,
      })),
    });
    evidenceCellIds.push(cellId);
  } else {
    await addMarkdownCell(
      deps,
      notebookId,
      "### (c) Contradiction scan\n\nSkipped: no claims to scan.",
    );
  }

  // -------------------------------------------------------------------------
  // Evidence run (merge_evidence mode) + verdict derivation
  // -------------------------------------------------------------------------
  const run = await runEvidenceNotebook(deps, notebookId);

  const verdict = deriveVerdict({
    merge,
    notebookId,
    run,
    hasClaimEvidence,
    hasValidatorEvidence,
    validatorOutcomes,
    crossings,
    diffs,
    storedClaimsByBranch,
    evidenceCellIds,
  });
  MergeVerdictSchema.parse(verdict);

  // (e) verdict cell — appended after the run, executed so the notebook
  // replays end-to-end and the verdict JSON is emitted by a real cell.
  const verdictCellId = await addEmittingCell(deps, notebookId, {
    filename: "verdict.js",
    heading: "### (e) Merge verdict",
    prose:
      "Frozen-schema merge verdict derived from the evidence run above " +
      `(run ${run.runId ?? "failed"}: ${run.summary ? (run.summary.pass ? "pass" : "fail") : "did not complete"}).`,
    data: verdict,
    log: 'verdict: ${data.decision} (confidence ${data.confidence})',
  });
  const verdictExecution = await deps.notebooks.handleRunCell({
    notebookId,
    cellId: verdictCellId,
  });
  if (verdictExecution.success !== true) {
    throw new MergeEvidenceGenerationError(
      `verdict cell failed to execute: ${verdictExecution.execution?.stderr ?? "unknown"}`,
    );
  }

  // -------------------------------------------------------------------------
  // Persist + hash
  // -------------------------------------------------------------------------
  const exported = await deps.notebooks.handleExportNotebook({ notebookId });
  const notebook = deps.notebooks.getNotebook(notebookId);
  if (!notebook) {
    throw new MergeEvidenceGenerationError(`notebook ${notebookId} disappeared`);
  }
  const contractHashes = notebook.cells.flatMap((cell) =>
    cell.type === "code" && cell.contract !== undefined
      ? [{ cellId: cell.id, contractHash: cell.contract.contractHash }]
      : [],
  );
  const hash = computeMergeEvidenceHash({
    schemaVersion: "merge-evidence-snapshot.v1",
    mergeId: merge.id,
    srcmd: exported.content,
    contractHashes,
    verdict,
    run: run.summary,
  });

  const persisted = await deps.notebooks.handlePersist({ notebookId });

  return {
    notebookId,
    verdict,
    hash,
    details: {
      ...(run.runId !== undefined ? { runId: run.runId } : {}),
      runPass: run.summary?.pass ?? false,
      runReason: run.summary?.reason ?? run.error ?? "evidence run did not complete",
      runContractCoverage: run.summary?.contractCoverage ?? 0,
      ...(persisted?.artifact?.artifactId !== undefined
        ? { artifactId: persisted.artifact.artifactId }
        : {}),
      evidenceCellIds,
      verdictCellId,
      branchClaims: branchClaims.captures,
      validatorOutcomes,
      crossingContradictionCount: crossings.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Evidence gathering helpers
// ---------------------------------------------------------------------------

async function gatherBranchClaims(
  merge: MergeEvidenceRecordInput,
  deps: MergeEvidenceDeps,
): Promise<{
  captures: BranchClaimCapture[];
  stored: Array<{ branchId: string; claims: Claim[] }>;
}> {
  const captures: BranchClaimCapture[] = [];
  const stored: Array<{ branchId: string; claims: Claim[] }> = [];

  for (const branchId of merge.parent_branch_ids) {
    const claims = deps.claimsForBranch
      ? await deps.claimsForBranch(merge.workspace_id, branchId)
      : await defaultClaimsForBranch(deps.claims, merge.workspace_id, branchId);
    stored.push({ branchId, claims });

    if (claims.length > 0) {
      captures.push({
        branchId,
        source: "claim-graph",
        claims: claims.map((claim) => ({
          id: claim.id,
          type: claim.type,
          statement: claim.statement,
          status: claim.status,
          ...(claim.supersededBy !== undefined
            ? { supersededBy: claim.supersededBy }
            : {}),
        })),
      });
      continue;
    }

    // Claim-extractor peer seam: prose-carrying branches without graph claims.
    if (deps.extractClaims && deps.branchProse) {
      const prose = await deps.branchProse(merge.workspace_id, branchId);
      if (prose !== undefined && prose.trim().length > 0) {
        const extracted = await deps.extractClaims(prose);
        if (extracted.length > 0) {
          captures.push({
            branchId,
            source: "claim-extractor",
            claims: extracted.map((claim) => ({
              id: `extracted:${branchId}:${claim.id}`,
              type: "observation",
              statement: claim.text,
              status: "asserted",
            })),
          });
          continue;
        }
      }
    }

    captures.push({ branchId, source: "none", claims: [] });
  }

  return { captures, stored };
}

async function invokeBranchValidators(
  merge: MergeEvidenceRecordInput,
  deps: MergeEvidenceDeps,
  context: { storedClaimsByBranch: Map<string, Claim[]>; crossingCount: number },
): Promise<BranchValidatorOutcome[]> {
  if (!deps.branchValidators) return [];
  const validatorService = deps.notebooks.getValidatorService();
  const outcomes: BranchValidatorOutcome[] = [];

  for (const branchId of merge.parent_branch_ids) {
    const refs = await deps.branchValidators(merge.workspace_id, branchId);
    for (const ref of refs) {
      const observed = {
        mergeId: merge.id,
        workspaceId: merge.workspace_id,
        branchId,
        claims: (context.storedClaimsByBranch.get(branchId) ?? []).map((claim) => ({
          id: claim.id,
          type: claim.type,
          statement: claim.statement,
          status: claim.status,
        })),
        crossingContradictionCount: context.crossingCount,
      };
      try {
        const binding = await validatorService.bind(ref.notebookId, ref.cellId);
        const result = await validatorService.run(
          binding,
          observed,
          ref.expectedSnapshotHash !== undefined
            ? { expectedSnapshotHash: ref.expectedSnapshotHash }
            : {},
        );
        outcomes.push({
          branchId,
          notebookId: ref.notebookId,
          cellId: ref.cellId,
          snapshotHash: result.snapshotHash,
          hashMatched: result.hashMatched,
          pass: result.pass,
          reason: result.reason,
        });
      } catch (error) {
        outcomes.push({
          branchId,
          notebookId: ref.notebookId,
          cellId: ref.cellId,
          snapshotHash: "",
          hashMatched: false,
          pass: false,
          reason: `validator invocation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }
  }
  return outcomes;
}

// ---------------------------------------------------------------------------
// Cell assembly helpers (all cells go through the public NotebookHandler)
// ---------------------------------------------------------------------------

async function addMarkdownCell(
  deps: MergeEvidenceDeps,
  notebookId: string,
  content: string,
): Promise<string> {
  const result = await deps.notebooks.handleAddCell({
    notebookId,
    cellType: "markdown",
    content,
  });
  return result.cell.id;
}

/**
 * Add a markdown heading plus a replayable code cell that emits `data` as
 * structured output (TB_OUTPUT_PATH) — the only channel outcome contracts
 * read. The data is baked into the source so replays are deterministic.
 */
async function addEmittingCell(
  deps: MergeEvidenceDeps,
  notebookId: string,
  cell: {
    filename: string;
    heading: string;
    prose: string;
    data: unknown;
    /** Template literal body over `data` for the human-readable log line. */
    log: string;
    contract?: OutcomeContractInput;
  },
): Promise<string> {
  await addMarkdownCell(deps, notebookId, `${cell.heading}\n\n${cell.prose}`);
  const source = [
    "// Auto-generated by generateMergeEvidence — do not hand-edit.",
    'import { writeFileSync } from "node:fs";',
    "",
    `const data = ${JSON.stringify(cell.data, null, 2)};`,
    "",
    "if (process.env.TB_OUTPUT_PATH) {",
    "  writeFileSync(process.env.TB_OUTPUT_PATH, JSON.stringify(data, null, 2));",
    "}",
    `console.log(\`${cell.log}\`);`,
    "",
  ].join("\n");
  const result = await deps.notebooks.handleAddCell({
    notebookId,
    cellType: "code",
    filename: cell.filename,
    content: source,
    ...(cell.contract !== undefined ? { contract: cell.contract } : {}),
  });
  return result.cell.id;
}

/**
 * The contradiction scan RECOMPUTES crossings from the baked claim-id sets
 * and edge list on every replay (it is not a pre-computed constant), and its
 * contract expects zero crossings — contradictions between the branches'
 * claim sets fail the cell, fail the run, and block the merge.
 */
async function addContradictionScanCell(
  deps: MergeEvidenceDeps,
  notebookId: string,
  data: {
    claimIdsByBranch: Record<string, string[]>;
    contradictsEdges: Array<{ fromClaim: string; toClaim: string }>;
  },
): Promise<string> {
  await addMarkdownCell(
    deps,
    notebookId,
    "### (c) Contradiction scan\n\n" +
      "Typed `contradicts` edges in the claim graph with endpoints in two " +
      "different branches' claim sets. The crossing computation replays from " +
      "the baked inputs; the contract requires zero crossings — any crossing " +
      "contradiction blocks the merge.",
  );
  const source = [
    "// Auto-generated by generateMergeEvidence — do not hand-edit.",
    'import { writeFileSync } from "node:fs";',
    "",
    `const claimIdsByBranch = ${JSON.stringify(data.claimIdsByBranch, null, 2)};`,
    `const contradictsEdges = ${JSON.stringify(data.contradictsEdges, null, 2)};`,
    "",
    "const branches = Object.entries(claimIdsByBranch);",
    "const seen = new Set();",
    "const crossingPairs = [];",
    "for (const edge of contradictsEdges) {",
    "  for (const [fromBranch, fromIds] of branches) {",
    "    if (!fromIds.includes(edge.fromClaim)) continue;",
    "    for (const [toBranch, toIds] of branches) {",
    "      if (toBranch === fromBranch) continue;",
    "      if (!toIds.includes(edge.toClaim)) continue;",
    "      const key = `${edge.fromClaim} ${edge.toClaim} ${fromBranch} ${toBranch}`;",
    "      if (seen.has(key)) continue;",
    "      seen.add(key);",
    "      crossingPairs.push({ fromClaim: edge.fromClaim, toClaim: edge.toClaim, fromBranch, toBranch });",
    "    }",
    "  }",
    "}",
    "",
    "const output = { crossingPairs, crossingCount: crossingPairs.length };",
    "if (process.env.TB_OUTPUT_PATH) {",
    "  writeFileSync(process.env.TB_OUTPUT_PATH, JSON.stringify(output, null, 2));",
    "}",
    "console.log(`contradiction scan: ${output.crossingCount} crossing(s)`);",
    "",
  ].join("\n");
  const result = await deps.notebooks.handleAddCell({
    notebookId,
    cellType: "code",
    filename: "contradiction-scan.js",
    content: source,
    contract: {
      schemaVersion: "outcome-contract.v0",
      expectations: [
        {
          source: { kind: "output", pointer: "/crossingCount" },
          op: "eq",
          value: 0,
          description:
            "no contradicts edges cross the parent branches' claim sets",
        },
      ],
    },
  });
  return result.cell.id;
}

// ---------------------------------------------------------------------------
// Run + verdict derivation
// ---------------------------------------------------------------------------

interface EvidenceRunOutcome {
  runId?: string;
  summary: MergeEvidenceRunSummary | null;
  error?: string;
}

async function runEvidenceNotebook(
  deps: MergeEvidenceDeps,
  notebookId: string,
): Promise<EvidenceRunOutcome> {
  try {
    const result = await deps.notebooks.handleStartRun({
      notebookId,
      mode: "merge_evidence",
    });
    const run = result.run;
    const output = Array.isArray(run?.outputs) ? run.outputs[0] : undefined;
    if (
      output === undefined ||
      typeof output.pass !== "boolean" ||
      typeof output.reason !== "string"
    ) {
      return {
        runId: run?.runId,
        summary: null,
        error: "evidence run completed without a derivable verdict output",
      };
    }
    return {
      runId: run.runId,
      summary: {
        pass: output.pass,
        reason: output.reason,
        contractCoverage:
          typeof output.contractCoverage === "number" ? output.contractCoverage : 0,
      },
    };
  } catch (error) {
    return {
      summary: null,
      error: `evidence run failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function deriveVerdict(input: {
  merge: MergeEvidenceRecordInput;
  notebookId: string;
  run: EvidenceRunOutcome;
  hasClaimEvidence: boolean;
  hasValidatorEvidence: boolean;
  validatorOutcomes: BranchValidatorOutcome[];
  crossings: ContradictingPair[];
  diffs: BranchClaimDiff[];
  storedClaimsByBranch: Map<string, Claim[]>;
  evidenceCellIds: string[];
}): MergeVerdict {
  const {
    merge,
    notebookId,
    run,
    hasClaimEvidence,
    hasValidatorEvidence,
    validatorOutcomes,
    crossings,
    diffs,
    storedClaimsByBranch,
    evidenceCellIds,
  } = input;

  const evidenceRefs = [
    `notebook:${notebookId}`,
    ...evidenceCellIds.map((cellId) => `cell:${notebookId}/${cellId}`),
    ...(run.runId !== undefined ? [`run:${run.runId}`] : []),
  ];

  const supersededNodeIds = [
    ...new Set(diffs.flatMap((diff) => diff.superseded.map((entry) => entry.claimId))),
  ];

  const hasEvidenceCells = evidenceCellIds.length > 0;
  const blocked = run.summary === null || run.summary.pass === false;

  if (blocked) {
    const reason =
      run.summary?.reason ?? run.error ?? "evidence run did not complete";
    const dissent: MergeVerdict["dissent"] = [];
    for (const branchId of merge.parent_branch_ids) {
      const branchCrossings = crossings.filter(
        (pair) => pair.fromBranch === branchId || pair.toBranch === branchId,
      );
      const failedValidators = validatorOutcomes.filter(
        (outcome) => outcome.branchId === branchId && !(outcome.pass && outcome.hashMatched),
      );
      if (branchCrossings.length === 0 && failedValidators.length === 0) continue;
      const parts: string[] = [];
      if (branchCrossings.length > 0) {
        parts.push(
          `${branchCrossings.length} crossing contradiction(s): ` +
            branchCrossings
              .map((pair) => `${pair.fromClaim} contradicts ${pair.toClaim}`)
              .join("; "),
        );
      }
      if (failedValidators.length > 0) {
        parts.push(
          `failing validator(s): ` +
            failedValidators
              .map((outcome) => `${outcome.notebookId}/${outcome.cellId} (${outcome.reason})`)
              .join("; "),
        );
      }
      dissent.push({
        branchId,
        summary: parts.join(" — "),
        reasonNotMerged: "blocking evidence in the merge evidence notebook",
      });
    }

    return {
      decision: MERGE_DECISION.block,
      // A deterministic failing evidence cell is high-confidence grounds to
      // block; a run that could not complete is not evidence of anything.
      confidence: run.summary !== null && hasEvidenceCells ? "high" : "low",
      mergedBranchIds: [],
      rejectedBranchIds: [...merge.parent_branch_ids],
      supersededNodeIds,
      evidenceRefs,
      dissent,
      conditions: [
        `blocked: ${reason}`,
        "a new merge request is required after resolving the blocking evidence",
      ],
      reopenTriggers: [],
    };
  }

  // Passing run. Confidence: forced low with no passing executable evidence
  // cells (input capture does not count as evidence); validators raise it to
  // high; claim/contradiction evidence alone is medium.
  const confidence: MergeVerdict["confidence"] = !hasEvidenceCells
    ? "low"
    : hasValidatorEvidence
      ? "high"
      : "medium";

  const activeClaimIds = [
    ...new Set(
      [...storedClaimsByBranch.values()]
        .flat()
        .filter((claim) => claim.status === "asserted" || claim.status === "supported")
        .map((claim) => claim.id),
    ),
  ];

  return {
    decision: MERGE_DECISION.merge,
    confidence,
    mergedBranchIds: [...merge.parent_branch_ids],
    rejectedBranchIds: [],
    supersededNodeIds,
    evidenceRefs,
    dissent: [],
    conditions: !hasEvidenceCells
      ? [
          "prose-only merge: no executable evidence cells — confidence forced to low per the merge-evidence design contract",
        ]
      : hasClaimEvidence && !hasValidatorEvidence
        ? ["no branch-attached validators were available; evidence is claim-graph only"]
        : [],
    reopenTriggers: activeClaimIds
      .slice(0, MAX_REOPEN_TRIGGERS)
      .map((claimId) => `claim:${claimId}:invalidated-or-superseded`),
  };
}
