/**
 * Direct integration tests with the merge-evidence module
 * (SPEC-MERGE-CORE c7/c9 join points, SPEC-MERGE-EVIDENCE on main):
 *
 * 1. The real createMergeEvidenceGenerator satisfies merge-core's
 *    MergeEvidenceGenerator seam (compile-time + runtime call with the
 *    wire record produced by toMergeCommitWire).
 * 2. tb.merge.claimDiff runs the real diffBranchClaims over the claim
 *    graph via createClaimGraphDiff.
 */

import { describe, it, expect } from 'vitest';
import { createMergeEvidenceGenerator } from '../../merge-evidence/index.js';
import { NotebookHandler } from '../../notebook/index.js';
import { InMemoryClaimStorage } from '../../claims/in-memory-claim-storage.js';
import type { Claim } from '../../claims/types.js';
import { createClaimGraphDiff } from '../claim-graph-diff.js';
import { createStubMergeEvidenceGenerator } from '../evidence-generator.js';
import type { MergeEvidenceGenerator } from '../evidence-generator.js';
import { InMemoryMergeCommitStorage } from '../in-memory-merge-storage.js';
import { createMergeHandler } from '../merge-handler.js';
import type { BranchClaimDiff } from '../../merge-evidence/claim-diff.js';

function makeClaim(id: string, branchId: string, overrides: Partial<Claim> = {}): Claim {
  const now = '2026-07-06T00:00:00.000Z';
  return {
    id,
    workspaceId: 'ws-1',
    type: 'assumption',
    statement: `claim ${id}`,
    status: 'asserted',
    evidenceRefs: [`branch:${branchId}`],
    createdBy: 'agent-1',
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
    ...overrides,
  };
}

describe('merge-evidence integration (real modules)', () => {
  it('the real generator factory satisfies the merge-core seam signature', () => {
    // Compile-time assignability is the contract (SPEC-MERGE-CORE c7):
    // snake_case wire record in, {notebookId, verdict, hash} out. The
    // full generation pipeline is covered by src/merge-evidence tests.
    const generator: MergeEvidenceGenerator = createMergeEvidenceGenerator({
      notebooks: new NotebookHandler(),
      claims: new InMemoryClaimStorage(),
    });
    expect(typeof generator.generateMergeEvidence).toBe('function');
  });

  it('tb.merge.claimDiff runs the real diffBranchClaims over the claim graph', async () => {
    const claimStorage = new InMemoryClaimStorage();
    await claimStorage.saveClaim(makeClaim('claim-shared', 'branch-a'));
    // Shared claim also belongs to branch-b.
    const shared = await claimStorage.getClaim('claim-shared');
    shared!.evidenceRefs = [...shared!.evidenceRefs, 'branch:branch-b'];
    await claimStorage.saveClaim(shared!);
    await claimStorage.saveClaim(makeClaim('claim-a-only', 'branch-a'));
    await claimStorage.saveClaim(makeClaim('claim-b-only', 'branch-b'));
    await claimStorage.addEdge({
      fromClaim: 'claim-a-only',
      toClaim: 'claim-b-only',
      kind: 'contradicts',
      createdBy: 'agent-1',
      createdAt: '2026-07-06T00:00:01.000Z',
    });

    const handler = createMergeHandler({
      storage: new InMemoryMergeCommitStorage(),
      evidenceGenerator: createStubMergeEvidenceGenerator(),
      claimDiff: createClaimGraphDiff(claimStorage),
    });

    const diff = (await handler.handle(null, 'claim_diff', {
      workspaceId: 'ws-1',
      branchA: 'branch-a',
      branchB: 'branch-b',
    })) as BranchClaimDiff;

    expect(diff.branchA).toBe('branch-a');
    expect(diff.branchB).toBe('branch-b');
    expect(diff.shared).toEqual(['claim-shared']);
    expect(diff.added).toEqual(['claim-b-only']);
    expect(diff.removed).toEqual(['claim-a-only']);
    expect(diff.contradicting).toEqual([
      {
        fromClaim: 'claim-a-only',
        toClaim: 'claim-b-only',
        fromBranch: 'branch-a',
        toBranch: 'branch-b',
      },
    ]);
  });
});
