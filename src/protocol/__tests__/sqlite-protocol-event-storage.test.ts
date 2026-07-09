/**
 * SqliteProtocolEventStorage tests (SPEC-REASONING-CHANNEL-HOSTED c2/c3,
 * local-mode durable counterpart).
 *
 * Covers the same pull contract as the Supabase backend — append +
 * changed_since ordering, session narrowing, limit paging — plus the reason
 * this backend exists: the event log survives a process restart (a new
 * storage instance over the same database file).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { SqliteProtocolEventStorage } from '../sqlite-protocol-event-storage.js';
import type { ThoughtboxEvent } from '../../events/types.js';

function evt(
  type: ThoughtboxEvent['type'],
  sessionId: string,
  extra: Record<string, unknown> = {},
): ThoughtboxEvent {
  return {
    source: 'protocol',
    type,
    workspaceId: 'ws-local',
    timestamp: new Date().toISOString(),
    data: { session_id: sessionId, ...extra },
  };
}

function freshEventsDbPath(): string {
  return path.join(mkdtempSync(path.join(os.tmpdir(), 'tb-events-')), 'protocol-events.db');
}

describe('SqliteProtocolEventStorage', () => {
  let dbPath: string;
  let storage: SqliteProtocolEventStorage;

  beforeEach(() => {
    dbPath = freshEventsDbPath();
    storage = new SqliteProtocolEventStorage(dbPath);
  });

  it('appends events and returns them oldest-first with an advancing cursor', async () => {
    await storage.append(evt('ulysses_init', 's1'));
    await storage.append(evt('ulysses_outcome', 's1', { S: 2 }));

    const events = await storage.changedSince(0);
    expect(events.map((e) => e.type)).toEqual(['ulysses_init', 'ulysses_outcome']);
    expect(events[1]!.cursor).toBeGreaterThan(events[0]!.cursor);
    expect(events[1]!.data.S).toBe(2);
    expect(events[0]!.workspaceId).toBe('ws-local');

    // The tail cursor returns nothing new.
    const after = await storage.changedSince(events[1]!.cursor);
    expect(after).toEqual([]);
  });

  it('narrows to one session when sessionId is passed, unchanged when absent', async () => {
    await storage.append(evt('ulysses_init', 's1'));
    await storage.append(evt('ulysses_init', 's2'));
    await storage.append(evt('ulysses_outcome', 's1', { S: 1 }));

    const all = await storage.changedSince(0);
    expect(all).toHaveLength(3);

    const s1Only = await storage.changedSince(0, undefined, 's1');
    expect(s1Only.map((e) => e.data.session_id)).toEqual(['s1', 's1']);
    expect(s1Only.map((e) => e.type)).toEqual(['ulysses_init', 'ulysses_outcome']);

    const s2Only = await storage.changedSince(0, undefined, 's2');
    expect(s2Only).toHaveLength(1);
    expect(s2Only[0]!.data.session_id).toBe('s2');
  });

  it('honors the limit and pages forward by cursor', async () => {
    for (let i = 0; i < 5; i++) {
      await storage.append(evt('ulysses_reflect', 's1', { n: i }));
    }

    const firstPage = await storage.changedSince(0, 2);
    expect(firstPage).toHaveLength(2);
    expect(firstPage.map((e) => e.data.n)).toEqual([0, 1]);

    const secondPage = await storage.changedSince(firstPage[1]!.cursor, 2);
    expect(secondPage.map((e) => e.data.n)).toEqual([2, 3]);
  });

  it('the event log and cursors survive a restart (new storage on the same file)', async () => {
    await storage.append(evt('theseus_init', 's1'));
    await storage.append(evt('theseus_checkpoint', 's1', { n: 1 }));
    const beforeRestart = await storage.changedSince(0);
    expect(beforeRestart).toHaveLength(2);
    storage.close();

    // New storage instance over the same database file — a process restart.
    const after = new SqliteProtocolEventStorage(dbPath);
    const events = await after.changedSince(0);
    expect(events.map((e) => e.type)).toEqual(['theseus_init', 'theseus_checkpoint']);
    // Cursors are stable across the restart: a channel client that saved
    // its cursor before the restart resumes without replay or loss.
    expect(events.map((e) => e.cursor)).toEqual(beforeRestart.map((e) => e.cursor));
    expect(await after.changedSince(beforeRestart[0]!.cursor)).toHaveLength(1);

    // Appends continue with monotonically increasing cursors.
    await after.append(evt('theseus_complete', 's1'));
    const all = await after.changedSince(0);
    expect(all).toHaveLength(3);
    expect(all[2]!.cursor).toBeGreaterThan(all[1]!.cursor);
  });
});
