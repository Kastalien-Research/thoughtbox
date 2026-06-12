/**
 * Live Realtime propagation for the claims table (SPEC-AGX-SUBSTRATE B3,
 * claim c2 — the locally-verifiable half).
 *
 * These tests need BOTH the local Supabase stack AND its Realtime
 * service. The repo's CI and the documented local workflow start the
 * stack with `supabase start -x realtime,...` (.github/workflows/ci.yml),
 * so Realtime availability is detected at runtime and the suite skips
 * with a reason when the websocket cannot subscribe. Full c2 evidence
 * (two live MCP clients over hosted Realtime plus a cross-tenant
 * negative control) is deploy-gated; the verification steps are in the
 * PR body, mirroring #380.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { SupabaseClaimStorage } from '../supabase-claim-storage.js';
import { SupabaseHubStorage } from '../../hub/supabase-hub-storage.js';
import type { Claim } from '../types.js';
import {
  createServiceClient,
  ensureTestWorkspace,
  isSupabaseAvailable,
  SUPABASE_TEST_ANON_KEY,
  SUPABASE_TEST_URL,
  SUPABASE_TEST_SERVICE_ROLE_KEY,
  TEST_WORKSPACE_ID,
} from '../../__tests__/supabase-test-helpers.js';

const TENANT_B_WORKSPACE_ID = '22222222-2222-4222-a222-222222222222';
const SUBSCRIBE_TIMEOUT_MS = 5_000;
const EVENT_TIMEOUT_MS = 10_000;
const SILENCE_WINDOW_MS = 2_500;
/**
 * After SUBSCRIBED, the walrus subscription pipeline still needs a beat
 * before changes flow — several seconds on a cold Realtime container
 * (observed locally: 500ms is too short right after `supabase start`).
 */
const SETTLE_MS = 2_000;

type ClaimChangePayload = { new: Record<string, unknown> };

function makeClaim(workspaceId: string, statement: string): Claim {
  const now = new Date().toISOString();
  return {
    id: `claim-${randomUUID()}`,
    workspaceId,
    type: 'assumption',
    statement,
    status: 'asserted',
    evidenceRefs: [],
    createdBy: 'agent-realtime',
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
  };
}

function makeClaimStorage(tenantWorkspaceId: string): SupabaseClaimStorage {
  return new SupabaseClaimStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId,
  });
}

/** Claims FK to hub_workspaces: create the coordination space first. */
async function createHubWorkspace(tenantWorkspaceId: string): Promise<string> {
  const hubStorage = new SupabaseHubStorage({
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
    tenantWorkspaceId,
  });
  const now = new Date().toISOString();
  const agentId = `agent-${randomUUID()}`;
  await hubStorage.saveAgent({
    agentId,
    name: 'claims-realtime',
    role: 'coordinator',
    registeredAt: now,
  });
  const workspaceId = randomUUID();
  await hubStorage.saveWorkspace({
    id: workspaceId,
    name: 'claims realtime workspace',
    description: 'claim realtime propagation tests',
    createdBy: agentId,
    mainSessionId: randomUUID(),
    agents: [],
    createdAt: now,
    updatedAt: now,
  });
  return workspaceId;
}

async function cleanupClaimTables(): Promise<void> {
  const client = createServiceClient();
  await client.from('claims').delete().neq('id', '');
  await client.from('hub_workspaces').delete().neq('id', '');
  await client.from('hub_agents').delete().neq('agent_id', '');
}

async function ensureTenantBWorkspace(): Promise<void> {
  const client = createServiceClient();
  const { data: users } = await client.auth.admin.listUsers();
  const testUser = users?.users?.find(u => u.email === 'test@test.local');
  if (!testUser) throw new Error('Test user missing; run ensureTestWorkspace first');
  const { error } = await client.from('workspaces').upsert(
    {
      id: TENANT_B_WORKSPACE_ID,
      name: 'Test Workspace B',
      slug: 'test-workspace-b',
      owner_user_id: testUser.id,
      status: 'active',
      plan_id: 'free',
    },
    { onConflict: 'id' },
  );
  if (error) throw new Error(`Failed to create tenant B workspace: ${error.message}`);
}

