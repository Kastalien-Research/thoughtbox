/**
 * Operations catalog for merge evidence (SPEC-MERGE-CORE c9).
 *
 * Defines the 3 tb.merge.* operations with schemas and examples,
 * mirroring the claims catalog pattern (src/claims/operations.ts).
 * There is deliberately NO approve operation here: approval is human-only
 * via POST /api/merge/[id]/approve in apps/web (spec c4).
 */

import type { OperationDefinition } from '../hub/operations.js';

export const MERGE_VOCABULARY = {
  merge:
    'A finalized reasoning decision — a "collapse to certainty" across competing branches. A merge commit binds parent branch heads to an auto-generated evidence notebook, its hash, and a structured verdict. Merge commits are immutable history: supersede/revert happens via new commits on top, never rewrites.',
  status:
    'Lifecycle: pending_evidence -> (evidence pass) pending_approval -> approved | (evidence fail) blocked. blocked and approved are terminal; approved may later become superseded when a later merge built on it (baseRef "merge:<id>") is approved. Approval is HUMAN-ONLY via the web surface.',
  evidence:
    'Evidence notebooks are auto-generated from the system template at request time; agents never hand-author merge evidence. Prose-only evidence is legal but forces verdict confidence to low. A failed evidence notebook blocks the merge.',
  verdict:
    'Structured output: { decision, confidence (low|medium|high), mergedBranchIds, rejectedBranchIds, supersededNodeIds, evidenceRefs, dissent, conditions, reopenTriggers }.',
};

const agentIdProperty = {
  agentId: {
    type: 'string',
    description:
      'Acting agent (must be registered in this session via tb.hub.register). Defaults to the session default identity.',
  },
};

export const MERGE_OPERATIONS: OperationDefinition[] = [
  {
    name: 'request',
    title: 'Request Merge',
    description:
      'Request a reasoning merge: creates an immutable merge commit (pending_evidence), auto-generates and evaluates the evidence notebook, and returns the record in its post-evidence state — pending_approval (awaiting human approval in the web app) or blocked (evidence failed; terminal, issue a new request). Prose-only evidence forces verdict confidence to low. There is no tb approval operation: only the authenticated workspace owner can approve, via the web surface.',
    category: 'merge',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Hub workspace ID' },
        branchIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Candidate branch heads to collapse (at least one)',
        },
        baseRef: {
          type: 'string',
          description:
            'Optional base node or prior checkpoint. "merge:<id>" references a prior merge commit in the same workspace; when this request is approved and the referenced commit is still approved, the referenced commit becomes superseded.',
        },
        ...agentIdProperty,
      },
      required: ['workspaceId', 'branchIds'],
    },
    example: {
      workspaceId: 'ws-abc123',
      branchIds: ['branch-auth-rewrite', 'branch-auth-patch'],
    },
  },
  {
    name: 'status',
    title: 'Merge Status',
    description:
      'Fetch a merge commit by id: status, evidence notebook id + hash, verdict, attribution, and decision timestamps. Read-only.',
    category: 'merge',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        mergeId: { type: 'string', description: 'Merge commit ID' },
      },
      required: ['mergeId'],
    },
    example: { mergeId: 'merge-001' },
  },
  {
    name: 'list',
    title: 'List Merges',
    description:
      'List merge commits in a hub workspace, optionally filtered by status, ordered by created_at ascending then id. Read-only.',
    category: 'merge',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Hub workspace ID' },
        status: {
          type: 'string',
          enum: ['pending_evidence', 'blocked', 'pending_approval', 'approved', 'superseded'],
          description: 'Filter by merge status',
        },
      },
      required: ['workspaceId'],
    },
    example: { workspaceId: 'ws-abc123', status: 'pending_approval' },
  },
  {
    name: 'claim_diff',
    title: 'Branch Claim Diff',
    description:
      'Claim-level diff between two branches in a workspace: added, removed, shared, superseded claims and crossing contradicts edges (SPEC-MERGE-EVIDENCE diffBranchClaims; the same computation feeding merge-evidence notebooks). A claim belongs to a branch when an evidenceRef is "branch:<branchId>" or prefixed "branch:<branchId>/". Read-only.',
    category: 'merge',
    stage: 2,
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: { type: 'string', description: 'Hub workspace ID' },
        branchA: { type: 'string', description: 'First branch id' },
        branchB: { type: 'string', description: 'Second branch id' },
      },
      required: ['workspaceId', 'branchA', 'branchB'],
    },
    example: { workspaceId: 'ws-abc123', branchA: 'branch-auth-rewrite', branchB: 'branch-auth-patch' },
  },
];

export function getMergeOperation(name: string): OperationDefinition | undefined {
  return MERGE_OPERATIONS.find(op => op.name === name);
}

/** Full catalog JSON for the thoughtbox://merge/operations resource. */
export function getMergeOperationsCatalog(): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      vocabulary: MERGE_VOCABULARY,
      operations: MERGE_OPERATIONS.map(op => ({
        name: op.name,
        title: op.title,
        description: op.description,
        category: op.category,
        stage: op.stage,
        inputs: op.inputSchema,
        example: op.example,
      })),
    },
    null,
    2,
  );
}
