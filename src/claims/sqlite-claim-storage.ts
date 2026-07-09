/**
 * SqliteClaimStorage — durable local claim graph storage
 * (SPEC-AGX-SUBSTRATE B1, claim c1; §11.5 dual-backend product gate).
 *
 * The local-mode counterpart of SupabaseClaimStorage: a single better-sqlite3
 * database at `<dataDir>/claims.db` so claims survive process restarts in
 * local/self-hosted mode. SQLite (not JSON files) because the contract
 * requires transactional semantics a flat file cannot honor:
 * - the claim aggregate uses optimistic concurrency (`version` column,
 *   compare-and-swap on save; stale saves throw instead of silently
 *   overwriting);
 * - `supersedeClaim` inserts the replacement and CAS-flips the original in
 *   ONE SQLite transaction — a lost version race rolls back both writes,
 *   leaving no orphaned replacement;
 * - edges and subscriptions are append-style rows; `addEdge` and
 *   `addSubscription` use INSERT OR IGNORE on their natural keys so
 *   at-least-once retries are idempotent (FK violations still throw —
 *   OR IGNORE does not apply to foreign keys);
 * - claims are never hard-deleted (append-history status transitions).
 *
 * better-sqlite3 is synchronous, so every method body runs without an
 * interleaving await point — in-process callers get the same atomicity the
 * InMemory backend guarantees, and WAL + busy_timeout arbitrate the rare
 * multi-process case.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import type {
  Claim,
  ClaimEdge,
  ClaimEdgeFilter,
  ClaimQuery,
  ClaimStatus,
  ClaimStorage,
  ClaimSubscription,
  ClaimType,
} from "./types.js";

interface ClaimRow {
  id: string;
  workspace_id: string;
  type: string;
  statement: string;
  status: string;
  evidence_refs: string;
  created_by: string;
  superseded_by: string | null;
  created_at: string;
  updated_at: string;
  status_changed_at: string;
  version: number;
}

interface EdgeRow {
  from_claim: string;
  to_claim: string;
  kind: string;
  created_by: string;
  created_at: string;
}

interface SubscriptionRow {
  claim_id: string;
  subscriber: string;
  created_by: string;
  created_at: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  type TEXT NOT NULL,
  statement TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_refs TEXT NOT NULL,
  created_by TEXT NOT NULL,
  superseded_by TEXT REFERENCES claims(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status_changed_at TEXT NOT NULL,
  version INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_claims_workspace ON claims(workspace_id);
CREATE INDEX IF NOT EXISTS idx_claims_status_changed ON claims(status_changed_at);

CREATE TABLE IF NOT EXISTS claim_edges (
  from_claim TEXT NOT NULL REFERENCES claims(id),
  to_claim TEXT NOT NULL REFERENCES claims(id),
  kind TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (from_claim, to_claim, kind)
);
CREATE INDEX IF NOT EXISTS idx_claim_edges_to ON claim_edges(to_claim);

CREATE TABLE IF NOT EXISTS claim_subscriptions (
  claim_id TEXT NOT NULL REFERENCES claims(id),
  subscriber TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (claim_id, subscriber)
);
`;

export class SqliteClaimStorage implements ClaimStorage {
  private db: Database.Database;
  /** Versions of claim instances read through this storage (optimistic CAS). */
  private readVersions = new WeakMap<object, number>();

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(SCHEMA);
  }

  private fail(operation: string, message: string): never {
    throw new Error(`SqliteClaimStorage.${operation} failed: ${message}`);
  }

  private rowToClaim(row: ClaimRow): Claim {
    const claim: Claim = {
      id: row.id,
      workspaceId: row.workspace_id,
      type: row.type as ClaimType,
      statement: row.statement,
      status: row.status as ClaimStatus,
      evidenceRefs: JSON.parse(row.evidence_refs) as string[],
      createdBy: row.created_by,
      ...(row.superseded_by !== null ? { supersededBy: row.superseded_by } : {}),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      statusChangedAt: row.status_changed_at,
    };
    this.readVersions.set(claim, row.version);
    return claim;
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    const row = this.db
      .prepare("SELECT * FROM claims WHERE id = ?")
      .get(claimId) as ClaimRow | undefined;
    return row ? this.rowToClaim(row) : null;
  }

  async getClaims(claimIds: string[]): Promise<Claim[]> {
    const select = this.db.prepare("SELECT * FROM claims WHERE id = ?");
    const claims: Claim[] = [];
    for (const claimId of claimIds) {
      const row = select.get(claimId) as ClaimRow | undefined;
      if (row) claims.push(this.rowToClaim(row));
    }
    return claims;
  }

  private insertClaim(claim: Claim): void {
    this.db
      .prepare(
        `INSERT INTO claims
           (id, workspace_id, type, statement, status, evidence_refs, created_by,
            superseded_by, created_at, updated_at, status_changed_at, version)
         VALUES
           (@id, @workspace_id, @type, @statement, @status, @evidence_refs, @created_by,
            @superseded_by, @created_at, @updated_at, @status_changed_at, @version)`,
      )
      .run({
        id: claim.id,
        workspace_id: claim.workspaceId,
        type: claim.type,
        statement: claim.statement,
        status: claim.status,
        evidence_refs: JSON.stringify(claim.evidenceRefs),
        created_by: claim.createdBy,
        superseded_by: claim.supersededBy ?? null,
        created_at: claim.createdAt,
        updated_at: claim.updatedAt,
        status_changed_at: claim.statusChangedAt,
        version: 1,
      });
  }

  private casUpdateClaim(claim: Claim, expected: number): number {
    const result = this.db
      .prepare(
        `UPDATE claims SET
           statement = @statement, status = @status, evidence_refs = @evidence_refs,
           superseded_by = @superseded_by, updated_at = @updated_at,
           status_changed_at = @status_changed_at, version = @next_version
         WHERE id = @id AND version = @expected_version`,
      )
      .run({
        id: claim.id,
        statement: claim.statement,
        status: claim.status,
        evidence_refs: JSON.stringify(claim.evidenceRefs),
        superseded_by: claim.supersededBy ?? null,
        updated_at: claim.updatedAt,
        status_changed_at: claim.statusChangedAt,
        next_version: expected + 1,
        expected_version: expected,
      });
    return result.changes;
  }

  async saveClaim(claim: Claim): Promise<void> {
    const expected = this.readVersions.get(claim);
    if (expected === undefined) {
      const existing = this.db
        .prepare("SELECT 1 FROM claims WHERE id = ?")
        .get(claim.id);
      if (existing) {
        this.fail("saveClaim", `claim ${claim.id} already exists`);
      }
      this.insertClaim(claim);
      this.readVersions.set(claim, 1);
      return;
    }
    const changes = this.casUpdateClaim(claim, expected);
    if (changes === 0) {
      this.fail(
        "saveClaim",
        `concurrent update detected for claim ${claim.id}; reload and retry`,
      );
    }
    this.readVersions.set(claim, expected + 1);
  }

  async supersedeClaim(original: Claim, replacement: Claim): Promise<void> {
    const expected = this.readVersions.get(original);
    if (expected === undefined) {
      this.fail(
        "supersedeClaim",
        `original ${original.id} was not read through this storage; reload and retry`,
      );
    }
    // One SQLite transaction: insert the replacement, then CAS the original
    // onto it. claims.superseded_by is an immediate FK, so the insert must
    // precede the pointer update; a lost version race throws and rolls the
    // replacement insert back — no partially-applied state survives.
    const apply = this.db.transaction(() => {
      const existing = this.db
        .prepare("SELECT 1 FROM claims WHERE id = ?")
        .get(replacement.id);
      if (existing) {
        this.fail("supersedeClaim", `replacement ${replacement.id} already exists`);
      }
      this.insertClaim(replacement);
      const changes = this.casUpdateClaim(original, expected);
      if (changes === 0) {
        this.fail(
          "supersedeClaim",
          `concurrent update detected for claim ${original.id}; reload and retry`,
        );
      }
    });
    apply();
    this.readVersions.set(original, expected + 1);
    this.readVersions.set(replacement, 1);
  }

  async queryClaims(query: ClaimQuery): Promise<Claim[]> {
    const clauses = ["workspace_id = @workspace_id"];
    const params: Record<string, string> = { workspace_id: query.workspaceId };
    if (query.type) {
      clauses.push("type = @type");
      params.type = query.type;
    }
    if (query.status) {
      clauses.push("status = @status");
      params.status = query.status;
    }
    if (query.createdBy) {
      clauses.push("created_by = @created_by");
      params.created_by = query.createdBy;
    }
    if (query.text) {
      clauses.push("instr(lower(statement), lower(@text)) > 0");
      params.text = query.text;
    }
    const rows = this.db
      .prepare(
        `SELECT * FROM claims WHERE ${clauses.join(" AND ")}
         ORDER BY created_at ASC, id ASC`,
      )
      .all(params) as ClaimRow[];
    return rows.map((row) => this.rowToClaim(row));
  }

  async claimsChangedSince(since: string, workspaceId?: string): Promise<Claim[]> {
    const cutoff = new Date(since).toISOString();
    const clauses = ["status_changed_at > @cutoff"];
    const params: Record<string, string> = { cutoff };
    if (workspaceId) {
      clauses.push("workspace_id = @workspace_id");
      params.workspace_id = workspaceId;
    }
    const rows = this.db
      .prepare(
        `SELECT * FROM claims WHERE ${clauses.join(" AND ")}
         ORDER BY status_changed_at ASC, id ASC`,
      )
      .all(params) as ClaimRow[];
    return rows.map((row) => this.rowToClaim(row));
  }

  async addEdge(edge: ClaimEdge): Promise<void> {
    const exists = this.db.prepare("SELECT 1 FROM claims WHERE id = ?");
    for (const endpoint of [edge.fromClaim, edge.toClaim]) {
      if (!exists.get(endpoint)) {
        this.fail("addEdge", `claim not found: ${endpoint}`);
      }
    }
    this.db
      .prepare(
        `INSERT OR IGNORE INTO claim_edges (from_claim, to_claim, kind, created_by, created_at)
         VALUES (@from_claim, @to_claim, @kind, @created_by, @created_at)`,
      )
      .run({
        from_claim: edge.fromClaim,
        to_claim: edge.toClaim,
        kind: edge.kind,
        created_by: edge.createdBy,
        created_at: edge.createdAt,
      });
  }

  async listEdges(filter: ClaimEdgeFilter): Promise<ClaimEdge[]> {
    if (filter.toClaims && filter.toClaims.length === 0) return [];
    const clauses: string[] = [];
    const params: Record<string, string> = {};
    if (filter.fromClaim) {
      clauses.push("from_claim = @from_claim");
      params.from_claim = filter.fromClaim;
    }
    if (filter.toClaim) {
      clauses.push("to_claim = @to_claim");
      params.to_claim = filter.toClaim;
    }
    let inClause = "";
    if (filter.toClaims) {
      const placeholders = filter.toClaims.map((_, i) => `@to_claim_${i}`);
      inClause = `to_claim IN (${placeholders.join(", ")})`;
      clauses.push(inClause);
      filter.toClaims.forEach((claimId, i) => {
        params[`to_claim_${i}`] = claimId;
      });
    }
    if (filter.kind) {
      clauses.push("kind = @kind");
      params.kind = filter.kind;
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db
      .prepare(
        `SELECT * FROM claim_edges ${where}
         ORDER BY created_at ASC, from_claim ASC, to_claim ASC, kind ASC`,
      )
      .all(params) as EdgeRow[];
    return rows.map((row) => ({
      fromClaim: row.from_claim,
      toClaim: row.to_claim,
      kind: row.kind as ClaimEdge["kind"],
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async addSubscription(subscription: ClaimSubscription): Promise<void> {
    const exists = this.db
      .prepare("SELECT 1 FROM claims WHERE id = ?")
      .get(subscription.claimId);
    if (!exists) {
      this.fail("addSubscription", `claim not found: ${subscription.claimId}`);
    }
    this.db
      .prepare(
        `INSERT OR IGNORE INTO claim_subscriptions (claim_id, subscriber, created_by, created_at)
         VALUES (@claim_id, @subscriber, @created_by, @created_at)`,
      )
      .run({
        claim_id: subscription.claimId,
        subscriber: subscription.subscriber,
        created_by: subscription.createdBy,
        created_at: subscription.createdAt,
      });
  }

  async removeSubscription(claimId: string, subscriber: string): Promise<void> {
    this.db
      .prepare(
        "DELETE FROM claim_subscriptions WHERE claim_id = ? AND subscriber = ?",
      )
      .run(claimId, subscriber);
  }

  async listSubscriptions(claimId: string): Promise<ClaimSubscription[]> {
    const rows = this.db
      .prepare(
        `SELECT * FROM claim_subscriptions WHERE claim_id = ?
         ORDER BY created_at ASC, subscriber ASC`,
      )
      .all(claimId) as SubscriptionRow[];
    return rows.map((row) => ({
      claimId: row.claim_id,
      subscriber: row.subscriber,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  /** Close the underlying database handle (tests / graceful shutdown). */
  close(): void {
    this.db.close();
  }
}