/** Make the test user a member of tenant A only (RLS gates Realtime). */
async function ensureTenantAMembership(): Promise<void> {
  const client = createServiceClient();
  const { data: users } = await client.auth.admin.listUsers();
  const testUser = users?.users?.find(u => u.email === 'test@test.local');
  if (!testUser) throw new Error('Test user missing; run ensureTestWorkspace first');
  const { error } = await client.from('workspace_memberships').upsert(
    {
      workspace_id: TEST_WORKSPACE_ID,
      user_id: testUser.id,
      role: 'owner',
    },
    { onConflict: 'workspace_id,user_id', ignoreDuplicates: true },
  );
  if (error) throw new Error(`Failed to create membership: ${error.message}`);
  await client
    .from('workspace_memberships')
    .delete()
    .eq('workspace_id', TENANT_B_WORKSPACE_ID)
    .eq('user_id', testUser.id);
}

function subscribeOrFail(channel: RealtimeChannel): Promise<string> {
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve('TIMED_OUT'), SUBSCRIBE_TIMEOUT_MS);
    channel.subscribe(status => {
      if (
        status === 'SUBSCRIBED' ||
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        clearTimeout(timer);
        resolve(status);
      }
    });
  });
}

async function isRealtimeAvailable(client: SupabaseClient): Promise<boolean> {
  const probe = client.channel(`probe-${randomUUID()}`);
  const status = await subscribeOrFail(probe);
  await client.removeChannel(probe);
  return status === 'SUBSCRIBED';
}

/**
 * The postgres_changes pipeline lags several seconds after a cold Realtime
 * container start, even once channels report SUBSCRIBED (observed locally:
 * the first delivery after `supabase start` can take >10s). Warm it up —
 * and prove end-to-end delivery — by touching a scratch claim until an
 * UPDATE event actually arrives.
 */
async function warmUpPostgresChanges(): Promise<boolean> {
  await ensureTestWorkspace();
  const workspaceId = await createHubWorkspace(TEST_WORKSPACE_ID);
  const storage = makeClaimStorage(TEST_WORKSPACE_ID);
  const scratch = makeClaim(workspaceId, 'realtime warm-up scratch');
  await storage.saveClaim(scratch);

  const client = createServiceClient();
  let delivered = false;
  const channel = client.channel(`claims-warmup-${randomUUID()}`);
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'claims' },
    () => {
      delivered = true;
    },
  );
  if ((await subscribeOrFail(channel)) !== 'SUBSCRIBED') {
    await client.removeChannel(channel);
    return false;
  }
  const claim = await storage.getClaim(scratch.id);
  for (let attempt = 0; attempt < 15 && !delivered; attempt++) {
    claim!.updatedAt = new Date().toISOString();
    await storage.saveClaim(claim!);
    await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  }
  await client.removeChannel(channel);
  return delivered;
}

async function invalidateClaim(
  storage: SupabaseClaimStorage,
  claimId: string,
): Promise<void> {
  const claim = await storage.getClaim(claimId);
  if (!claim) throw new Error(`Claim not found: ${claimId}`);
  const now = new Date().toISOString();
  claim.status = 'invalidated';
  claim.updatedAt = now;
  claim.statusChangedAt = now;
  await storage.saveClaim(claim);
}

const SKIP_REASON =
  'Realtime service unavailable: the local stack runs `supabase start -x realtime,...` ' +
  '(see .github/workflows/ci.yml). Full c2 evidence is deploy-gated; see the PR body.';

