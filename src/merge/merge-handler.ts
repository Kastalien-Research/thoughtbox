/**
 * Merge domain handler (SPEC-MERGE-EVIDENCE) — routes tb.merge.*
 * operations over a MergeCommitStorage and drives the state machine:
 *
 *   request -> pending_evidence -> (evidence pass) pending_approval
 *                               -> (evidence fail) blocked
 *
 * Approval is deliberately ABSENT here (spec c4): the only mutation that
 * can set status 'approved' is the authenticated human route
 * POST /api/merge/[id]/approve in apps/web. This handler exposes exactly
 * request / status / list.
 *
 * Generator output is treated adversarially (spec c2/c3): a throw,
 * schema-invalid verdict, or evidenceFailed !== false blocks the merge;
 * hasPassingExecutableEvidence !== true clamps confidence to 'low'.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { MergeEvidenceGenerator, MergeEvidenceResult } from './evidence-generator.js';
import {
  MERGE_BASE_REF_PREFIX,
  MERGE_STATUSES,
  mergeVerdictSchema,
  type MergeCommit,
  type MergeCommitStorage,
  type MergeVerdict,
} from './types.js';

const requestSchema = z.object({
  workspaceId: z.string().min(1),
  branchIds: z.array(z.string().min(1)).min(1),
  baseRef: z.string().min(1).optional(),
});

const statusSchema = z.object({
  mergeId: z.string().min(1),
});

const listSchema = z.object({
  workspaceId: z.string().min(1),
  status: z.enum(MERGE_STATUSES).optional(),
});

const MUTATING_OPERATIONS = new Set(['request']);

export interface MergeHandler {
  handle(
    agentId: string | null,
    operation: string,
    args: Record<string, unknown>,
  ): Promise<unknown>;
}

export interface MergeHandlerOptions {
  storage: MergeCommitStorage;
  evidenceGenerator: MergeEvidenceGenerator;
}

export function createMergeHandler(options: MergeHandlerOptions): MergeHandler {
  const { storage, evidenceGenerator } = options;

  /**
   * Validate + normalize generator output. Returns the verdict to persist
   * (confidence clamped when there is no passing executable evidence) or
   * null when the evidence must block the merge.
   */
  function evaluateEvidence(result: MergeEvidenceResult): {
    verdict: MergeVerdict | null;
    blockedReason?: string;
  } {
    const parsed = mergeVerdictSchema.safeParse(result.verdict);
    if (!parsed.success) {
      return { verdict: null, blockedReason: 'generator returned a schema-invalid verdict' };
    }
    if (result.evidenceFailed !== false) {
      return { verdict: null, blockedReason: 'evidence notebook run failed' };
    }
    const verdict = parsed.data;
    if (result.hasPassingExecutableEvidence !== true) {
      // Prose-only evidence is legal but confidence is FORCED low (c2).
      verdict.confidence = 'low';
    }
    return { verdict };
  }

  async function request(agentId: string, args: Record<string, unknown>): Promise<MergeCommit> {
    const input = requestSchema.parse(args);

    if (input.baseRef?.startsWith(MERGE_BASE_REF_PREFIX)) {
      const priorId = input.baseRef.slice(MERGE_BASE_REF_PREFIX.length);
      const prior = await storage.getMergeCommit(priorId);
      if (!prior) {
        throw new Error(`baseRef references unknown merge commit: ${priorId}`);
      }
      if (prior.workspaceId !== input.workspaceId) {
        throw new Error(
          `baseRef merge commit ${priorId} belongs to workspace ${prior.workspaceId}, ` +
            `not ${input.workspaceId}`,
        );
      }
    }

    const record: MergeCommit = {
      id: `merge-${randomUUID()}`,
      workspaceId: input.workspaceId,
      parentBranchIds: input.branchIds,
      ...(input.baseRef !== undefined ? { baseRef: input.baseRef } : {}),
      status: 'pending_evidence',
      requestedBy: agentId,
      createdAt: new Date().toISOString(),
    };
    // Persist BEFORE generation so a generator crash still leaves an
    // auditable record (transitioned to blocked below).
    await storage.createMergeCommit(record);

    let result: MergeEvidenceResult | null = null;
    try {
      result = await evidenceGenerator.generateMergeEvidence(record);
    } catch {
      // Generator crash = failed evidence generation -> blocked (c3).
      result = null;
    }

    if (!result) {
      return storage.transitionMergeCommit(record.id, 'pending_evidence', {
        status: 'blocked',
        decidedAt: new Date().toISOString(),
      });
    }

    const { verdict } = evaluateEvidence(result);
    if (!verdict) {
      // Failed evidence BLOCKS the merge (c3). The notebook + hash are
      // still recorded: the failure itself is auditable evidence.
      return storage.transitionMergeCommit(record.id, 'pending_evidence', {
        status: 'blocked',
        evidenceNotebookId: result.notebookId,
        evidenceHash: result.hash,
        ...(mergeVerdictSchema.safeParse(result.verdict).success
          ? { verdict: result.verdict }
          : {}),
        decidedAt: new Date().toISOString(),
      });
    }

    return storage.transitionMergeCommit(record.id, 'pending_evidence', {
      status: 'pending_approval',
      evidenceNotebookId: result.notebookId,
      evidenceHash: result.hash,
      verdict,
    });
  }

  async function status(args: Record<string, unknown>): Promise<MergeCommit> {
    const input = statusSchema.parse(args);
    const record = await storage.getMergeCommit(input.mergeId);
    if (!record) throw new Error(`Merge commit not found: ${input.mergeId}`);
    return record;
  }

  async function list(args: Record<string, unknown>): Promise<unknown> {
    const input = listSchema.parse(args);
    const merges = await storage.listMergeCommits(input);
    return { merges, count: merges.length };
  }

  return {
    async handle(agentId, operation, args) {
      if (MUTATING_OPERATIONS.has(operation) && !agentId) {
        throw new Error(
          `tb.merge.${operation} requires an agent identity. ` +
            'Call tb.hub.register (or tb.hub.quickJoin) first, or pass agentId explicitly.',
        );
      }
      switch (operation) {
        case 'request':
          return request(agentId!, args);
        case 'status':
          return status(args);
        case 'list':
          return list(args);
        default:
          throw new Error(`Unknown merge operation: ${operation}`);
      }
    },
  };
}
