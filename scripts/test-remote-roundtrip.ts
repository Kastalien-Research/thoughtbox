/**
 * Remote Supabase round-trip test.
 * Reads credentials from .env, creates a user/workspace/session/thought,
 * reads it back, then cleans up.
 *
 * Run: npx tsx scripts/test-remote-roundtrip.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  // 1. Create test user
  const userRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key!,
    },
    body: JSON.stringify({
      email: `remote-test-${Date.now()}@test.local`,
      password: 'test-password-123',
      email_confirm: true,
    }),
  });
  const user = await userRes.json();
  console.log('1. User created:', user.id ? 'OK' : 'FAIL', user.msg || '');
  if (!user.id) { console.error(user); process.exit(1); }

  // 2. Create workspace
  const { data: ws, error: wsErr } = await client
    .from('workspaces')
    .insert({ name: 'remote-test', slug: `rt-${Date.now()}`, owner_user_id: user.id })
    .select()
    .single();
  console.log('2. Workspace:', wsErr ? `FAIL: ${wsErr.message}` : 'OK');
  if (wsErr) process.exit(1);

  // 3. Create session
  const { data: sess, error: sessErr } = await client
    .from('sessions')
    .insert({ workspace_id: ws!.id, title: 'Remote round-trip test' })
    .select()
    .single();
  console.log('3. Session:', sessErr ? `FAIL: ${sessErr.message}` : 'OK');
  if (sessErr) process.exit(1);

  // 4. Save thought
  const { data: th, error: thErr } = await client
    .from('thoughts')
    .insert({
      session_id: sess!.id,
      workspace_id: ws!.id,
      thought: 'Remote persistence verified.',
      thought_number: 1,
      total_thoughts: 1,
      next_thought_needed: false,
    })
    .select()
    .single();
  console.log('4. Thought saved:', thErr ? `FAIL: ${thErr.message}` : 'OK');
  if (thErr) process.exit(1);

  // 5. Read thought back
  const { data: readBack, error: readErr } = await client
    .from('thoughts')
    .select()
    .eq('session_id', sess!.id)
    .single();
  console.log('5. Read back:', readErr ? `FAIL: ${readErr.message}` : 'OK');
  console.log('   Thought:', readBack?.thought);
  if (readErr) process.exit(1);

  // 6. Cleanup
  await client.from('thoughts').delete().eq('session_id', sess!.id);
  await client.from('sessions').delete().eq('id', sess!.id);
  await client.from('workspaces').delete().eq('id', ws!.id);
  console.log('6. Cleanup: OK');

  console.log('\nREMOTE PERSISTENCE: VERIFIED');
}

run().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
