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
 *
 * Keyed uniqueness is RECONCILE-BASED, not constraint-based: the claim
 * store has no partial unique index on the fact key, so two concurrent
 * `write`s of the same key can both pass the pre-check and both assert.
 * `write` therefore asserts first and reconciles after: the DETERMINISTIC
 * winner is the oldest live claim (createdAt, then claim id ascending);
 * every other live claim for the key is retired, and a writer whose own
 * claim lost gets the same "already exists" error a sequential duplicate
 * write gets (first-writer-wins — write is create-only). `read`/`list`
 * run the same reconcile lazily whenever they observe more than one live
 * claim for a key, self-healing residual visibility windows and pre-fix
 * duplicates. Reconcile never touches the winner, so a key that had a
 * live fact can never end up with zero.
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

/**
 * Actor identity stamped on reconcile mutations that run inside the
 * agent-less reads (`read`/`list`). The retirement is mechanical
 * (duplicate cleanup), not an agent's judgment, so it gets a fixed
 * system identity rather than borrowing whoever happened to read.
 */
const RECONCILE_ACTOR = 'standing-facts-reconcile';

/**
 * Deterministic winner order for duplicate live facts: oldest first
 * (createdAt), claim id ascending as the tiebreak. Every reconciler —
 * writer-side or reader-side, on any process — computes the same winner
 * from the same set, so concurrent reconciles converge instead of
 * fighting.
 */
function compareFactClaims(a: Claim, b: Claim): number {
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

/**
 * A reconcile loser whose retirement fails because a concurrent actor
 * already moved it (retired via supersede, or a CAS conflict from a
 * racing reconciler) is a benign race: the claim is no longer (or is
 * about to stop being) a live duplicate, and the next read re-checks.
 * Anything else — storage failure, missing claim — must propagate.
 */
function isBenignReconcileRace(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /already superseded/.test(error.message) || /concurrent update/.test(error.message);
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
   * re-checked here. Sorted winner-first (oldest, id tiebreak): index 0
   * is the claim reconcile keeps.
   */
  async function liveFactClaims(workspaceId: string, key: string): Promise<Claim[]> {
    const prefix = `[fact:${key}] `;
    const result = (await claims.handle(null, 'query', {
      workspaceId,
      text: `[fact:${key}]`,
    })) as { claims: Claim[] };
    return result.claims
      .filter(claim => claim.statement.startsWith(prefix) && LIVE_STATUSES.has(claim.status))
      .sort(compareFactClaims);
  }

  /**
   * Collapse duplicate live facts for a key down to the deterministic
   * winner; returns the winner (or null when the key has no live fact).
   *
   * Losers are retired through `tb.claims.invalidate` — the one
   * ClaimsHandler transition that removes a claim from live status
   * without minting a new claim (`tb.claims.supersede` always creates a
   * fresh replacement, which would itself be a new live duplicate of the
   * key). The winner is never touched, so reconcile can never leave the
   * key with zero live facts. A partial unique index on the fact key is
   * the constraint-based upgrade if standing facts become load-bearing.
   */
  async function reconcileLiveFacts(
    actor: string,
    workspaceId: string,
    key: string,
  ): Promise<Claim | null> {
    const [winner, ...losers] = await liveFactClaims(workspaceId, key);
    if (!winner) return null;
    for (const loser of losers) {
      try {
        await claims.handle(actor, 'invalidate', { claimId: loser.id });
      } catch (error) {
        if (!isBenignReconcileRace(error)) throw error;
      }
    }
    return winner;
  }

  function alreadyExistsError(key: string, workspaceId: string, claimId: string): Error {
    return new Error(
      `Standing fact "${key}" already exists in workspace ${workspaceId} ` +
        `(claim ${claimId}); use supersede to revise it`,
    );
  }

  return {
    async write(agentId, input) {
      const key = normalizeFactKey(input.key);
      // Cheap pre-check for the friendly common-case error. NOT the
      // guarantee: two concurrent writers can both pass it.
      const [existing] = await liveFactClaims(input.workspaceId, key);
      if (existing) {
        throw alreadyExistsError(key, input.workspaceId, existing.id);
      }
      const claim = (await claims.handle(agentId, 'assert', {
        workspaceId: input.workspaceId,
        type: input.type ?? 'assumption',
        statement: encodeFactStatement(key, input.statement),
        ...(input.evidenceRefs !== undefined ? { evidenceRefs: input.evidenceRefs } : {}),
      })) as Claim;
      // Assert-then-reconcile: re-query AFTER asserting so a concurrent
      // duplicate is visible, then keep only the deterministic winner. If
      // our own claim lost, reconcile already retired it — surface the
      // same error a sequential duplicate write gets (first-writer-wins,
      // matching write's create-only contract).
      const winner = await reconcileLiveFacts(agentId, input.workspaceId, key);
      if (winner && winner.id !== claim.id) {
        throw alreadyExistsError(key, input.workspaceId, winner.id);
      }
      return { key, statement: input.statement, claim };
    },

    async read(workspaceId, key) {
      const normalized = normalizeFactKey(key);
      const live = await liveFactClaims(workspaceId, normalized);
      if (live.length > 1) {
        const winner = await reconcileLiveFacts(RECONCILE_ACTOR, workspaceId, normalized);
        return winner ? toFact(winner) : null;
      }
      return live[0] ? toFact(live[0]) : null;
    },

    async list(workspaceId) {
      const result = (await claims.handle(null, 'query', {
        workspaceId,
        text: '[fact:',
      })) as { claims: Claim[] };
      const liveByKey = new Map<string, Claim[]>();
      for (const claim of result.claims) {
        if (!LIVE_STATUSES.has(claim.status)) continue;
        const decoded = decodeFactStatement(claim.statement);
        if (!decoded) continue;
        const group = liveByKey.get(decoded.key);
        if (group) group.push(claim);
        else liveByKey.set(decoded.key, [claim]);
      }
      const facts: StandingFact[] = [];
      for (const [key, group] of liveByKey) {
        let claim: Claim | null = group.sort(compareFactClaims)[0]!;
        if (group.length > 1) {
          // Lazy heal: list never returns two facts with the same key.
          claim = await reconcileLiveFacts(RECONCILE_ACTOR, workspaceId, key);
        }
        if (!claim) continue;
        const fact = toFact(claim);
        if (fact) facts.push(fact);
      }
      return facts.sort((a, b) => a.key.localeCompare(b.key));
    },

    async supersede(agentId, input) {
      const key = normalizeFactKey(input.key);
      // Heal duplicates BEFORE flipping: superseding the winner while a
      // duplicate stayed live would leave that older duplicate outranking
      // the fresh replacement at the next reconcile.
      const existing = await reconcileLiveFacts(agentId, input.workspaceId, key);
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
