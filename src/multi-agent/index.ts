/**
 * Multi-Agent Module — Re-exports
 *
 * Content-addressable thought hashing, agent attribution,
 * formal logic conflict detection, and structural branch diffs.
 *
 * @module src/multi-agent
 */

export { computeHash, resolveParentHash, verifyChain, GENESIS_HASH } from './content-hash.js';
export type { HashInput, ChainVerification } from './content-hash.js';

export { parseClaims, normalizeClaim } from './claim-parser.js';
export type { ExtractedClaim, Derivation, ParseResult } from './claim-parser.js';

export { detectConflicts } from './conflict-detection.js';
export type { Conflict, ConflictResult } from './conflict-detection.js';

export { computeBranchDiff, renderTimeline, renderSplitDiff } from './thought-diff.js';
export type { BranchDiff, AgentInfo } from './thought-diff.js';

export { getExtendedCipher, CIPHER_LOGIC_EXTENSION, LOGIC_NOTATION } from './cipher-extension.js';
