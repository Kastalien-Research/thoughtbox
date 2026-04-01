import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const STATIC_WORKSPACE_IDS: Record<string, string> = {
  default: '00000000-0000-4000-a000-000000000001',
  'local-dev': '00000000-0000-4000-a000-000000000002',
};

const resolved = new Map<string, string>();

/**
 * Return a real workspace UUID for static-key auth paths.
 *
 * On first call per slug, upserts the workspace row in Supabase
 * (requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY). Subsequent
 * calls return the cached UUID without a DB round-trip.
 *
 * When Supabase is not configured (local FS mode), returns the
 * deterministic UUID directly — no DB call is made because no
 * downstream consumer needs a real FK target.
 */
export async function ensureStaticWorkspace(slug: string): Promise<string> {
  const cached = resolved.get(slug);
  if (cached) return cached;

  const id = STATIC_WORKSPACE_IDS[slug] ?? deterministicUuid(slug);
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const serviceUserId = await getOrCreateServiceUser(client);

    const { error } = await client.from('workspaces').upsert(
      {
        id,
        name: `${slug} workspace`,
        slug: `static-${slug}`,
        owner_user_id: serviceUserId,
        status: 'active',
        plan_id: 'free',
      },
      { onConflict: 'id' },
    );
    if (error) {
      console.error(
        `[static-workspace] Failed to upsert workspace '${slug}': ${error.message}`,
      );
      // Do not cache — allow retry on next request
      return id;
    }
  }

  resolved.set(slug, id);
  return id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateServiceUser(
  client: SupabaseClient<any>,
): Promise<string> {
  const email = 'service@thoughtbox.local';
  const { data: list } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await client.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already registered')) {
      // Lost a concurrent-creation race — re-fetch
      const { data: refetch } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = refetch?.users?.find((u) => u.email === email);
      if (found) return found.id;
    }
    throw new Error(`Cannot create service user: ${error.message}`);
  }
  return data.user.id;
}

function deterministicUuid(input: string): string {
  const hex = crypto.createHash('sha256').update(input).digest('hex');
  const parts = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, '0') + hex.slice(18, 20),
    hex.slice(20, 32),
  ];
  return parts.join('-');
}
