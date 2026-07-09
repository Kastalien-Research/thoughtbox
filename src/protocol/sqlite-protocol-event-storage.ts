/**
 * SqliteProtocolEventStorage — durable local protocol-event log
 * (SPEC-REASONING-CHANNEL-HOSTED c2/c3, local-mode counterpart).
 *
 * Hosted mode appends the protocol lifecycle stream to a tenant-scoped
 * Supabase table so the reasoning channel can pull it (changed_since)
 * across replicas. Locally the same stream was SSE-only — gone on restart,
 * so a plugin channel that reconnects after a server restart lost history.
 * This backend persists the identical event stream to
 * `<dataDir>/protocol-events.db` and serves the same pull contract
 * (monotonic rowid cursor, oldest first, optional session narrowing), so
 * the hosted pull-endpoint semantics work locally too.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";
import type { ThoughtboxEvent } from "../events/types.js";
import type {
  ProtocolEventRecord,
  ProtocolEventStorage,
} from "./protocol-event-storage.js";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

interface EventRow {
  id: number;
  source: string;
  type: string;
  workspace_id: string;
  session_id: string | null;
  event_timestamp: string;
  data: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS protocol_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  type TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  session_id TEXT,
  event_timestamp TEXT NOT NULL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_protocol_events_session ON protocol_events(session_id);
`;

export class SqliteProtocolEventStorage implements ProtocolEventStorage {
  private db: Database.Database;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(SCHEMA);
  }

  async append(event: ThoughtboxEvent): Promise<void> {
    const sessionId =
      typeof event.data.session_id === "string" ? event.data.session_id : null;
    this.db
      .prepare(
        `INSERT INTO protocol_events
           (source, type, workspace_id, session_id, event_timestamp, data)
         VALUES (@source, @type, @workspace_id, @session_id, @event_timestamp, @data)`,
      )
      .run({
        source: event.source,
        type: event.type,
        workspace_id: event.workspaceId,
        session_id: sessionId,
        event_timestamp: event.timestamp,
        data: JSON.stringify(event.data),
      });
  }

  async changedSince(
    cursor: number,
    limit = DEFAULT_LIMIT,
    sessionId?: string,
  ): Promise<ProtocolEventRecord[]> {
    const capped = Math.min(Math.max(1, limit), MAX_LIMIT);
    const clauses = ["id > @cursor"];
    const params: Record<string, string | number> = { cursor, limit: capped };
    if (sessionId !== undefined) {
      clauses.push("session_id = @session_id");
      params.session_id = sessionId;
    }
    const rows = this.db
      .prepare(
        `SELECT * FROM protocol_events WHERE ${clauses.join(" AND ")}
         ORDER BY id ASC LIMIT @limit`,
      )
      .all(params) as EventRow[];
    return rows.map((row) => ({
      cursor: row.id,
      source: row.source as ThoughtboxEvent["source"],
      type: row.type as ThoughtboxEvent["type"],
      workspaceId: row.workspace_id,
      timestamp: row.event_timestamp,
      data: JSON.parse(row.data) as Record<string, unknown>,
    }));
  }

  /** Close the underlying database handle (tests / graceful shutdown). */
  close(): void {
    this.db.close();
  }
}
