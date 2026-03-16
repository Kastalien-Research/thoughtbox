import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

/**
 * Resolves an incoming API key (e.g., tbx_abc123...xyz) to a workspace ID.
 * 
 * 1. Extracts the prefix.
 * 2. Queries the `api_keys` table using a Service Role key.
 * 3. Verifies the full key against the stored `key_hash` using bcrypt.
 * 
 * @param providedKey The raw API key provided by the client.
 * @returns The `workspace_id` associated with the key.
 * @throws Error if the key is invalid, inactive, or not found.
 */
export async function resolveApiKeyToWorkspace(providedKey: string): Promise<string> {
  if (!providedKey || !providedKey.startsWith('tbx_')) {
    throw new Error('Invalid API key format');
  }

  // Extract the prefix (first 12 characters including 'tbx_')
  // Format: tbx_prefix_rest_of_key (e.g., tbx_a1b2c3d4_...)
  const parts = providedKey.split('_');
  if (parts.length < 3) {
    throw new Error('Invalid API key format');
  }
  
  const prefix = parts[1];

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Server misconfiguration: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // Create an admin client that bypasses RLS to query the api_keys table
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  const { data, error } = await adminClient
    .from('api_keys')
    .select('workspace_id, key_hash, status')
    .eq('prefix', prefix)
    .single();

  if (error || !data) {
    throw new Error('Invalid API key');
  }

  if (data.status !== 'active') {
    throw new Error('API key is not active');
  }

  const isValid = await bcrypt.compare(providedKey, data.key_hash);
  if (!isValid) {
    throw new Error('Invalid API key');
  }

  return data.workspace_id;
}
