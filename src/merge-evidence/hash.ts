/**
 * Evidence hash — canonical hash of the merge-evidence notebook snapshot,
 * reusing the contract-hashing machinery (canonicalize → sha256, the same
 * `hashJson` that outcome contracts are compiled and re-verified with —
 * src/notebook/contracts.ts B4a).
 *
 * The snapshot is everything a verifier needs to check the merge record's
 * `evidence_hash`: the exported .src.md (cell prose + sources, deterministic
 * — no timestamps or outputs), the compiled contract hashes (contracts do
 * not survive .src.md encoding), the frozen-schema verdict, and the run
 * summary the verdict was derived from. Recomputing the hash over the
 * persisted artifact + stored verdict must reproduce `evidence_hash`;
 * any tampering with cells, contracts, verdict, or run outcome changes it.
 */

import { hashJson } from "../peer-notebook/manifest.js";
import type { MergeVerdict } from "./types.js";

export interface MergeEvidenceRunSummary {
  pass: boolean;
  reason: string;
  contractCoverage: number;
}

export interface MergeEvidenceSnapshot {
  schemaVersion: "merge-evidence-snapshot.v1";
  mergeId: string;
  /** Exported notebook content (.src.md) at hash time. */
  srcmd: string;
  /** Compiled tier-1 contract hashes per cell (order = document order). */
  contractHashes: Array<{ cellId: string; contractHash: string }>;
  verdict: MergeVerdict;
  /** Null when the evidence run itself could not complete. */
  run: MergeEvidenceRunSummary | null;
}

export function computeMergeEvidenceHash(snapshot: MergeEvidenceSnapshot): string {
  return hashJson(snapshot);
}
