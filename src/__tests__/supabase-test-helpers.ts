/**
 * Shared test helpers for Supabase integration tests.
 *
 * Connects to a local Supabase instance started via `supabase start`.
 * All tests use the real Postgres database — no mocking of @supabase/supabase-js.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

// Local Supabase default configuration (from `supabase start` output)
export const SUPABASE_TEST_URL =
  process.env.SUPABASE_TEST_URL || 'http://127.0.0.1:54321';

export const SUPABASE_TEST_ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const SUPABASE_TEST_SERVICE_ROLE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const SUPABASE_TEST_JWT_SECRET =
  process.env.SUPABASE_TEST_JWT_SECRET ||
  'super-secret-jwt-token-with-at-least-32-characters-long';

export const SUPABASE_TEST_DB_URL =
  process.env.SUPABASE_TEST_DB_URL ||
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

/**
 * Create a service_role client for setup/teardown operations.
 * Bypasses RLS policies.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_TEST_URL, SUPABASE_TEST_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Create an authenticated client scoped to a specific project.
 * Mints a JWT with `project` claim and uses it for RLS enforcement.
 */
export function createTestClient(project: string): SupabaseClient {
  const token = mintProjectJwt(project);
  return createClient(SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}

/**
 * Mint a short-lived JWT for a project scope.
 */
export function mintProjectJwt(project: string): string {
  return jwt.sign(
    {
      role: 'authenticated',
      project,
      iss: 'supabase-demo',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SUPABASE_TEST_JWT_SECRET,
  );
}

/**
 * Truncate all product tables (CASCADE) via service_role client.
 * Call this in beforeEach/afterEach to ensure a clean slate.
 */
export async function truncateAllTables(
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? createServiceClient();
  // Use rpc to execute raw SQL for truncation
  const { error } = await c.rpc('truncate_test_tables' as never);
  if (error) {
    // Fallback: delete from each table in dependency order
    await c.from('observations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await c.from('relations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await c.from('entities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await c.from('thoughts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await c.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

/**
 * Return config object suitable for SupabaseStorage constructor.
 */
export function getTestSupabaseConfig() {
  return {
    supabaseUrl: SUPABASE_TEST_URL,
    serviceRoleKey: SUPABASE_TEST_SERVICE_ROLE_KEY,
  };
}

/**
 * Check if local Supabase is reachable. Use in test setup to skip
 * gracefully if Supabase isn't running.
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const client = createServiceClient();
    const { error } = await client.from('sessions').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
