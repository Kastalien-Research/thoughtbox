/**
 * Standing-facts migration shim (SPEC-AGX-SUBSTRATE B11 — Principle 3).
 *
 * A "standing fact" is a keyed, workspace-scoped assertion that outlives the
 * session that wrote it: an assumption-registry entry ("supabase local edge
 * runtime 503s under docker-compose") or a session-handoff standing fact
 * ("prod tables are the owner's archive — never drop"). This shim gives
 * those two consumers a claims-native round-trip so the obligatory artifact
 * (registry file / handoff JSON) can be replaced by the claim graph rather
 * than paralleled by it:
 *
 * - `write`      → `tb.claims.assert` of a typed claim whose statement
 *                  carries the fact key as a queryable prefix
 * - `read`/`list`→ `tb.claims.query` by that prefix, returning only the
 *                  LIVE fact (asserted/supported — invalidated and
 *                  superseded facts are history, not truth)
 * - `supersede`  → `tb.claims.supersede`: the old fact flips to
 *                  'superseded' pointing at its replacement, atomically
 *
 * The shim deliberately routes through ClaimsHandler (not ClaimStorage) so
 * standing facts get exactly the tb.claims semantics: input validation, the
 * atomic supersede CAS, and Realtime status-change emission.
 *
 * Statement encoding: `[fact:<key>] <statement>`. Keys are normalized to
 * lowercase [a-z0-9._-] so the case-insensitive substring match of
 * tb.claims.query finds exactly one key family; the closing `]` prevents
 * prefix collisions ("db" never matches "[fact:db-pool]").
 */

import type { Claim, ClaimType } from './types.js';
import type { ClaimsHandler } from './claims-handler.js';

const FACT_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/** Statuses under which a fact is current truth rather than history. */
const LIVE_STATUSES = new Set(['asserted', 'supported']);

export interface StandingFact {
  key: string;
  /** The bare statement, without the [fact:key] encoding prefix. */
  statement: string;
  /** The underlying claim record (id, status, provenance, evidence). */
  claim: Claim;
}

export interface StandingFactWriteInput {
  workspaceId: string;
  key: string;
  statement: string;
  /**
   * Claim type mapping for the two intended consumers:
   * - assumption-registry entries → 'assumption' (the default)
   * - session-handoff standing facts → 'observation' or 'decision'
   */
  type?: ClaimType;
  evidenceRefs?: string[];
}

export interface StandingFactsShim {
  /**
   * Assert a new standing fact. Throws if a live fact already holds the key
   * in this workspace — revision is an explicit `supersede`, never a
   * silent overwrite (assumption-registry semantics).
   */
  write(agentId: string, input: StandingFactWriteInput): Promise<StandingFact>;
  /** The live fact for a key, or null when none (or only history) exists. */
  read(workspaceId: string, key: string): Promise<StandingFact | null>;
  /** All live facts in a workspace, ordered by key. */
  list(workspaceId: string): Promise<StandingFact[]>;
  /**
   * Replace the live fact for a key: the prior claim flips to 'superseded'
   * (pointing at the replacement) and the replacement is asserted, in one
   * atomic step. Throws when no live fact holds the key.
   */
  supersede(
    agentId: string,
    input: StandingFactWriteInput,
  ): Promise<{ previous: StandingFact; current: StandingFact }>;
}

export function normalizeFactKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  if (!FACT_KEY_PATTERN.test(normalized)) {
    throw new Error(
      `Invalid standing-fact key "${key}": keys must match ${FACT_KEY_PATTERN} after lowercasing`,
    );
  }
  return normalized;
}

export function encodeFactStatement(key: string, statement: string): string {
  return `[fact:${key}] ${statement}`;
}

/** Decode a claim statement; returns null when it is not a standing fact. */
export function decodeFactStatement(
  statement: string,
): { key: string; statement: string } | null {
  const match = /^\[fact:([a-z0-9][a-z0-9._-]*)\] ([\s\S]*)$/.exec(statement);
  if (!match) return null;
  return { key: match[1]!, statement: match[2]! };
}

export function createStandingFacts(claims: ClaimsHandler): StandingFactsShim {
  function toFact(claim: Claim): StandingFact | null {
    const decoded = decodeFactStatement(claim.statement);
    if (!decoded) return null;
    return { key: decoded.key, statement: decoded.statement, claim };
  }

  /**
   * All live fact claims for a key. Query narrows by the encoded prefix
   * (case-insensitive substring), then the exact prefix + liveness are
   * re-checked here. Multiple live claims for one key can only arise from
   * writes that bypassed this shim; newest-first lets the reader converge
   * on the latest assertion instead of failing.
   */
  async function liveFactClaims(workspaceId: string, key: string): Promise<Claim[]> {
    const prefix = `[fact:${key}] `;
    const result = (await claims.handle(null, 'query', {
      workspaceId,
      text: `[fact:${key}]`,
    })) as { claims: Claim[] };
    return result.claims
      .filter(claim => claim.statement.startsWith(prefix) && LIVE_STATUSES.has(claim.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return {
    async write(agentId, input) {
      const key = normalizeFactKey(input.key);
      const [existing] = await liveFactClaims(input.workspaceId, key);
      if (existing) {
        throw new Error(
          `Standing fact "${key}" already exists in workspace ${input.workspaceId} ` +
            `(claim ${existing.id}); use supersede to revise it`,
        );
      }
      const claim = (await claims.handle(agentId, 'assert', {
        workspaceId: input.workspaceId,
        type: input.type ?? 'assumption',
        statement: encodeFactStatement(key, input.statement),
        ...(input.evidenceRefs !== undefined ? { evidenceRefs: input.evidenceRefs } : {}),
      })) as Claim;
      return { key, statement: input.statement, claim };
    },

    async read(workspaceId, key) {
      const [claim] = await liveFactClaims(workspaceId, normalizeFactKey(key));
      return claim ? toFact(claim) : null;
    },

    async list(workspaceId) {
      const result = (await claims.handle(null, 'query', {
        workspaceId,
        text: '[fact:',
      })) as { claims: Claim[] };
      const facts: StandingFact[] = [];
      for (const claim of result.claims) {
        if (!LIVE_STATUSES.has(claim.status)) continue;
        const fact = toFact(claim);
        if (fact) facts.push(fact);
      }
      return facts.sort((a, b) => a.key.localeCompare(b.key));
    },

    async supersede(agentId, input) {
      const key = normalizeFactKey(input.key);
      const [existing] = await liveFactClaims(input.workspaceId, key);
      if (!existing) {
        throw new Error(
          `No live standing fact "${key}" in workspace ${input.workspaceId} to supersede; ` +
            `use write to assert it first`,
        );
      }
      const result = (await claims.handle(agentId, 'supersede', {
        claimId: existing.id,
        statement: encodeFactStatement(key, input.statement),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.evidenceRefs !== undefined ? { evidenceRefs: input.evidenceRefs } : {}),
      })) as { superseded: Claim; replacement: Claim };
      return {
        previous: { key, statement: decodeFactStatement(result.superseded.statement)?.statement ?? result.superseded.statement, claim: result.superseded },
        current: { key, statement: input.statement, claim: result.replacement },
      };
    },
  };
}
