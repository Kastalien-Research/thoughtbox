/**
 * Integration test: proves persistence works end-to-end.
 * Creates a session, saves a thought, reads it back.
 * Runs against local Supabase — not mocks.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: SUPABASE_SERVICE_KEY },
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

describe('Persistence round-trip (integration)', () => {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let workspaceId: string;
  let sessionId: string;
  let userId: string;
  let available = false;

  beforeAll(async () => {
    available = await isSupabaseAvailable();
    if (!available) return;

    // Create a test user via Supabase Auth admin API
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({
        email: `roundtrip-${Date.now()}@test.local`,
        password: 'test-password-123',
        email_confirm: true,
      }),
    });
    const user = await res.json();
    userId = user.id;

    // Create a workspace
    const { data: ws, error: wsErr } = await client
      .from('workspaces')
      .insert({
        name: 'test-roundtrip',
        slug: `test-${Date.now()}`,
        owner_user_id: userId,
      })
      .select()
      .single();

    if (wsErr) throw new Error(`Failed to create workspace: ${wsErr.message}`);
    workspaceId = ws.id;
  });

  it('creates a session', async (ctx) => {
    if (!available) ctx.skip();
    const { data, error } = await client
      .from('sessions')
      .insert({
        workspace_id: workspaceId,
        title: 'Round-trip test session',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.title).toBe('Round-trip test session');
    expect(data!.workspace_id).toBe(workspaceId);
    sessionId = data!.id;
  });

  it('saves a thought', async (ctx) => {
    if (!available) ctx.skip();
    const { data, error } = await client
      .from('thoughts')
      .insert({
        session_id: sessionId,
        workspace_id: workspaceId,
        thought: 'This is a test thought that proves persistence works.',
        thought_number: 1,
        total_thoughts: 1,
        next_thought_needed: false,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.thought).toBe('This is a test thought that proves persistence works.');
  });

  it('reads the thought back', async (ctx) => {
    if (!available) ctx.skip();
    const { data, error } = await client
      .from('thoughts')
      .select()
      .eq('session_id', sessionId)
      .eq('workspace_id', workspaceId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.thought).toBe('This is a test thought that proves persistence works.');
    expect(data!.thought_number).toBe(1);
  });

  it('reads the session back', async (ctx) => {
    if (!available) ctx.skip();
    const { data, error } = await client
      .from('sessions')
      .select()
      .eq('id', sessionId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.title).toBe('Round-trip test session');
  });
});