describe('claims Realtime propagation (live local stack)', () => {
  let available = false;
  const clients: SupabaseClient[] = [];

  function trackClient(client: SupabaseClient): SupabaseClient {
    clients.push(client);
    return client;
  }

  beforeAll(async () => {
    if (!(await isSupabaseAvailable())) return;
    const probeClient = createServiceClient();
    if (!(await isRealtimeAvailable(probeClient))) return;
    available = await warmUpPostgresChanges();
  }, 60_000);

  beforeEach(async () => {
    if (!available) return;
    await cleanupClaimTables();
    await ensureTestWorkspace();
  });

  afterEach(async () => {
    await Promise.all(clients.map(client => client.removeAllChannels()));
    clients.length = 0;
  });

  it(
    'an invalidation UPDATE on claims is observed by a Realtime subscriber',
    { timeout: 30_000 },
    async ({ skip }) => {
      if (!available) skip(SKIP_REASON);

      const workspaceId = await createHubWorkspace(TEST_WORKSPACE_ID);
      const storage = makeClaimStorage(TEST_WORKSPACE_ID);
      const claim = makeClaim(workspaceId, 'observed over realtime');
      await storage.saveClaim(claim);

      const subscriber = trackClient(createServiceClient());
      const received = new Promise<ClaimChangePayload>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('No claims UPDATE event within timeout')),
          EVENT_TIMEOUT_MS,
        );
        const channel = subscriber.channel(`claims-watch-${randomUUID()}`);
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'claims',
            filter: `tenant_workspace_id=eq.${TEST_WORKSPACE_ID}`,
          },
          payload => {
            clearTimeout(timer);
            resolve(payload as unknown as ClaimChangePayload);
          },
        );
        void subscribeOrFail(channel).then(status => {
          if (status !== 'SUBSCRIBED') {
            clearTimeout(timer);
            reject(new Error(`Subscribe failed: ${status}`));
          }
        });
      });

      // Give the subscription pipeline a beat to settle, then invalidate.
      await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
      await invalidateClaim(storage, claim.id);

      const payload = await received;
      expect(payload.new.id).toBe(claim.id);
      expect(payload.new.status).toBe('invalidated');
    },
  );

  it(
    'a member of tenant A observes tenant-A changes but not tenant-B changes',
    { timeout: 30_000 },
    async ({ skip }) => {
      if (!available) skip(SKIP_REASON);

      await ensureTenantBWorkspace();
      await ensureTenantAMembership();

      const workspaceA = await createHubWorkspace(TEST_WORKSPACE_ID);
      const workspaceB = await createHubWorkspace(TENANT_B_WORKSPACE_ID);
      const storageA = makeClaimStorage(TEST_WORKSPACE_ID);
      const storageB = makeClaimStorage(TENANT_B_WORKSPACE_ID);
      const claimA = makeClaim(workspaceA, 'tenant A claim');
      const claimB = makeClaim(workspaceB, 'tenant B claim');
      await storageA.saveClaim(claimA);
      await storageB.saveClaim(claimB);

      // Authenticated member of tenant A only; RLS scopes what Realtime
      // delivers (no client-side filter — authorization is the control).
      const memberClient = trackClient(
        createClient(SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        }),
      );
      const { data: session, error: signInError } =
        await memberClient.auth.signInWithPassword({
          email: 'test@test.local',
          password: 'test-password-123',
        });
      if (signInError) throw new Error(`Sign-in failed: ${signInError.message}`);
      await memberClient.realtime.setAuth(session.session!.access_token);

      const observed: ClaimChangePayload[] = [];
      const channel = memberClient.channel(`claims-member-${randomUUID()}`);
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'claims' },
        payload => observed.push(payload as unknown as ClaimChangePayload),
      );
      const status = await subscribeOrFail(channel);
      expect(status).toBe('SUBSCRIBED');
      await new Promise(resolve => setTimeout(resolve, SETTLE_MS));

      // Negative control first: a tenant-B transition stays invisible.
      await invalidateClaim(storageB, claimB.id);
      await new Promise(resolve => setTimeout(resolve, SILENCE_WINDOW_MS));
      expect(observed).toEqual([]);

      // Positive control: the same subscriber sees a tenant-A transition.
      await invalidateClaim(storageA, claimA.id);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('No tenant-A claims UPDATE event within timeout')),
          EVENT_TIMEOUT_MS,
        );
        const poll = setInterval(() => {
          if (observed.length > 0) {
            clearTimeout(timer);
            clearInterval(poll);
            resolve();
          }
        }, 100);
      });
      expect(observed).toHaveLength(1);
      expect(observed[0]!.new.id).toBe(claimA.id);
      expect(observed[0]!.new.status).toBe('invalidated');
    },
  );
});
