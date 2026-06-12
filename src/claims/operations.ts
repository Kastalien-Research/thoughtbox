/**
 * Operations catalog for the claim graph (SPEC-AGX-SUBSTRATE B2).
 *
 * Defines the 9 tb.claims.* operations with schemas and examples,
 * mirroring the hub catalog pattern (src/hub/operations.ts). Mutations
 * accept a top-level agentId; without it the session's default hub
 * identity (first register/quick_join) is used.
 */

import type { OperationDefinition } from '../hub/operations.js';

export const CLAIMS_VOCABULARY = {
  claim:
    'A typed assertion (assumption | decision | observation | requirement | outcome) with provenance, status, and evidence. The unit of shared agent state: structured enough to compute who is affected when it changes.',
  status:
    "Claim lifecycle: asserted → supported (evidence attached) → invalidated or superseded. Transitions are append-history-style — invalidation and supersession never delete the claim; supersession sets a superseded_by pointer to the replacement.",
  edge: 'A typed dependency between claims: depends_on, derives_from, or contradicts. depends_on edges drive the affected traversal.',
  subscription:
    'An explicit registration of interest in a claim by an agent or a runbook cell ref. Relevance routing v0 is explicit subscriptions only.',
};

const agentIdProperty = {
  agentId: {
    type: 'string',
    description:
      'Acting agent (must be registered in this session via tb.hub.register). Defaults to the session default identity.',
  },
};

export const CLAIMS_OPERATIONS: OperationDefinition[] = [
  {
    name: 'assert',
    title: 'Assert Claim',
    description:
      'Create a new typed claim in a hub workspace with status asserted. Returns the claim with its generated id.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Hub workspace ID' },
        type: {
          type: 'string',
          enum: ['assumption', 'decision', 'observation', 'requirement', 'outcome'],
          description: 'Claim type',
        },
        statement: {
          type: 'string',
          description:
            'The assertion. Aim for atomic falsifiability: one observation should suffice to invalidate it.',
        },
        evidenceRefs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initial evidence references (URLs, thought refs, file paths)',
        },
        ...agentIdProperty,
      },
      required: ['workspaceId', 'type', 'statement'],
    },
    example: {
      workspaceId: 'ws-abc123',
      type: 'assumption',
      statement: 'The auth service tolerates 30s token clock skew',
    },
  },
  {
    name: 'support',
    title: 'Support Claim',
    description:
      'Attach evidence to a claim and mark it supported. Rejected for invalidated or superseded claims.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        claimId: { type: 'string', description: 'Claim to support' },
        evidenceRefs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Evidence references to append (at least one)',
        },
        ...agentIdProperty,
      },
      required: ['claimId', 'evidenceRefs'],
    },
    example: {
      claimId: 'claim-001',
      evidenceRefs: ['thought:sess-1/12', 'https://github.com/org/repo/pull/42'],
    },
  },
  {
    name: 'invalidate',
    title: 'Invalidate Claim',
    description:
      'Mark a claim invalidated. Append-history-style: the claim row is preserved (no hard delete). Idempotent on already-invalidated claims; rejected for superseded claims.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        claimId: { type: 'string', description: 'Claim to invalidate' },
        ...agentIdProperty,
      },
      required: ['claimId'],
    },
    example: { claimId: 'claim-001' },
  },
  {
    name: 'supersede',
    title: 'Supersede Claim',
    description:
      'Replace a claim with a new one: asserts the replacement and marks the old claim superseded with a superseded_by pointer. The old claim is preserved.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        claimId: { type: 'string', description: 'Claim to supersede' },
        statement: { type: 'string', description: 'Statement of the replacement claim' },
        type: {
          type: 'string',
          enum: ['assumption', 'decision', 'observation', 'requirement', 'outcome'],
          description: 'Replacement claim type (defaults to the superseded claim type)',
        },
        evidenceRefs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Initial evidence for the replacement claim',
        },
        ...agentIdProperty,
      },
      required: ['claimId', 'statement'],
    },
    example: {
      claimId: 'claim-001',
      statement: 'The auth service tolerates 5s token clock skew (measured)',
    },
  },
  {
    name: 'link',
    title: 'Link Claims',
    description:
      'Create a typed edge between two claims in the same workspace. depends_on edges feed the affected traversal. Idempotent per (from, to, kind).',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        fromClaimId: { type: 'string', description: 'Source claim (the dependent for depends_on)' },
        toClaimId: { type: 'string', description: 'Target claim (the dependency for depends_on)' },
        kind: {
          type: 'string',
          enum: ['depends_on', 'derives_from', 'contradicts'],
          description: 'Edge kind',
        },
        ...agentIdProperty,
      },
      required: ['fromClaimId', 'toClaimId', 'kind'],
    },
    example: { fromClaimId: 'claim-002', toClaimId: 'claim-001', kind: 'depends_on' },
  },
  {
    name: 'subscribe',
    title: 'Subscribe to Claim',
    description:
      'Register a subscriber (agent or runbook cell ref) on a claim. Defaults to the acting agent. Idempotent per (claim, subscriber).',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        claimId: { type: 'string', description: 'Claim to watch' },
        subscriber: {
          type: 'string',
          description:
            'Subscriber identity: an agentId or a runbook cell ref. Defaults to the acting agent.',
        },
        ...agentIdProperty,
      },
      required: ['claimId'],
    },
    example: { claimId: 'claim-001' },
  },
  {
    name: 'unsubscribe',
    title: 'Unsubscribe from Claim',
    description: 'Remove a subscriber from a claim. No-op when the subscription does not exist.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        claimId: { type: 'string', description: 'Claim to stop watching' },
        subscriber: {
          type: 'string',
          description: 'Subscriber to remove. Defaults to the acting agent.',
        },
        ...agentIdProperty,
      },
      required: ['claimId'],
    },
    example: { claimId: 'claim-001' },
  },
  {
    name: 'query',
    title: 'Query Claims',
    description:
      'List claims in a workspace filtered by type, status, creating agent, and/or statement substring.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Hub workspace ID' },
        type: {
          type: 'string',
          enum: ['assumption', 'decision', 'observation', 'requirement', 'outcome'],
          description: 'Filter by claim type',
        },
        status: {
          type: 'string',
          enum: ['asserted', 'supported', 'invalidated', 'superseded'],
          description: 'Filter by status',
        },
        createdBy: { type: 'string', description: 'Filter by asserting agentId' },
        text: { type: 'string', description: 'Case-insensitive substring of the statement' },
      },
      required: ['workspaceId'],
    },
    example: { workspaceId: 'ws-abc123', type: 'assumption', status: 'asserted' },
  },
  {
    name: 'affected',
    title: 'Affected Claims',
    description:
      'Transitive dependents of a claim: claims reachable by reverse depends_on edges. Cycle-safe and depth-capped (default 10, max 20); each result carries its edge distance.',
    category: 'claims',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        claimId: { type: 'string', description: 'Claim whose dependents to find' },
        maxDepth: {
          type: 'number',
          description: 'Traversal depth cap (1-20, default 10)',
        },
      },
      required: ['claimId'],
    },
    example: { claimId: 'claim-001' },
  },
];

export function getClaimsOperation(name: string): OperationDefinition | undefined {
  return CLAIMS_OPERATIONS.find(op => op.name === name);
}
