/**
 * Claim-side adapter for the runbook await binding (SPEC-AGX-SUBSTRATE B6).
 *
 * Adapts the full ClaimStorage contract down to the narrow AwaitClaimBinding
 * surface the notebook engine consumes: a pull-only current-status read and
 * an idempotent subscription write for parked await cells (subscriber ref
 * "runbook:<instanceId>/<cellId>" — the runbook_cell_ref form documented on
 * ClaimSubscription). The dependency points claims → notebook so the
 * notebook engine never imports the claims module.
 *
 * Wiring: server-factory passes
 * `claimBinding: createRunbookClaimBinding(args.claimStorage)` into
 * NotebookHandler options whenever claim storage is configured.
 */

import type { AwaitClaimBinding } from '../notebook/runbook/await.js';
import type { ClaimStorage } from './types.js';

export function createRunbookClaimBinding(storage: ClaimStorage): AwaitClaimBinding {
  return {
    async getClaimStatus(claimId) {
      const claim = await storage.getClaim(claimId);
      // ClaimStatus and AwaitClaimStatus are the same string-literal union
      // (deliberately duplicated in await.ts to keep the notebook engine
      // free of a claims import).
      return claim ? claim.status : null;
    },
    async subscribe(claimId, subscriber, createdBy) {
      await storage.addSubscription({
        claimId,
        subscriber,
        createdBy,
        createdAt: new Date().toISOString(),
      });
    },
  };
}
