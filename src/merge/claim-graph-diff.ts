/**
 * Claim-graph binding for tb.merge.claimDiff (SPEC-MERGE-CORE c9):
 * SPEC-MERGE-EVIDENCE's diffBranchClaims bound over a ClaimStorage.
 * Server wiring passes createClaimGraphDiff(claimStorage) as
 * MergeHandlerOptions.claimDiff; the branch association convention is
 * evidenceRef "branch:<branchId>" (or "branch:<branchId>/...").
 */

import { claimsForBranch, diffBranchClaims } from '../merge-evidence/claim-diff.js';
import type { ClaimStorage } from '../claims/types.js';
import type { MergeClaimDiffFn } from './merge-handler.js';

export function createClaimGraphDiff(storage: ClaimStorage): MergeClaimDiffFn {
  return async ({ workspaceId, branchA, branchB }) => {
    const [claimsA, claimsB, contradictsEdges] = await Promise.all([
      claimsForBranch(storage, workspaceId, branchA),
      claimsForBranch(storage, workspaceId, branchB),
      storage.listEdges({ kind: 'contradicts' }),
    ]);
    return diffBranchClaims({ branchA, claimsA, branchB, claimsB, contradictsEdges });
  };
}
