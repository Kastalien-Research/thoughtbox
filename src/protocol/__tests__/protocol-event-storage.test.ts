/**
 * SupabaseProtocolEventStorage integration tests
 * (SPEC-REASONING-CHANNEL-HOSTED c2/c3).
 *
 * Runs against the local Supabase stack; skips gracefully when it is not
 * reachable. Covers append + changed_since ordering and, critically, the
 * cross-tenant negative control: one tenant's storage never returns another
 * tenant's events.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createServiceClient,
  ensureTestWorkspace,
  getTestSupabaseConfig,
  isSupabaseAvailable,
  TEST_WORKSPACE_ID,
} from '../../__tests__/supabase-test-helpers.js';
import { SupabaseProtocolEventStorage } from '../protocol-event-storage.js';
import type { ThoughtboxEvent } from '../../events/types.js';

const TENANT_A = TEST_WORKSPACE_ID;
const TENANT_B = '33333333-3333-4333-a333-333333333333';

function evt(
  type: ThoughtboxEvent['type'],
  sessionId: string,
  extra: Record<string, unknown> = {},
): ThoughtboxEvent {
  return {
    source: 'protocol',
    type,
    workspaceId: 'set-by-storage-not-event',
    timestamp: new Date().toISOString(),
    data: { session_id: sessionId, ...extra },
  };
}

function storageFor(tenantWorkspaceId: string): SupabaseProtocolEventStorage {
  return new SupabaseProtocolEventStorage({
    ...getTestSupabaseConfig(),
    tenantWorkspaceId,
  });
}

describe('SupabaseProtocolEventStorage', () => {
  let available = false;
  let service: SupabaseClient;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;
    service = createServiceClient();
    await ensureTestWorkspace(service);

    const { data: users } = await service.auth.admin.listUsers();
    const ownerId = users?.users?.find((u) => u.email === 'test@test.local')?.id;
    await service.from('workspaces').upsert(
      {
        id: TENANT_B,
        name: 'Tenant B',
        slug: 'tenant-b-protocol-events',
        owner_user_id: ownerId,
        status: 'active',
        plan_id: 'free',
      },
      { onConflict: 'id' },
    );
  });

  beforeEach(async () => {
    if (!available) return;
    await service
      .from('protocol_events')
      .delete()
      .in('tenant_workspace_id', [TENANT_A, TENANT_B]);
  });

  it('appends events and returns them oldest-first with an advancing cursor', async () => {
    if (!available) return;
    const storage = storageFor(TENANT_A);

    await storage.append(evt('ulysses_init', 's1'));
    await storage.append(evt('ulysses_outcome', 's1', { S: 2 }));

    const events = await storage.changedSince(0);
    expect(events.map((e) => e.type)).toEqual(['ulysses_init', 'ulysses_outcome']);
    expect(events[1]!.cursor).toBeGreaterThan(events[0]!.cursor);
    expect(events[1]!.data.S).toBe(2);

    // The tail cursor returns nothing new.
    const after = await storage.changedSince(events[1]!.cursor);
    expect(after).toEqual([]);
  });

  it("never returns another tenant's events (cross-tenant negative control)", async () => {
    if (!available) return;
    const a = storageFor(TENANT_A);
    const b = storageFor(TENANT_B);

    await a.append(evt('theseus_init', 'session-a'));
    await b.append(evt('theseus_init', 'session-b'));

    const aEvents = await a.changedSince(0);
    const bEvents = await b.changedSince(0);

    expect(aEvents).toHaveLength(1);
    expect(bEvents).toHaveLength(1);
    expect(aEvents[0]!.data.session_id).toBe('session-a');
    expect(bEvents[0]!.data.session_id).toBe('session-b');
  });

  it('honors the limit and pages forward by cursor', async () => {
    if (!available) return;
    const storage = storageFor(TENANT_A);
    for (let i = 0; i < 5; i++) {
      await storage.append(evt('ulysses_reflect', 's1', { n: i }));
    }

    const firstPage = await storage.changedSince(0, 2);
    expect(firstPage).toHaveLength(2);
    expect(firstPage.map((e) => e.data.n)).toEqual([0, 1]);

    const secondPage = await storage.changedSince(firstPage[1]!.cursor, 2);
    expect(secondPage.map((e) => e.data.n)).toEqual([2, 3]);
  });
});
